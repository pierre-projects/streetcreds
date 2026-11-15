// Profile: who the player is, what they have reported and where, and whether the player is
// saved to a Google account. Read-only, and only ever shows the player on this device.
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { SignInResponse } from '../../../../shared/api'
import { NEIGHBORHOODS } from '../../../../shared/constants'
import type { NeighborhoodId, Player, PublicReport, Severity } from '../../../../shared/types'
import { api } from '../../app/api'
import { GOOGLE_SIGN_IN_ON } from '../../app/google'
import { CoinIcon } from '../../app/icons'
import { completeSignIn, signOutHere, usePlayer } from '../../app/player'
import { playerReportsKey } from '../../app/queryClient'
import { explorerAddressUrl } from '../../app/solana'
import { strings } from '../../app/strings'
import { Badge, Button, ButtonLink, Card, ErrorNotice, Eyebrow, ScreenHeader } from '../../app/ui'
import { ShareCard } from '../quests/share/ShareCard'
import { GoogleSignInButton } from './GoogleSignInButton'
import { hasPlace } from './mapReports'
import { ReportsMap } from './ReportsMap'

const SEVERITY_BADGE: Record<Severity, string> = {
  low: 'bg-severity-low text-on-accent',
  medium: 'bg-severity-medium text-on-accent',
  high: 'bg-severity-high text-on-quest',
}

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ProfileScreen() {
  const player = usePlayer()

  if (player.isPending) {
    return <p className="text-muted" role="status">{strings.profile.loading}</p>
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
  const me = player.data

  return (
    <div className="space-y-5">
      <ScreenHeader title={strings.profile.title} />

      {/* Who you are and your points, in the same raised, orange-edged card as Home's rank card. */}
      <section className="profile-hero" aria-labelledby="profile-name">
        <div className="flex items-center gap-4">
          <span className="profile-initial" aria-hidden="true">
            {me.nickname.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 id="profile-name" className="font-display text-2xl tracking-tight text-ink [overflow-wrap:anywhere]">
              {me.nickname}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {neighborhoodName(me.neighborhood)} · {strings.profile.joined(day(me.createdAt))}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-ink/10 pt-4">
          <Eyebrow>{strings.profile.pointsLabel}</Eyebrow>
          <p className="mt-1 flex items-center gap-2 font-display text-5xl tabular-nums text-coin-ink [&_svg]:size-9">
            <CoinIcon />
            {me.points}
          </p>
        </div>

        {me.walletAddress !== null && (
          <p className="dark-detail mt-4">
            {strings.profile.walletNote}{' '}
            <a href={explorerAddressUrl(me.walletAddress)} target="_blank" rel="noreferrer" className="wallet-link">
              {strings.profile.wallet}
            </a>
          </p>
        )}
      </section>

      <Card>
        <ShareCard player={me} />
      </Card>

      <OwnReports playerId={me.id} neighborhood={me.neighborhood} />

      <AccountCard me={me} />
    </div>
  )
}

function OwnReports({ playerId, neighborhood }: { playerId: string; neighborhood: NeighborhoodId }) {
  const reports = useQuery({
    queryKey: playerReportsKey(playerId),
    queryFn: () => api.listPlayerReports(playerId),
  })
  const list = reports.data?.reports
  const pins = useMemo(() => (list ?? []).filter(hasPlace), [list])

  return (
    <section aria-labelledby="profile-reports" className="space-y-3">
      <h2 id="profile-reports" className="font-display text-lg text-ink">{strings.profile.reportsTitle}</h2>

      {reports.isPending && <p className="text-muted" role="status">{strings.profile.reportsLoading}</p>}
      {reports.isError && (
        <ErrorNotice
          message={reports.error.message}
          fallback={strings.profile.reportsError}
          onRetry={() => void reports.refetch()}
          retryLabel={strings.home.retry}
        />
      )}

      {list && list.length === 0 && (
        <Card>
          <p className="text-base text-ink">{strings.profile.reportsEmpty}</p>
          <ButtonLink to="/report" variant="quest" className="mt-4">{strings.profile.reportsEmptyAction}</ButtonLink>
        </Card>
      )}

      {list && list.length > 0 && (
        <>
          <p className="text-sm text-muted">{strings.profile.reportsCount(list.length)}</p>
          {pins.length > 0 && (
            <div
              role="region"
              aria-label={strings.profile.reportsMapLabel}
              className="relative isolate z-0 h-64 overflow-hidden rounded-card border border-ink/10"
            >
              <ReportsMap pins={pins} yourNeighborhood={neighborhood} />
            </div>
          )}
          <ul className="grid gap-3">
            {list.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function ReportRow({ report }: { report: PublicReport }) {
  return (
    <Card as="li">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-display text-base text-ink">{strings.categories[report.category]}</span>
        <Badge className={SEVERITY_BADGE[report.severity]}>{strings.severities[report.severity]}</Badge>
      </p>
      <p className="mt-2 text-sm text-ink">{report.description}</p>
      <p className="mt-1 text-xs text-muted">{strings.profile.reportedOn(day(report.submittedAt ?? report.createdAt))}</p>
    </Card>
  )
}

/** Guest: "Save your player" with Google. Signed in: what that means, and "Sign out". */
function AccountCard({ me }: { me: Player }) {
  const navigate = useNavigate()
  // A sign-in that would switch this phone to a different, already saved player. Nothing is
  // stored until the person says yes.
  const [pendingSwitch, setPendingSwitch] = useState<SignInResponse | null>(null)

  const save = useMutation({
    mutationFn: (credential: string) => api.signInWithGoogle({ credential, playerId: me.id }),
    onSuccess: (result) => {
      if (result.switched) setPendingSwitch(result)
      else completeSignIn(result.player, result.sessionToken)
    },
  })

  const signOut = useMutation({
    mutationFn: signOutHere,
    onSuccess: () => void navigate('/join', { replace: true }),
  })

  function confirmSwitch() {
    if (!pendingSwitch) return
    completeSignIn(pendingSwitch.player, pendingSwitch.sessionToken)
    setPendingSwitch(null)
  }

  function cancelSwitch() {
    if (!pendingSwitch) return
    // End the session that sign-in started for the saved player. This phone never stored it.
    api.signOut(pendingSwitch.sessionToken).catch(() => undefined)
    setPendingSwitch(null)
  }

  if (pendingSwitch) {
    return (
      <Card role="alertdialog" aria-labelledby="profile-switch-title" aria-describedby="profile-switch-body">
        <h2 id="profile-switch-title" className="font-display text-lg text-ink">{strings.auth.switchTitle}</h2>
        <p id="profile-switch-body" className="mt-2 text-sm leading-relaxed text-ink">
          {strings.auth.switchBody(pendingSwitch.player.nickname, pendingSwitch.player.points, me.points)}
        </p>
        <div className="mt-4 grid gap-3">
          <Button onClick={cancelSwitch}>{strings.auth.switchCancel}</Button>
          <Button variant="secondary" onClick={confirmSwitch}>{strings.auth.switchConfirm}</Button>
        </div>
      </Card>
    )
  }

  if (me.accountId !== null) {
    return (
      <Card>
        <h2 className="font-display text-lg text-ink">{strings.profile.signedInTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{strings.profile.signedInBody}</p>
        <Button variant="secondary" className="mt-4" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          {signOut.isPending ? strings.profile.signingOut : strings.profile.signOut}
        </Button>
      </Card>
    )
  }

  if (!GOOGLE_SIGN_IN_ON) {
    return (
      <Card>
        <p className="text-sm leading-relaxed text-muted">{strings.profile.guestOnly}</p>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="font-display text-lg text-ink">{strings.profile.guestTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{strings.profile.guestBody}</p>
      <div className="mt-4">
        <GoogleSignInButton onCredential={(credential) => save.mutate(credential)} busy={save.isPending} />
      </div>
      {save.isError && (
        <p role="alert" className="mt-3 text-sm text-severity-high">{save.error.message || strings.auth.failed}</p>
      )}
    </Card>
  )
}
