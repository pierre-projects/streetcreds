// One player's own reports, for the profile screen (GET /players/:id/reports).
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PublicReport, Report } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { photoBucket, s3 } from '../quests/s3';

/** The reports a player has sent in: drafts dropped, newest first. Pure, has a test. */
export function ownReports(reports: Report[]): Report[] {
  const when = (report: Report) => report.submittedAt ?? report.createdAt;
  return reports.filter((report) => report.status !== 'draft').sort((a, b) => when(b).localeCompare(when(a)));
}

/** Every report row made by this player, drafts included. The table has no index, so this is a filtered scan. */
export async function scanReportsByPlayer(playerId: string): Promise<Report[]> {
  const reports: Report[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(
      new ScanCommand({
        TableName: TABLES.reports,
        ExclusiveStartKey: startKey,
        FilterExpression: '#playerId = :playerId',
        ExpressionAttributeNames: { '#playerId': 'playerId' },
        ExpressionAttributeValues: { ':playerId': playerId },
      }),
    );
    reports.push(...((page.Items ?? []) as Report[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return reports;
}

/** Adds a temporary link to each photo, valid for an hour, the same as GET /reports. */
export async function withPhotoUrls(reports: Report[]): Promise<PublicReport[]> {
  const bucket = photoBucket();
  return Promise.all(
    reports.map(async (report) => ({
      ...report,
      photoUrl: await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: report.photoKey }), { expiresIn: 3600 }),
    })),
  );
}
