import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Category, Report } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { isConditionalCheckFailed } from '../players/store';

export async function putReport(report: Report): Promise<void> {
  await db.send(
    new PutCommand({
      TableName: TABLES.reports,
      Item: report,
      ConditionExpression: 'attribute_not_exists(#id)',
      ExpressionAttributeNames: { '#id': 'id' },
    }),
  );
}

export async function getReport(reportId: string): Promise<Report | null> {
  const result = await db.send(new GetCommand({ TableName: TABLES.reports, Key: { id: reportId } }));
  return (result.Item as Report | undefined) ?? null;
}

/** Publish a draft. Returns the open report, or null if it was no longer a draft. */
export async function publishReport(
  reportId: string,
  fields: { lat: number; lng: number; category: Category; submittedAt: string },
): Promise<Report | null> {
  try {
    const result = await db.send(
      new UpdateCommand({
        TableName: TABLES.reports,
        Key: { id: reportId },
        UpdateExpression: 'SET #lat = :lat, #lng = :lng, #category = :category, #status = :open, #submittedAt = :submittedAt',
        ConditionExpression: '#status = :draft',
        ExpressionAttributeNames: {
          '#lat': 'lat',
          '#lng': 'lng',
          '#category': 'category',
          '#status': 'status',
          '#submittedAt': 'submittedAt',
        },
        ExpressionAttributeValues: {
          ':lat': fields.lat,
          ':lng': fields.lng,
          ':category': fields.category,
          ':open': 'open',
          ':draft': 'draft',
          ':submittedAt': fields.submittedAt,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Report;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return null;
    throw error;
  }
}

export async function setRecentReportTimes(playerId: string, times: string[]): Promise<void> {
  await db.send(
    new UpdateCommand({
      TableName: TABLES.players,
      Key: { id: playerId },
      UpdateExpression: 'SET #recentReportTimes = :times',
      ConditionExpression: 'attribute_exists(#id)',
      ExpressionAttributeNames: { '#recentReportTimes': 'recentReportTimes', '#id': 'id' },
      ExpressionAttributeValues: { ':times': times },
    }),
  );
}

export async function scanOpenReports(): Promise<Report[]> {
  const reports: Report[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(
      new ScanCommand({
        TableName: TABLES.reports,
        ExclusiveStartKey: startKey,
        FilterExpression: '#status = :open',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':open': 'open' },
      }),
    );
    reports.push(...((page.Items ?? []) as Report[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return reports;
}
