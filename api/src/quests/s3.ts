// One S3 client for the photo bucket. Used by upload URLs, labeling, and list photo links.
import { S3Client } from '@aws-sdk/client-s3';
import { env, requireEnv } from '../lib/env';

export const s3 = new S3Client({ region: env.AWS_REGION });

/** The private photo bucket. Throws if PHOTO_BUCKET is not set. */
export function photoBucket(): string {
  return requireEnv('PHOTO_BUCKET');
}
