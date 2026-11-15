import { describe, expect, it } from 'vitest';
import { type Answer, classify, listRoutes, samplePath } from './liveRoutes';

const unknownRoute: Answer = {
  status: 404,
  body: { error: { code: 'not_found', message: 'That address does not exist.' } },
};

describe('listRoutes', () => {
  it('keeps real routes, drops middleware and the preflight catch-all, and removes repeats', () => {
    const routes = listRoutes([
      { method: 'ALL', path: '*' },
      { method: 'OPTIONS', path: '*' },
      { method: 'GET', path: '/quests/council' },
      { method: 'post', path: '/quests/council/answer' },
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/health' },
    ]);
    expect(routes).toEqual([
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/quests/council' },
      { method: 'POST', path: '/quests/council/answer' },
    ]);
  });
});

describe('samplePath', () => {
  it('fills in every path parameter', () => {
    expect(samplePath('/reports/:id/submit')).toBe('/reports/route-check/submit');
    expect(samplePath('/deals/:partnerId/redeem')).toBe('/deals/route-check/redeem');
    expect(samplePath('/leaderboard')).toBe('/leaderboard');
  });
});

describe('classify', () => {
  it('calls a route missing when the live API gives the unknown-route answer', () => {
    expect(classify(unknownRoute, unknownRoute)).toBe('missing');
  });

  it('calls a route missing on a 404 without the standard error shape', () => {
    expect(classify({ status: 404, body: { message: 'Not Found' } }, unknownRoute)).toBe('missing');
    expect(classify({ status: 404, body: null }, unknownRoute)).toBe('missing');
  });

  it('counts a 404 for an unknown player or report as the route being there', () => {
    const answer = { status: 404, body: { error: { code: 'not_found', message: 'We could not find that player.' } } };
    expect(classify(answer, unknownRoute)).toBe('ok');
  });

  it('counts a rejected request as the route being there', () => {
    const answer = { status: 400, body: { error: { code: 'validation_failed', message: 'playerId is required.' } } };
    expect(classify(answer, unknownRoute)).toBe('ok');
    expect(classify({ status: 200, body: { ok: true } }, unknownRoute)).toBe('ok');
  });

  it('reports a server error', () => {
    expect(classify({ status: 500, body: { error: { code: 'internal', message: 'x' } } }, unknownRoute)).toBe('error');
    expect(classify({ status: 502, body: null }, unknownRoute)).toBe('error');
  });
});
