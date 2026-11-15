import { useQuery } from '@tanstack/react-query'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { DealPartnerView, NeighborhoodId } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { strings } from '../../app/strings'
import { Badge, ErrorNotice, LinkCard, ScreenHeader } from '../../app/ui'

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

function DealRow({ partner }: { partner: DealPartnerView }) {
  return (
    <LinkCard to={`/deals/${partner.id}`}>
      <span>
        <span className="block text-base text-ink">{partner.name}</span>
        <span className="mt-1 block text-sm text-muted">
          {partner.offer} · {neighborhoodName(partner.neighborhood)}
        </span>
        {partner.unlocked ? (
          <span className="mt-1 block text-sm text-ink">{strings.deals.unlockedHint}</span>
        ) : null}
      </span>
      <Badge>
        {partner.unlocked
          ? strings.deals.costUnlocked(partner.currentCost, partner.baseCost)
          : strings.deals.cost(partner.currentCost)}
      </Badge>
    </LinkCard>
  )
}

export function DealsScreen() {
  const player = usePlayer()
  const deals = useQuery({
    queryKey: ['deals', player.data?.id],
    enabled: Boolean(player.data?.id),
    queryFn: () => api.listDeals(player.data!.id),
  })

  if (player.isPending) {
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

  return (
    <div className="space-y-6">
      <ScreenHeader title={strings.deals.title} subtitle={strings.deals.subtitle} />
      {deals.isPending ? <p className="text-muted">{strings.deals.loading}</p> : null}
      {deals.isError ? (
        <ErrorNotice
          message={deals.error.message}
          fallback={strings.deals.loadError}
          onRetry={() => void deals.refetch()}
          retryLabel={strings.home.retry}
        />
      ) : null}
      {deals.data ? (
        <div className="grid gap-3">
          {deals.data.partners.map((partner) => (
            <DealRow key={partner.id} partner={partner} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
