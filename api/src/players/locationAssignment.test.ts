import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { locationMessages } from '../../../shared/location';
import { ApiError, handleError } from '../lib/errors';
import { requirePlayLocation } from './location';
import { putNewPlayer } from './store';
import { playerRoutes } from './routes';

vi.mock('./location', async (original) => ({ ...await original<typeof import('./location')>(), requirePlayLocation: vi.fn() }));
vi.mock('./store', () => ({ getPlayer: vi.fn(), putNewPlayer: vi.fn(), scanPlayers: vi.fn() }));
vi.mock('../lib/env', () => ({ env: { SOLANA_MODE: 'off' } }));

const app = new Hono();
app.route('/', playerRoutes);
app.onError(handleError);
const location = () => ({ lat: 33.45, lng: -111.93, accuracyMeters: 20, capturedAt: new Date().toISOString() });
const join = (body: unknown) => app.request('/players', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); });

describe('server-assigned neighborhoods', () => {
  it('ignores a supplied team and does not store joining coordinates', async () => {
    vi.mocked(requirePlayLocation).mockResolvedValue('north-tempe');
    const result = await join({ nickname: 'Sam', location: location(), neighborhood: 'south-tempe' });
    expect(result.status).toBe(201);
    expect(await result.json()).toMatchObject({ player: { neighborhood: 'north-tempe' } });
    expect(putNewPlayer).toHaveBeenCalledWith(expect.objectContaining({ neighborhood: 'north-tempe', points: 0 }));
    // Joining asks for the looser accuracy limit; a report keeps the strict one.
    expect(requirePlayLocation).toHaveBeenCalledWith(expect.objectContaining({ lat: 33.45 }), 'join');
    const stored = vi.mocked(putNewPlayer).mock.calls[0][0];
    expect(stored).not.toHaveProperty('location');
    expect(stored).not.toHaveProperty('lat');
    expect(stored).not.toHaveProperty('lng');
    expect(stored).not.toHaveProperty('capturedAt');
  });
  it('does not create a remote player', async () => {
    vi.mocked(requirePlayLocation).mockRejectedValue(new ApiError('validation_failed', locationMessages.outside));
    const result = await join({ nickname: 'Sam', location: location() });
    expect(result.status).toBe(400);
    expect(putNewPlayer).not.toHaveBeenCalled();
  });
  it('rejects joining with only a manually selected neighborhood', async () => {
    const result = await join({ nickname: 'Sam', neighborhood: 'north-tempe' });
    expect(result.status).toBe(400);
    expect(requirePlayLocation).not.toHaveBeenCalled();
    expect(putNewPlayer).not.toHaveBeenCalled();
  });
});
