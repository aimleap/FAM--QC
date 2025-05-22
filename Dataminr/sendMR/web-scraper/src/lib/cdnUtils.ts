// @ts-ignore
import { cdn } from 'config';
import { promisify } from 'util';
import request from 'request';
import logger from './logger';
import { awsClient, s3BucketPath } from './s3';
import { streamMetrics } from './criticalMentionMetrics';
import { Metrics, MetricsNamesEnum } from '../constants/metrics';

// wait for x milliseconds
export const delayRequest = async (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const bucketExists = async (bucket: string): Promise<boolean> => {
  const options = {
    Bucket: bucket,
  };
  try {
    await awsClient.headBucket(options).promise();
    logger.info(`s3 Bucket ${bucket} already exists`);
    return true;
  } catch (error: any) {
    if (error.statusCode === 403) {
      logger.info(`s3 Bucket ${bucket} exists but access is denied`);
      return true;
    }
    if (error.statusCode >= 400 && error.statusCode < 500) {
      logger.info(`s3 Bucket ${bucket} does not exist`);
      return false;
    }
    throw error;
  }
};

export const createBucket = async () => {
  try {
    const bucket = cdn.critical_mention.s3_bucket;
    logger.info(`Creating s3 bucket: ${bucket}`);
    const params = {
      Bucket: bucket,
      CreateBucketConfiguration: {
        LocationConstraint: 'us-east-2',
      },
    };
    if (!cdn.critical_mention.hasOwnProperty('local_s3_endpoint') || (await bucketExists(bucket))) return;
    await awsClient.createBucket(params).promise();
    logger.info(`Successfully created s3 bucket: ${bucket}`);
  } catch (error) {
    logger.warn(`Failed to create s3 bucket: ${error}`);
  }
};

export const objectExists = async (filename: string, bucketName: string): Promise<boolean> => {
  try {
    const exist = await awsClient.headObject
      .call(awsClient, {
        Bucket: bucketName,
        Key: filename,
      })
      .promise();
    return typeof exist === 'object';
  } catch (err: any) {
    logger.info(`File ${filename} does not exist in S3 bucket - ${err.code}`);
    return false;
  }
};

const uploadToS3 = async (params: object): Promise<boolean> => {
  let uploadSuccess: boolean;
  try {
    await promisify(awsClient.upload).call(awsClient, params);
    uploadSuccess = true;
  } catch (err: any) {
    logger.warn(`Failed to upload data to S3 - ${err}`);
    uploadSuccess = false;
  }
  return uploadSuccess;
};

const logMetric = async (metricName: string, metric: string, requestTime: number) => {
  const log = streamMetrics(metricName, metric, requestTime);
  await log;
};

export const streamData = async (
  sourceName: string,
  url: string,
  filename: string,
  fileType: string,
  fileExtension: string,
  mimeTypeS3: string,
): Promise<boolean> => {
  const file = `${filename}.${fileExtension}`;
  const doesExist = await objectExists(file, s3BucketPath(fileType, sourceName));
  if (doesExist) return true;
  let body = null;
  let requestTime: number | undefined;
  try {
    const response = await promisify(request).call(request, {
      url,
      method: 'GET',
      encoding: null,
      timeout: 10000,
      time: true,
    });
    body = response.body;
    requestTime = response.timingPhases?.total;
  } catch (e) {
    logger.warn(`Failed to stream ${sourceName} media for file ${url} - ${e}`);
  }
  const totalRequestTime = requestTime === undefined ? 0 : requestTime;
  logger.info(
    `Took ${
      totalRequestTime / 1000
    } seconds to make the request to get ${sourceName} file ${filename}`,
  );
  // logging request time
  await logMetric(
    MetricsNamesEnum[`${sourceName}-REQUEST` as keyof typeof MetricsNamesEnum],
    Metrics.MEDIA_REQUEST_TIME,
    totalRequestTime / 1000,
  );

  if (body === null) {
    await logMetric(
      MetricsNamesEnum[`${sourceName}-STREAM` as keyof typeof MetricsNamesEnum],
      Metrics.MEDIA_STREAM_FAILURE,
      1,
    );
    return false;
  }

  const startTime = Date.now();
  const bucket = s3BucketPath(fileType, sourceName);
  const params = {
    Bucket: bucket,
    Key: file,
    ContentType: mimeTypeS3,
    Body: body,
  };
  const s3Upload = await uploadToS3(params);
  // we don't want to push a message if s3 upload fails;
  if (!s3Upload) return false;
  const msElapsed = Date.now() - startTime;
  logger.info(
    `Uploaded ${filename} file into s3 bucket: ${bucket}. Took ${
      msElapsed / 1000
    } seconds to stream a single file`,
  );
  // logging s3 upload time
  await logMetric(
    MetricsNamesEnum[`${sourceName}-UPLOAD` as keyof typeof MetricsNamesEnum],
    Metrics.S3_UPLOAD_TIME,
    msElapsed / 1000,
  );
  return true;
};
