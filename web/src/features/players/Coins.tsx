// A number of points, drawn as the CIVIC coin and the number, in place of "180 pts".
// A screen reader says "180 points": the coin is a picture, and a bare number would not say of what.
import { CoinIcon } from '../../app/icons'
import { strings } from '../../app/strings'
import { cx } from '../../app/ui'

export function Coins({ points, className }: { points: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 tabular-nums', className)}>
      <CoinIcon />
      <span aria-hidden="true">{points}</span>
      <span className="sr-only">{strings.leaderboard.pointsSpoken(points)}</span>
    </span>
  )
}
