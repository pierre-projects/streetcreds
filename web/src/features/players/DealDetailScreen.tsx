import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { DealRedemption } from '../../../../shared/types'
import { api, ApiError } from '../../app/api'
import { usePlayer } from '../../app/player'
import { strings } from '../../app/strings'
import { Button, ButtonLink, Card, ErrorNotice, Eyebrow, ScreenHeader } from '../../app/ui'

export function DealDetailScreen() {
  const { partnerId = '' } = useParams()
  const player = usePlayer()
  const [redemption, setRedemption] = useState<DealRedemption | null>(null)

  const deals = useQuery({
    queryKey: ['deals', player.data?.id],
    enabled: Boolean(player.data?.id),
    queryFn: () => api.listDeals(player.data!.id),
  })

  const redeem = useMutation({
    mutationFn: () => api.redeemDeal(partnerId, { playerId: player.data!.id }),
    onSuccess: (result) => {
      setRedemption(result.redemption)
      void deals.refetch()
    },
  })

  if (player.isPending || deals.isPending) {
    return <p className="text-muted">{strings.deals.loading}</p>
  }
  if (player.isError || !player.data) {
    return (
      <ErrorNotice
        message={player.error?.message}
        fallback={strings.errors.playerLoad}
        onRetry={() => void player.refetch()}
        retryLabel={strings.home.retry}
      />
    )
  }
  if (deals.isError) {
    return (
      <ErrorNotice
        message={deals.error.message}
        fallback={strings.deals.loadError}
        onRetry={() => void deals.refetch()}
        retryLabel={strings.home.retry}
      />
    )
  }

  const partner = deals.data.partners.find((p) => p.id === partnerId)
  if (!partner) {
    return (
      <div className="space-y-4">
        <ErrorNotice message={strings.deals.missing} fallback={strings.deals.missing} />
        <ButtonLink to="/deals" variant="secondary">
          {strings.deals.back}
        </ButtonLink>
      </div>
    )
  }

  if (redemption) {
    return (
      <div className="space-y-6">
        <ScreenHeader title={partner.name} />
        <Card>
          <Eyebrow>{strings.deals.codeLabel}</Eyebrow>
          <p className="points-total mt-1 tracking-widest">{redemption.code}</p>
          <p className="mt-3 text-sm text-muted">{strings.deals.codeHint}</p>
          <p className="mt-2 text-sm text-ink">{strings.deals.spent(redemption.pointsSpent)}</p>
          <ButtonLink to="/deals" className="mt-6" variant="secondary">
            {strings.deals.back}
          </ButtonLink>
        </Card>
      </div>
    )
  }

  const shortfall = Math.max(0, partner.currentCost - player.data.points)

  return (
    <div className="space-y-6">
      <ScreenHeader title={partner.name} subtitle={partner.offer} />
      <Card>
        <p className="text-sm text-muted">{strings.deals.demoNote}</p>
        <p className="mt-4 text-base text-ink">
          {partner.unlocked
            ? strings.deals.detailUnlocked(partner.currentCost, partner.baseCost)
            : strings.deals.detailBase(partner.currentCost)}
        </p>
        <p className="mt-2 text-sm text-muted">{strings.deals.yourBalance(player.data.points)}</p>
        {shortfall > 0 ? <p className="mt-2 text-sm text-severity-high">{strings.deals.needMore(shortfall)}</p> : null}
        {redeem.isError ? (
          <p className="mt-3 text-sm text-severity-high" role="alert">
            {redeem.error instanceof ApiError ? redeem.error.message : strings.deals.redeemError}
          </p>
        ) : null}
        <Button
          className="mt-6"
          disabled={shortfall > 0 || redeem.isPending}
          onClick={() => redeem.mutate()}
        >
          {redeem.isPending ? strings.deals.redeeming : strings.deals.redeem}
        </Button>
        <p className="mt-4 text-sm">
          <Link to="/deals" className="underline">
            {strings.deals.back}
          </Link>
        </p>
      </Card>
    </div>
  )
}
