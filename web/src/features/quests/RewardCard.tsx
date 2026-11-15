import type { Award, DealUnlockView, Player } from '../../../../shared/types'
import { explorerTxUrl } from '../../app/solana'
import { ButtonLink, Card, Eyebrow } from '../../app/ui'
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
    <Card>
      <Eyebrow>{questStrings.reward.eyebrow}</Eyebrow>
      <p className="points-total mt-1">+{award.points}</p>
      <p className="mt-2 text-sm text-muted">{questStrings.reward.total(player.points)}</p>

      {award.chainStatus === 'sent' && award.txSignature ? (
        <p className="mt-3 text-sm">
          <a href={explorerTxUrl(award.txSignature)} target="_blank" rel="noreferrer" className="underline">
            {questStrings.reward.explorer}
          </a>
        </p>
      ) : null}
      {award.chainStatus === 'pending' ? <p className="mt-3 text-sm text-muted">{questStrings.reward.pending}</p> : null}

      {unlock ? (
        <p className="mt-4 text-sm text-ink">
          {questStrings.reward.unlock(unlock.partnerName, unlock.unlockedCost, unlock.baseCost)}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {unlock ? <ButtonLink to="/deals">{questStrings.reward.dealsLink}</ButtonLink> : null}
        <ButtonLink to="/home" variant={unlock ? 'secondary' : 'primary'}>
          {questStrings.reward.homeLink}
        </ButtonLink>
      </div>
    </Card>
  )
}
