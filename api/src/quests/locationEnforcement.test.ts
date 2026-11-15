import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { locationMessages } from '../../../shared/location';
import { ApiError, handleError } from '../lib/errors';
import { requirePlayLocation } from '../players/location';
import { getPlayer } from '../players/store';
import { awardPoints } from '../points/awardPoints';
import { checkDealUnlock } from '../deals/checkDealUnlock';
import { getReport, publishReport, setRecentReportTimes } from './reportStore';
import { reportRoutes } from './reportRoutes';

vi.mock('../players/location', async (original) => ({ ...await original<typeof import('../players/location')>(), requirePlayLocation: vi.fn() }));
vi.mock('../players/store', () => ({ getPlayer: vi.fn() }));
vi.mock('../points/awardPoints', () => ({ awardPoints: vi.fn() }));
vi.mock('../deals/checkDealUnlock', () => ({ checkDealUnlock: vi.fn() }));
vi.mock('./reportStore', () => ({ getReport: vi.fn(), publishReport: vi.fn(), putReport: vi.fn(), scanOpenReports: vi.fn(), setRecentReportTimes: vi.fn() }));
vi.mock('./labelPhoto', () => ({ labelPhoto: vi.fn() }));
vi.mock('./s3', () => ({ photoBucket: vi.fn(), s3: {} }));

const app = new Hono();
app.route('/', reportRoutes);
app.onError(handleError);
const player = { id: 'existing-player', nickname: 'Sam', neighborhood: 'asu-campus' as const, points: 25, walletAddress: null, recentReportTimes: [], createdAt: '2026-11-14T00:00:00Z' };
const draft = { id: 'report-1', playerId: player.id, photoKey: 'reports/existing-player/photo.jpg', lat: null, lng: null, category: 'pothole' as const, severity: 'low' as const, description: 'A pothole.', count: 1, status: 'draft' as const, createdAt: player.createdAt, submittedAt: null };
const location = () => ({ lat: 33.418, lng: -111.934, accuracyMeters: 20, capturedAt: new Date().toISOString() });
const submit = (body: unknown) => app.request('/reports/report-1/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

beforeEach(() => { vi.resetAllMocks(); });

describe('report location enforcement before side effects', () => {
  it('rejects an old arbitrary-pin request for an existing player', async () => {
    const result = await submit({ playerId: player.id, lat: 33.418, lng: -111.934 });
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: { code: 'validation_failed', message: locationMessages.required } });
    expect(publishReport).not.toHaveBeenCalled();
    expect(awardPoints).not.toHaveBeenCalled();
  });
  it.each([locationMessages.outside, locationMessages.stale, locationMessages.inaccurate])('blocks publication, points and deal unlocks: %s', async (message) => {
    vi.mocked(requirePlayLocation).mockRejectedValue(new ApiError('validation_failed', message));
    const result = await submit({ playerId: player.id, location: location() });
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: { code: 'validation_failed', message } });
    expect(getReport).not.toHaveBeenCalled();
    expect(getPlayer).not.toHaveBeenCalled();
    expect(publishReport).not.toHaveBeenCalled();
    expect(awardPoints).not.toHaveBeenCalled();
    expect(setRecentReportTimes).not.toHaveBeenCalled();
    expect(checkDealUnlock).not.toHaveBeenCalled();
  });
  it('uses only the device position after validation', async () => {
    const current = location();
    vi.mocked(requirePlayLocation).mockResolvedValue('asu-campus');
    vi.mocked(getReport).mockResolvedValue(draft);
    vi.mocked(getPlayer).mockResolvedValue(player);
    const published = { ...draft, lat: current.lat, lng: current.lng, status: 'open' as const, submittedAt: new Date().toISOString() };
    vi.mocked(publishReport).mockResolvedValue(published);
    vi.mocked(awardPoints).mockResolvedValue({ player: { ...player, points: 75 }, award: { id: 'award-1', playerId: player.id, questType: 'report-new', points: 50, txSignature: null, chainStatus: 'off', createdAt: published.submittedAt } });
    vi.mocked(checkDealUnlock).mockResolvedValue(null);
    const result = await submit({ playerId: player.id, location: current, lat: 40, lng: 50 });
    expect(result.status).toBe(200);
    expect(publishReport).toHaveBeenCalledWith('report-1', expect.objectContaining({ lat: current.lat, lng: current.lng }));
    expect(awardPoints).toHaveBeenCalledOnce();
  });
});
