export const Metrics = {
  SOURCE_NAME_VOLUME: 'source_name_volume',
  SOURCE_NAME_POST_BACKFILLED_VOLUME: 'source_name_post_backfilled_volume',
  SOURCE_NAME_REQUEST_TIME: 'source_name_request_time',
  SOURCE_NAME_RESPONSE_SIZE: 'source_name_response_size',
  PARSER_TYPE_VOLUME: 'parser_type_volume',
  MESSAGE_PROCESSED_TIME: 'message_processed_time',
  S3_UPLOAD_TIME: 's3_upload_time',
  MEDIA_REQUEST_TIME: 'media_request_time',
  MEDIA_STREAM_FAILURE: 'media_stream_failure',
  TWITTER_REQUEST: 'twitter_request_code',
  TWITTER_V1_REQUEST: 'twitter_v1_request_code',
};

export const QUEUE_METRICS = {
  JOB_ACTIVE: 'job_queue_active',
  JOB_COMPLETED: 'job_queue_completed',
  JOB_COMPLETED_PROCESSING_TIME: 'job_completed_processing_time',
  JOB_FAILED: 'job_queue_failed',
  JOB_FAILED_PROCESSING_TIME: 'job_failed_processing_time',
  JOB_PROGRESS: 'job_queue_progress',
  JOB_REMOVED: 'job_queue_removed',
  JOB_STALLED: 'job_queue_stalled',
  JOB_WAITING: 'job_queue_waiting',
};

export const QUEUE_VOLUME = 'queue_volume';

// eslint-disable-next-line no-shadow
export enum MetricsNamesEnum {
  'vkontakte-CODE' = 'vk-response-code',
  'vkontakte-TOKEN' = 'vk-token',
  'vkontakte-ERROR' = 'vk-error',
}
