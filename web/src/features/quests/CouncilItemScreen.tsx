import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { POINTS } from '../../../../shared/constants'
import type { Award, Player } from '../../../../shared/types'
import { api, ApiError } from '../../app/api'
import { usePlayer } from '../../app/player'
import { Button, ButtonLink, Card, ErrorNotice, Eyebrow, OptionCard } from '../../app/ui'
import { MayorSays } from './MayorSays'
import { QuestHeader } from './QuestHeader'
import { RewardCard } from './RewardCard'
import { questStrings } from './strings'

function SourceLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center text-sm text-ink underline focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink"
    >
      {questStrings.council.source}
    </a>
  )
}

export function CouncilItemScreen() {
  const { itemId = '' } = useParams()
  const player = usePlayer()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [wrongHint, setWrongHint] = useState(false)
  const [reward, setReward] = useState<{ award: Award; player: Player } | null>(null)

  const council = useQuery({
    queryKey: ['council', player.data?.id],
    enabled: Boolean(player.data?.id),
    queryFn: () => api.listCouncilItems(player.data!.id),
  })

  const answer = useMutation({
    mutationFn: (answerIndex: number) => api.answerCouncilItem({ playerId: player.data!.id, itemId, answerIndex }),
    onSuccess: async (result) => {
      if (!result.correct || !result.award) {
        setWrongHint(true)
        return
      }
      setWrongHint(false)
      setReward({ award: result.award, player: result.player })
      await queryClient.invalidateQueries({ queryKey: ['council', player.data?.id] })
    },
  })

  if (player.isPending || council.isPending) {
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
  if (council.isError) {
    return (
      <ErrorNotice
        message={council.error.message}
        fallback={questStrings.council.loadError}
        onRetry={() => void council.refetch()}
        retryLabel={questStrings.council.retry}
      />
    )
  }

  const item = council.data.items.find((candidate) => candidate.id === itemId)
  if (!item) {
    return (
      <div className="space-y-4">
        <ErrorNotice message={questStrings.council.missing} fallback={questStrings.council.missing} />
        <ButtonLink to="/council" variant="secondary">
          {questStrings.council.back}
        </ButtonLink>
      </div>
    )
  }

  if (reward) {
    return <RewardCard award={reward.award} player={reward.player} />
  }

  const summary = (
    <Card>
      <Eyebrow>{questStrings.council.listTitle}</Eyebrow>
      <h2 className="mt-1 text-lg font-bold text-ink">{item.title}</h2>
      <p className="mt-2 text-base leading-relaxed text-ink">{item.summary}</p>
      <SourceLink href={item.sourceUrl} />
    </Card>
  )

  if (item.answered) {
    return (
      <div className="space-y-5">
        <QuestHeader title={questStrings.council.listTitle} cancelTo="/council" />
        <MayorSays>
          <p className="text-base text-ink">{questStrings.mayor.councilDone}</p>
        </MayorSays>
        {summary}
        <ButtonLink to="/council" variant="secondary">
          {questStrings.council.back}
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <QuestHeader title={questStrings.council.listTitle} cancelTo="/council" />
      {summary}

      <MayorSays live>
        <p className="text-base text-ink" role={wrongHint ? 'alert' : undefined}>
          {wrongHint ? questStrings.mayor.councilWrong : questStrings.mayor.councilItem}
        </p>
      </MayorSays>

      <fieldset className="space-y-2">
        <legend className="mb-3 text-base font-semibold text-ink">{item.question}</legend>
        {item.options.map((option, index) => (
          <OptionCard
            key={`${item.id}-${index}`}
            name={`council-${item.id}`}
            value={String(index)}
            checked={selected === String(index)}
            onChange={(value) => {
              setSelected(value)
              setWrongHint(false)
            }}
            label={option}
            disabled={answer.isPending}
          />
        ))}
      </fieldset>

      {answer.isError ? (
        <p className="text-sm text-severity-high" role="alert">
          {answer.error instanceof ApiError ? answer.error.message : questStrings.council.submitError}
        </p>
      ) : null}

      <Button
        type="button"
        disabled={selected === null || answer.isPending}
        onClick={() => {
          if (selected === null) return
          answer.mutate(Number(selected))
        }}
      >
        {answer.isPending ? questStrings.council.submitting : questStrings.council.submitFor(POINTS.council)}
      </Button>
    </div>
  )
}
