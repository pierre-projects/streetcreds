import { useRef, useState } from 'react'
import { CATEGORIES } from '../../../../shared/constants'
import type { Award, Category, DealUnlockView, Player, Report } from '../../../../shared/types'
import { api, ApiError } from '../../app/api'
import { usePlayer } from '../../app/player'
import { Button, Card, ErrorNotice, OptionCard, ScreenHeader } from '../../app/ui'
import { CityHandoff } from '../players/CityHandoff'
import { LocationPicker } from './LocationPicker'
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
  | 'picking'
  | 'submitting'
  | 'reward'
  | 'error'

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

  function requestLocation() {
    setPhase('locating')
    if (!navigator.geolocation) {
      setPhase('picking')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void submitAt(pos.coords.latitude, pos.coords.longitude)
      },
      () => setPhase('picking'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function submitAt(lat: number, lng: number) {
    const me = playerQuery.data
    if (!me || !report) return
    setPhase('submitting')
    setError(null)
    try {
      const result = await api.submitReport(report.id, {
        playerId: me.id,
        lat,
        lng,
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
      setPhase('error')
    }
  }

  if (playerQuery.isPending) {
    return <p className="text-muted">{questStrings.report.resizing}</p>
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

  return (
    <div className="space-y-6">
      <ScreenHeader title={questStrings.report.title} />

      {phase === 'idle' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{questStrings.report.captureHint}</p>
          <Button onClick={() => cameraRef.current?.click()}>{questStrings.report.takePhoto}</Button>
          <Button variant="secondary" onClick={() => galleryRef.current?.click()}>
            {questStrings.report.chooseGallery}
          </Button>
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
        </div>
      ) : null}

      {phase === 'resizing' || phase === 'uploading' || phase === 'labeling' || phase === 'locating' || phase === 'submitting' ? (
        <p className="text-muted">
          {phase === 'resizing'
            ? questStrings.report.resizing
            : phase === 'uploading'
              ? questStrings.report.uploading
              : phase === 'labeling'
                ? questStrings.report.labeling
                : phase === 'locating'
                  ? questStrings.report.locating
                  : questStrings.report.submitting}
        </p>
      ) : null}

      {phase === 'confirm' && report ? (
        <div className="space-y-4">
          <p className="text-base text-ink">{questStrings.report.confirmTitle}</p>
          {previewUrl ? <img src={previewUrl} alt="" className="w-full rounded-control border border-ink" /> : null}
          <p className="text-sm text-ink">{report.description}</p>
          <p className="text-sm text-muted">
            {questStrings.report.severityLabel}: {questStrings.severities[report.severity]}
          </p>
          <fieldset className="space-y-2">
            <legend className="text-sm text-ink">{questStrings.report.categoryLabel}</legend>
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
          </fieldset>
          <Button onClick={requestLocation}>{questStrings.report.submit}</Button>
        </div>
      ) : null}

      {phase === 'picking' ? <LocationPicker onConfirm={(lat, lng) => void submitAt(lat, lng)} /> : null}

      {phase === 'reward' && award && player ? <RewardCard award={award} player={player} unlock={unlock} /> : null}
      {/* Passing the report on to the City's own form. The photo is the one still on this phone. */}
      {phase === 'reward' && report ? (
        <Card>
          <CityHandoff report={report} photoHref={previewUrl} emphasis="secondary" />
        </Card>
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
