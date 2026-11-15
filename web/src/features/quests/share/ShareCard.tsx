// The street cred card: a picture of the player's points and neighborhood that they can send
// to anyone. It works the same for a guest and a signed-in player.
//
//   <ShareCard player={player} />                                  on the profile
//   <ShareCard player={player} earned={...} photoUrl={previewUrl} />   right after a report
//
// The picture is drawn as soon as the card appears, not when Share is pressed: a phone only
// opens its share sheet straight from a tap, and drawing first would lose that.
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { Player } from '../../../../../shared/types'
import { api } from '../../../app/api'
import { leaderboardKey, POLL_MS } from '../../../app/queryClient'
import { Button } from '../../../app/ui'
import { questStrings } from '../strings'
import { CARD_HEIGHT, CARD_WIDTH, drawShareCard } from './drawShareCard'
import { buildShareCred, buildShareText, type Earned, SHARE_URL, type ShareCred } from './shareCred'

type Outcome = 'shared' | 'saved' | 'savedOnly' | 'copied' | 'failed'

interface ShareCardProps {
  player: Player
  /** What was just earned, when the card follows a report. */
  earned?: Earned
  /** The report photo still on this phone (an object URL). Never a photo from another site. */
  photoUrl?: string | null
  /** 'secondary' where the screen already has its one primary action. */
  emphasis?: 'primary' | 'secondary'
}

function download(url: string, name: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
}

export function ShareCard({ player, earned, photoUrl = null, emphasis = 'primary' }: ShareCardProps) {
  const text = questStrings.share
  // The same leaderboard the rest of the app polls, for the neighborhood's rank.
  const leaderboard = useQuery({ queryKey: leaderboardKey, queryFn: api.getLeaderboard, refetchInterval: POLL_MS })
  const settled = !leaderboard.isPending

  // The leaderboard is a new list on every poll. The card is only redrawn when what it says changes.
  const facts = JSON.stringify(buildShareCred(player, leaderboard.data?.neighborhoods, earned))
  const cred = useMemo(() => JSON.parse(facts) as ShareCred, [facts])

  const [card, setCard] = useState<{ file: File; url: string } | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  useEffect(() => {
    if (!settled) return
    let cancelled = false
    let url: string | null = null
    drawShareCard(cred, photoUrl).then(
      (blob) => {
        if (cancelled) return
        const file = new File([blob], questStrings.share.fileName, { type: 'image/png' })
        url = URL.createObjectURL(file)
        setCard({ file, url })
      },
      () => {
        // No picture on this browser. Sharing the words still works.
        if (!cancelled) setCard(null)
      },
    )
    return () => {
      cancelled = true
      if (url !== null) URL.revokeObjectURL(url)
    }
  }, [cred, photoUrl, settled])

  async function share() {
    setOutcome(null)
    const message = buildShareText(cred)
    const file = card?.file

    try {
      // A phone's own share sheet, with the picture when the phone can send files.
      if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `${message} ${SHARE_URL}` })
        setOutcome('shared')
        return
      }
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: message, url: SHARE_URL })
        setOutcome('shared')
        return
      }
    } catch (error) {
      // The person closed the share sheet. Nothing went wrong.
      if (error instanceof DOMException && error.name === 'AbortError') return
      // Anything else: carry on to saving and copying.
    }

    // No share sheet (most desktop browsers): save the picture and copy the words.
    const saved = card !== null
    if (card) download(card.url, text.fileName)
    let copied = false
    try {
      await navigator.clipboard.writeText(`${message} ${SHARE_URL}`)
      copied = true
    } catch {
      // The clipboard can be blocked. The saved picture is still there.
    }
    setOutcome(saved && copied ? 'saved' : saved ? 'savedOnly' : copied ? 'copied' : 'failed')
  }

  return (
    <div>
      <h2 className="section-title">{text.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{text.hint}</p>
      {card ? (
        <img
          src={card.url}
          alt={`${text.previewAlt}: ${buildShareText(cred)}`}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          className="mx-auto mt-4 h-auto w-44 rounded-control border border-ink/10"
        />
      ) : (
        <p role="status" className="mt-4 text-sm text-muted">{text.preparing}</p>
      )}
      <Button variant={emphasis} className="mt-4" onClick={() => void share()}>
        {text.button}
      </Button>
      <p role="status" className="mt-3 min-h-5 text-sm text-muted">{outcome === null ? '' : text[outcome]}</p>
    </div>
  )
}
