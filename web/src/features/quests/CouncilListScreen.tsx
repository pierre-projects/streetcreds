import { useQuery } from '@tanstack/react-query'
import type { CouncilItemView } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { Badge, ErrorNotice, LinkCard, ScreenHeader } from '../../app/ui'
import { questStrings } from './strings'

function CouncilRow({ item }: { item: CouncilItemView }) {
  return (
    <LinkCard to={`/council/${item.id}`}>
      <span>
        <span className="block text-base text-ink">{item.title}</span>
        <span className="mt-1 block text-sm text-muted line-clamp-2">{item.summary}</span>
      </span>
      <Badge className={item.answered ? 'bg-ink text-surface' : undefined}>
        {item.answered ? questStrings.council.answered : questStrings.council.open}
      </Badge>
    </LinkCard>
  )
}

export function CouncilListScreen() {
  const player = usePlayer()
  const council = useQuery({
    queryKey: ['council', player.data?.id],
    enabled: Boolean(player.data?.id),
    queryFn: () => api.listCouncilItems(player.data!.id),
  })

  if (player.isPending) {
    return <p className="text-muted">{questStrings.council.loading}</p>
  }
  if (player.isError || !player.data) {
    return (
      <ErrorNotice
        message={player.error?.message}
        fallback={questStrings.council.loadError}
        onRetry={() => void player.refetch()}
        retryLabel={questStrings.council.retry}
      />
    )
  }

  return (
    <div className="space-y-6">
      <ScreenHeader title={questStrings.council.listTitle} subtitle={questStrings.council.listSubtitle} />
      {council.isPending ? <p className="text-muted">{questStrings.council.loading}</p> : null}
      {council.isError ? (
        <ErrorNotice
          message={council.error.message}
          fallback={questStrings.council.loadError}
          onRetry={() => void council.refetch()}
          retryLabel={questStrings.council.retry}
        />
      ) : null}
      {council.data ? (
        <div className="grid gap-3">
          {council.data.items.map((item) => (
            <CouncilRow key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
