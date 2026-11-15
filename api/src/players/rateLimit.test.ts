import { describe, expect, it } from 'vitest';
import { checkReportLimit } from './rateLimit';

const NOW = new Date('2026-11-14T18:00:00.000Z');
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

describe('checkReportLimit', () => {
  it('allows a player with no reports', () => {
    expect(checkReportLimit([], NOW)).toEqual({ allowed: true, times: [] });
  });

  it('drops times older than one hour', () => {
    const result = checkReportLimit([minutesAgo(90), minutesAgo(61), minutesAgo(59), minutesAgo(5)], NOW);
    expect(result.times).toEqual([minutesAgo(59), minutesAgo(5)]);
    expect(result.allowed).toBe(true);
  });

  it('drops a time exactly one hour old', () => {
    expect(checkReportLimit([minutesAgo(60)], NOW).times).toEqual([]);
  });

  it('lets the fifth report through', () => {
    const four = [minutesAgo(50), minutesAgo(40), minutesAgo(30), minutesAgo(20)];
    expect(checkReportLimit(four, NOW).allowed).toBe(true);
  });

  it('stops the sixth report', () => {
    const five = [minutesAgo(50), minutesAgo(40), minutesAgo(30), minutesAgo(20), minutesAgo(10)];
    expect(checkReportLimit(five, NOW).allowed).toBe(false);
  });

  it('allows again once old reports fall outside the hour', () => {
    const five = [minutesAgo(70), minutesAgo(65), minutesAgo(30), minutesAgo(20), minutesAgo(10)];
    const result = checkReportLimit(five, NOW);
    expect(result.allowed).toBe(true);
    expect(result.times).toHaveLength(3);
  });

  it('ignores anything that is not a time', () => {
    expect(checkReportLimit(['not a date', minutesAgo(5)], NOW).times).toEqual([minutesAgo(5)]);
  });

  it('does not change the list it was given', () => {
    const input = [minutesAgo(90), minutesAgo(5)];
    checkReportLimit(input, NOW);
    expect(input).toHaveLength(2);
  });
});
