// One S3 client for the photo bucket. Used by upload URLs, labeling, and list photo links.
import { S3Client } from '@aws-sdk/client-s3';
import { env, requireEnv } from '../lib/env';

export const s3 = new S3Client({
  region: env.AWS_REGION,
  // By default the SDK adds a CRC32 checksum to every upload link, worked out for an empty file
  // (x-amz-checksum-crc32=AAAAAA==) because the link is made before the photo exists. The browser
  // then sends a real photo, which that checksum cannot match. WHEN_REQUIRED leaves it out.
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

/** The private photo bucket. Throws if PHOTO_BUCKET is not set. */
export function photoBucket(): string {
  return requireEnv('PHOTO_BUCKET');
}
