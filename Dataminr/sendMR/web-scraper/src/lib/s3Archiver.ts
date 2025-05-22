import moment from 'moment';
import awsSdk from 'aws-sdk';
// @ts-ignore
import { archiver } from 'config';
import logger from './logger';

const { s3_bucket: s3Bucket, local_s3_endpoint: localEndpoint = '', path } = archiver;

export const s3Client = localEndpoint !== ''
  ? new awsSdk.S3({
    endpoint: localEndpoint,
    s3ForcePathStyle: true,
  })
  : new awsSdk.S3();

export function getCurrentPath(): string {
  return moment().format('YYYY/MM/DD/HH');
}

export function getS3Path(): string {
  return `${path}/${getCurrentPath()}`;
}

export function getS3Url(filename: string): string {
  return `s3://${s3Bucket}/${filename}`;
}

export async function isBucketExist(bucket: string): Promise<boolean> {
  try {
    await s3Client.headBucket({ Bucket: bucket }).promise();
    logger.info(`S3Bucket ${bucket} exists`);
    return true;
  } catch (e: any) {
    if (e.statusCode === 403) {
      logger.info(`s3 Bucket ${bucket} exists but access is denied`);
      return true;
    }
    logger.error(`failed to locate S3 Bucket ${bucket}`, e);
    return false;
  }
}

export async function createS3Bucket(bucket: string): Promise<boolean> {
  try {
    logger.info(`creating S3Bucket ${bucket}`);
    await s3Client
      .createBucket({
        Bucket: bucket,
        CreateBucketConfiguration: {
          LocationConstraint: 'us-east-2',
        },
      })
      .promise();
    logger.info(`successfully created S3Bucket ${bucket}`);
    return true;
  } catch (e) {
    logger.error('failed to create s3 bucket', e);
    return false;
  }
}

export async function uploadFile(fullPath: string, binary: Buffer): Promise<boolean> {
  try {
    await s3Client
      .putObject({
        Bucket: s3Bucket,
        Key: fullPath,
        Body: binary,
      })
      .promise();
    return true;
  } catch (e) {
    logger.warn(`failed to upload a file ${fullPath}`, e);
    return false;
  }
}

export const S3_ARCHIVE_BUCKET = s3Bucket;
