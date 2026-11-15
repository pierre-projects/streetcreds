import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import type { Award, Player } from '../../../../shared/types'
import { api, ApiError } from '../../app/api'
import { usePlayer } from '../../app/player'
import { Button, ButtonLink, ErrorNotice, OptionCard, ScreenHeader } from '../../app/ui'
import { RewardCard } from './RewardCard'
import { questStrings } from './strings'

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
    mutationFn: (answerIndex: number) =>
      api.answerCouncilItem({ playerId: player.data!.id, itemId, answerIndex }),
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
    return (
      <div className="space-y-6">
        <ScreenHeader title={item.title} />
        <RewardCard award={reward.award} player={reward.player} />
      </div>
    )
  }

  if (item.answered) {
    return (
      <div className="space-y-6">
        <ScreenHeader title={item.title} subtitle={questStrings.council.alreadyEarned} />
        <p className="text-base text-ink">{item.summary}</p>
        <p className="text-sm">
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {questStrings.council.source}
          </a>
        </p>
        <ButtonLink to="/council" variant="secondary">
          {questStrings.council.back}
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ScreenHeader title={item.title} subtitle={questStrings.council.itemSubtitle} />
      <p className="text-base text-ink">{item.summary}</p>
      <p className="text-sm">
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="underline">
          {questStrings.council.source}
        </a>
      </p>

      <div className="space-y-3">
        <p className="text-base font-semibold text-ink">{item.question}</p>
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
      </div>

      {wrongHint ? (
        <p className="text-sm text-severity-high" role="alert">
          {questStrings.council.wrong}
        </p>
      ) : null}
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
        {answer.isPending ? questStrings.council.submitting : questStrings.council.submit}
      </Button>
    </div>
  )
}
