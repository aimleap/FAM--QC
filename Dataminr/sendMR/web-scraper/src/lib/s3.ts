import moment from 'moment';
// @ts-ignore
import { cdn } from 'config';
import { KeeperCredential } from './keeper';
import Logger from './logger';

const AWSSdk = require('aws-sdk');

export interface S3Item {
  name: string;
  extension: string;
  s3mimeType: string;
}

export interface S3Map {
  [index: string]: S3Item;
}

export const fileTypeMap: S3Map = {
  'audio-mpeg': {
    name: 'audio',
    extension: 'mp3',
    s3mimeType: 'audio/mpeg',
  },
  'video-x-flv': {
    name: 'video',
    extension: 'mp4',
    s3mimeType: 'video/mp4',
  },
  'jpeg-image': {
    name: 'image',
    extension: 'jpeg',
    s3mimeType: 'image/jpeg',
  },
};

export const awsClient = cdn.critical_mention.hasOwnProperty('local_s3_endpoint')
  ? new AWSSdk.S3({
    endpoint: cdn.critical_mention.local_s3_endpoint,
    s3ForcePathStyle: true,
  })
  : new AWSSdk.S3();

// s3 bucket path structure: /env/sourceName/fileType/year/month/day/file.mp4
// example: /Test/cm/video/2022/2/1/testfile.mp4

const signerBucketPath = (fileType: string) => `${fileType}/${moment().year()}/${moment().month() + 1}/${moment().date()}`;

export const s3BucketPath = (fileType: string, sourceName: string) => `${cdn[sourceName].s3_bucket}/${cdn[sourceName].path}/${signerBucketPath(fileType)}`;

export const getSignedUrl = (
  sourceName: string,
  filename: string,
  fileType: string,
  fileExtension: string,
  credentials: KeeperCredential[],
): string | null => {
  const options = {
    url: `${cdn[sourceName].url_signer_path}/${signerBucketPath(
      fileType,
    )}/${filename}.${fileExtension}`,
    expires: moment().add(12, 'month').unix(),
  };
  if (credentials === undefined || credentials.length === 0) return null;
  try {
    const cdnCredentials = credentials.filter(
      ({ title }) => title === 'Critical Mentions CDN Creds',
    );
    // @ts-ignore
    const privateKey = cdnCredentials[0].custom_fields.key;
    // @ts-ignore
    const keyPairID = cdnCredentials[0].custom_fields['key-pair-id'];
    const UrlSigner = new AWSSdk.CloudFront.Signer(keyPairID, privateKey);

    return UrlSigner.getSignedUrl(options);
  } catch (e) {
    Logger.info(`Failed to generate signed url for Critical Mention clip: ${e}`);
    return null;
  }
};
