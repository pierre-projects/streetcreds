import { useQuery } from '@tanstack/react-query'
import { POINTS } from '../../../../shared/constants'
import type { CouncilItemView } from '../../../../shared/types'
import { api } from '../../app/api'
import { usePlayer } from '../../app/player'
import { Badge, ErrorNotice, LinkCard } from '../../app/ui'
import { MayorSays } from './MayorSays'
import { QuestHeader } from './QuestHeader'
import { ChevronRightIcon } from './QuestIcons'
import { questStrings } from './strings'

function CouncilRow({ item }: { item: CouncilItemView }) {
  return (
    <LinkCard to={`/council/${item.id}`} className={item.answered ? 'items-center opacity-70' : 'items-center'}>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-ink">{item.title}</span>
        <span className="mt-1 line-clamp-2 block text-sm text-muted">{item.summary}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge className={item.answered ? 'bg-ink text-on-ink' : undefined}>
          {item.answered ? questStrings.council.answered : questStrings.council.points(POINTS.council)}
        </Badge>
        <span className="text-muted">
          <ChevronRightIcon />
        </span>
      </span>
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
    return <p className="text-muted" role="status">{questStrings.council.loading}</p>
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
    <div className="space-y-5">
      <QuestHeader title={questStrings.council.listTitle} />
      <MayorSays>
        <p className="text-base text-ink">{questStrings.mayor.councilList}</p>
      </MayorSays>
      {council.isPending ? (
        <p className="text-muted" role="status">
          {questStrings.council.loading}
        </p>
      ) : null}
      {council.isError ? (
        <ErrorNotice
          message={council.error.message}
          fallback={questStrings.council.loadError}
          onRetry={() => void council.refetch()}
          retryLabel={questStrings.council.retry}
        />
      ) : null}
      {council.data ? (
        <ul className="grid gap-3">
          {council.data.items.map((item) => (
            <li key={item.id}>
              <CouncilRow item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
