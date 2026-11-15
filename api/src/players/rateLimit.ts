// The report rate limit: at most REPORT_LIMIT_PER_HOUR reports per player in any one hour.
// Pure: no database, no clock of its own. Sarah's report routes call it (docs/TECHNICAL.md section 6).
import { REPORT_LIMIT_PER_HOUR } from '../../../shared/constants';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * @param recentReportTimes The player's `recentReportTimes`: ISO times of reports they submitted.
 * @param now The current time.
 * @returns `times`: the input with everything older than one hour dropped (and anything that is
 *   not a valid time). `allowed`: false when the player has already used up the hour's limit.
 *
 * In POST /reports:               if (!allowed) throw new ApiError('rate_limited');
 * In POST /reports/:id/submit:    save [...times, now.toISOString()] as the player's recentReportTimes.
 */
export function checkReportLimit(recentReportTimes: string[], now: Date): { allowed: boolean; times: string[] } {
  const cutoff = now.getTime() - ONE_HOUR_MS;
  const times = recentReportTimes.filter((time) => {
    const at = Date.parse(time);
    return !Number.isNaN(at) && at > cutoff;
  });
  return { allowed: times.length < REPORT_LIMIT_PER_HOUR, times };
}
