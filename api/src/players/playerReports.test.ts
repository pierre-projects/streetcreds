import { describe, expect, it } from 'vitest';
import type { Report } from '../../../shared/types';
import { ownReports } from './playerReports';

function report(id: string, fields: Partial<Report>): Report {
  return {
    id,
    playerId: 'player-1',
    photoKey: `reports/player-1/${id}.jpg`,
    lat: 33.42,
    lng: -111.93,
    category: 'pothole',
    severity: 'medium',
    description: 'A pothole.',
    count: 1,
    status: 'open',
    createdAt: '2026-11-14T10:00:00.000Z',
    submittedAt: '2026-11-14T10:01:00.000Z',
    ...fields,
  };
}

describe('ownReports', () => {
  it('returns nothing for a player with no reports', () => {
    expect(ownReports([])).toEqual([]);
  });

  it('drops drafts: a photo that was labeled but never sent in', () => {
    const reports = [report('sent', {}), report('draft', { status: 'draft', lat: null, lng: null, submittedAt: null })];
    expect(ownReports(reports).map((r) => r.id)).toEqual(['sent']);
  });

  it('keeps a report that was merged into another', () => {
    expect(ownReports([report('merged', { status: 'merged' })]).map((r) => r.id)).toEqual(['merged']);
  });

  it('puts the newest first, by when each was sent in', () => {
    const reports = [
      report('middle', { submittedAt: '2026-11-14T12:00:00.000Z' }),
      report('newest', { submittedAt: '2026-11-15T09:00:00.000Z' }),
      report('oldest', { submittedAt: '2026-11-13T09:00:00.000Z' }),
    ];
    expect(ownReports(reports).map((r) => r.id)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('does not change the list it was given', () => {
    const reports = [report('a', { submittedAt: '2026-11-13T09:00:00.000Z' }), report('b', { submittedAt: '2026-11-15T09:00:00.000Z' })];
    ownReports(reports);
    expect(reports.map((r) => r.id)).toEqual(['a', 'b']);
  });
});
