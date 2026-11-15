// Report quest routes (Sarah): upload URL, create draft, submit, list.
import { randomUUID } from 'node:crypto';
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Hono } from 'hono';
import type {
  CreateReportResponse,
  ListReportsResponse,
  SubmitReportResponse,
  UploadUrlResponse,
} from '../../../shared/api';
import { POINTS } from '../../../shared/constants';
import type { PublicReport, Report } from '../../../shared/types';
import { checkDealUnlock } from '../deals/checkDealUnlock';
import { env, requireEnv } from '../lib/env';
import { ApiError } from '../lib/errors';
import { getPlayer } from '../players/store';
import { checkReportLimit } from '../players/rateLimit';
import { awardPoints } from '../points/awardPoints';
import { labelPhoto } from './labelPhoto';
import { getReport, publishReport, putReport, scanOpenReports, setRecentReportTimes } from './reportStore';
import { CreateReportSchema, SubmitReportSchema } from './schemas';

export const reportRoutes = new Hono();

function s3(): S3Client {
  return new S3Client({ region: env.AWS_REGION });
}

reportRoutes.get('/upload-url', async (c) => {
  const playerId = c.req.query('playerId');
  if (!playerId) throw new ApiError('validation_failed', 'playerId is required.');
  const player = await getPlayer(playerId);
  if (!player) throw new ApiError('not_found', 'We could not find that player.');

  const bucket = requireEnv('PHOTO_BUCKET');
  const photoKey = `reports/${playerId}/${randomUUID()}.jpg`;
  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: bucket,
      Key: photoKey,
      ContentType: 'image/jpeg',
    }),
    { expiresIn: 300 },
  );
  const body: UploadUrlResponse = { uploadUrl, photoKey };
  return c.json(body);
});

reportRoutes.post('/reports', async (c) => {
  const input = CreateReportSchema.parse(await c.req.json());
  const player = await getPlayer(input.playerId);
  if (!player) throw new ApiError('not_found', 'We could not find that player.');

  const prefix = `reports/${input.playerId}/`;
  if (!input.photoKey.startsWith(prefix)) {
    throw new ApiError('validation_failed', 'That photo does not belong to this player.');
  }

  const now = new Date();
  const { allowed } = checkReportLimit(player.recentReportTimes, now);
  if (!allowed) throw new ApiError('rate_limited');

  const label = await labelPhoto(input.photoKey);
  if (!label.isStreetProblem) throw new ApiError('not_street_problem');

  const report: Report = {
    id: randomUUID(),
    playerId: input.playerId,
    photoKey: input.photoKey,
    lat: null,
    lng: null,
    category: label.category,
    severity: label.severity,
    description: label.description,
    count: 1,
    status: 'draft',
    createdAt: now.toISOString(),
    submittedAt: null,
  };
  await putReport(report);
  const body: CreateReportResponse = { report };
  return c.json(body, 201);
});

reportRoutes.post('/reports/:id/submit', async (c) => {
  const reportId = c.req.param('id');
  const input = SubmitReportSchema.parse(await c.req.json());
  const draft = await getReport(reportId);
  if (!draft || draft.playerId !== input.playerId) {
    throw new ApiError('not_found', 'We could not find that report.');
  }
  if (draft.status !== 'draft') throw new ApiError('already_submitted');

  const player = await getPlayer(input.playerId);
  if (!player) throw new ApiError('not_found', 'We could not find that player.');

  const now = new Date();
  const { times } = checkReportLimit(player.recentReportTimes, now);
  const category = input.category ?? draft.category;
  const published = await publishReport(reportId, {
    lat: input.lat,
    lng: input.lng,
    category,
    submittedAt: now.toISOString(),
  });
  if (!published) throw new ApiError('already_submitted');

  const { award, player: awardedPlayer } = await awardPoints(
    input.playerId,
    POINTS['report-new'],
    'report-new',
    published.id,
  );
  await setRecentReportTimes(input.playerId, [...times, now.toISOString()]);

  let unlock = null;
  try {
    unlock = await checkDealUnlock(input.playerId, input.lat, input.lng, published.id);
  } catch (error) {
    // Unlock is a bonus; a deals-table miss must not undo the report award.
    console.error(JSON.stringify({ level: 'error', where: 'checkDealUnlock', message: String(error) }));
  }

  // Re-read player in case unlock path did nothing; awardedPlayer already has new points.
  const body: SubmitReportResponse = {
    report: published,
    award,
    player: awardedPlayer,
    merged: false,
    ...(unlock ? { unlock } : {}),
  };
  return c.json(body);
});

reportRoutes.get('/reports', async (c) => {
  const bucket = requireEnv('PHOTO_BUCKET');
  const open = await scanOpenReports();
  open.sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt));
  const sliced = open.slice(0, 200);
  const reports: PublicReport[] = await Promise.all(
    sliced.map(async (report) => {
      const photoUrl = await getSignedUrl(
        s3(),
        new GetObjectCommand({ Bucket: bucket, Key: report.photoKey }),
        { expiresIn: 3600 },
      );
      return { ...report, photoUrl };
    }),
  );
  const body: ListReportsResponse = { reports };
  return c.json(body);
});
