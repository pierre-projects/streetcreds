import type { Award, DealUnlockView, Player } from '../../../../shared/types'
import { explorerTxUrl } from '../../app/solana'
import { ButtonLink, Card, Eyebrow } from '../../app/ui'
import { MayorSays } from './MayorSays'
import { questStrings } from './strings'

export function RewardCard({
  award,
  player,
  unlock,
}: {
  award: Award
  player: Player
  unlock?: DealUnlockView
}) {
  return (
    <div className="space-y-5">
      <h1 className="text-center font-display text-title tracking-tight text-ink">{questStrings.reward.title}</h1>

      <Card className="text-center">
        <Eyebrow>{questStrings.reward.eyebrow}</Eyebrow>
        <p className="points-total mt-1">+{award.points}</p>
        <p className="mt-2 text-sm text-muted tabular-nums">{questStrings.reward.total(player.points)}</p>

        {award.chainStatus === 'sent' && award.txSignature ? (
          <p className="mt-3 text-sm">
            <a
              href={explorerTxUrl(award.txSignature)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-ink underline focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink"
            >
              {questStrings.reward.explorer}
            </a>
          </p>
        ) : null}
        {award.chainStatus === 'pending' ? <p className="mt-3 text-sm text-muted">{questStrings.reward.pending}</p> : null}
      </Card>

      {unlock ? (
        <MayorSays>
          <p className="text-base text-ink">
            {questStrings.reward.unlock(unlock.partnerName, unlock.unlockedCost, unlock.baseCost)}
          </p>
        </MayorSays>
      ) : null}

      <div className="grid gap-3">
        {unlock ? <ButtonLink to="/deals">{questStrings.reward.dealsLink}</ButtonLink> : null}
        <ButtonLink to="/home" variant={unlock ? 'secondary' : 'primary'}>
          {questStrings.reward.homeLink}
        </ButtonLink>
      </div>
    </div>
  )
}
