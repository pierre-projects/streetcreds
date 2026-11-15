import { useRef, useState } from 'react'
import { CATEGORIES, POINTS } from '../../../../shared/constants'
import type { Award, Category, DealUnlockView, LocationFix, Player, Report, Severity } from '../../../../shared/types'
import { api, ApiError } from '../../app/api'
import { readCurrentLocation } from '../../app/location'
import { usePlayer } from '../../app/player'
import { Badge, Button, Card, ErrorNotice, OptionCard } from '../../app/ui'
import { CityHandoff } from '../players/CityHandoff'
import { MayorSays } from './MayorSays'
import { QuestHeader } from './QuestHeader'
import { CameraIcon } from './QuestIcons'
import { resizeImage } from './resizeImage'
import { RewardCard } from './RewardCard'
import { questStrings } from './strings'

type Phase =
  | 'idle'
  | 'resizing'
  | 'uploading'
  | 'labeling'
  | 'confirm'
  | 'locating'
  | 'location-error'
  | 'submitting'
  | 'reward'
  | 'error'

const TOTAL_STEPS = 3

/** Step 1 is the photo, step 2 is checking the label, step 3 is the location and the send. */
function stepFor(phase: Phase): number {
  if (phase === 'confirm') return 2
  if (phase === 'locating' || phase === 'location-error' || phase === 'submitting' || phase === 'reward') return 3
  return 1
}

const SEVERITY_BADGE: Record<Severity, string> = {
  low: 'bg-severity-low text-on-ink',
  medium: 'bg-severity-medium text-on-ink',
  high: 'bg-severity-high text-on-ink',
}

/** The photo, or the dashed frame that waits for one. */
function PhotoFrame({ previewUrl }: { previewUrl: string | null }) {
  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={questStrings.report.photoAlt}
        className="aspect-[4/3] w-full rounded-card border border-ink/10 object-cover"
      />
    )
  }
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-ink/20 text-muted">
      <CameraIcon />
      <p className="text-sm">{questStrings.report.photoPlaceholder}</p>
    </div>
  )
}

export function ReportScreen() {
  const playerQuery = usePlayer()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [category, setCategory] = useState<Category>('pothole')
  const [award, setAward] = useState<Award | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [unlock, setUnlock] = useState<DealUnlockView | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setReport(null)
    setAward(null)
    setPlayer(null)
    setUnlock(undefined)
    setError(null)
    setPhase('idle')
  }

  async function onFile(file: File | undefined) {
    const me = playerQuery.data
    if (!file || !me) return
    setError(null)
    try {
      setPhase('resizing')
      const blob = await resizeImage(file)
      const url = URL.createObjectURL(blob)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })

      setPhase('uploading')
      const { uploadUrl, photoKey } = await api.getUploadUrl(me.id)
      await api.uploadPhoto(uploadUrl, blob)

      setPhase('labeling')
      const { report: draft } = await api.createReport({ playerId: me.id, photoKey })
      setReport(draft)
      setCategory(draft.category)
      setPhase('confirm')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : questStrings.report.retry
      setError(message)
      setPhase('error')
    }
  }

  async function requestLocation() {
    if (phase === 'locating' || phase === 'submitting') return
    setError(null)
    setPhase('locating')
    try {
      const location = await readCurrentLocation()
      await submitAt(location)
    } catch (err) {
      setError(err instanceof Error ? err.message : questStrings.report.locationRequired)
      setPhase('location-error')
    }
  }

  async function submitAt(location: LocationFix) {
    const me = playerQuery.data
    if (!me || !report) return
    setPhase('submitting')
    setError(null)
    try {
      const result = await api.submitReport(report.id, {
        playerId: me.id,
        location,
        category: category !== report.category ? category : undefined,
      })
      // The report as it was published, with its place and final category, for "Send to Tempe 311".
      setReport(result.report)
      setAward(result.award)
      setPlayer(result.player)
      setUnlock(result.unlock)
      setPhase('reward')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : questStrings.report.retry
      setError(message)
      setPhase('location-error')
    }
  }

  if (playerQuery.isPending) {
    return <p className="text-muted" role="status">{questStrings.report.resizing}</p>
  }
  if (playerQuery.isError || !playerQuery.data) {
    return (
      <ErrorNotice
        message={playerQuery.error?.message}
        fallback={questStrings.report.retry}
        onRetry={() => void playerQuery.refetch()}
        retryLabel={questStrings.report.retry}
      />
    )
  }

  const busy =
    phase === 'resizing' || phase === 'uploading' || phase === 'labeling' || phase === 'locating' || phase === 'submitting'
  const busyText =
    phase === 'resizing'
      ? questStrings.report.resizing
      : phase === 'uploading'
        ? questStrings.report.uploading
        : phase === 'labeling'
          ? questStrings.mayor.looking
          : phase === 'locating'
            ? questStrings.mayor.locating
            : questStrings.mayor.submitting

  if (phase === 'reward' && award && player) {
    return (
      <div className="space-y-5">
        <RewardCard award={award} player={player} unlock={unlock} />
        {/* Passing the report on to the City's own form. The photo is the one still on this phone. */}
        {report ? (
          <Card>
            <CityHandoff report={report} photoHref={previewUrl} emphasis="secondary" />
          </Card>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <QuestHeader title={questStrings.report.title} step={stepFor(phase)} total={TOTAL_STEPS} />

      <PhotoFrame previewUrl={previewUrl} />

      {phase === 'idle' ? (
        <>
          <MayorSays>
            <p className="text-base text-ink">{questStrings.mayor.capture}</p>
          </MayorSays>
          <div className="grid gap-3">
            <Button onClick={() => cameraRef.current?.click()}>{questStrings.report.takePhoto}</Button>
            <Button variant="secondary" onClick={() => galleryRef.current?.click()}>
              {questStrings.report.chooseGallery}
            </Button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </>
      ) : null}

      {busy ? (
        <MayorSays live>
          <p className="text-base text-ink" role="status">
            {busyText}
          </p>
        </MayorSays>
      ) : null}

      {phase === 'confirm' && report ? (
        <>
          <MayorSays>
            <p className="text-base text-ink">{report.description}</p>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className={SEVERITY_BADGE[report.severity]}>
                {questStrings.report.severityBadge(questStrings.severities[report.severity])}
              </Badge>
              <span className="text-sm text-muted">{questStrings.severityNotes[report.severity]}</span>
            </p>
          </MayorSays>

          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold text-muted">{questStrings.report.categoryLabel}</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((id) => (
                <OptionCard
                  key={id}
                  name="report-category"
                  value={id}
                  checked={category === id}
                  onChange={setCategory}
                  label={questStrings.categories[id]}
                />
              ))}
            </div>
          </fieldset>

          <div className="space-y-3 pt-2">
            <p className="text-center text-xs leading-relaxed text-muted">{questStrings.report.locationHint}</p>
            <Button onClick={() => void requestLocation()}>
              {questStrings.report.submitFor(POINTS['report-new'])}
            </Button>
          </div>
        </>
      ) : null}

      {phase === 'location-error' ? (
        <div className="space-y-3">
          <ErrorNotice message={error} fallback={questStrings.report.locationRequired} />
          <Button onClick={() => void requestLocation()}>{questStrings.report.retryLocation}</Button>
          <Button variant="secondary" onClick={reset}>
            {questStrings.report.tryAnother}
          </Button>
        </div>
      ) : null}

      {phase === 'error' ? (
        <ErrorNotice
          message={error}
          fallback={questStrings.report.retry}
          onRetry={reset}
          retryLabel={questStrings.report.tryAnother}
        />
      ) : null}
    </div>
  )
}
