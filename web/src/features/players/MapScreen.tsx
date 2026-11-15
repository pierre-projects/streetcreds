// The map: one pin for every open report. A pin's color is its severity and its size is how many
// times the problem has been reported. Tapping a pin shows the photo and details, and a button
// that copies a report ready to paste into the city's own form.
import { useQuery } from '@tanstack/react-query'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { MAP_CENTER, SEVERITIES } from '../../../../shared/constants'
import type { PublicReport, Severity } from '../../../../shared/types'
import { api } from '../../app/api'
import { MAP_POLL_MS, reportsKey } from '../../app/queryClient'
import { strings } from '../../app/strings'
import { buildCityReport } from './cityReport'

const ZOOM = 14

// Written out in full so Tailwind can see each class name.
const SEVERITY_TEXT: Record<Severity, string> = {
  low: 'text-severity-low',
  medium: 'text-severity-medium',
  high: 'text-severity-high',
}
const SEVERITY_DOT: Record<Severity, string> = {
  low: 'bg-severity-low',
  medium: 'bg-severity-medium',
  high: 'bg-severity-high',
}

/** Bigger for problems reported more often, up to a limit so one pin cannot cover the map. */
function pinRadius(count: number): number {
  return 6 + 2 * Math.min(count, 6)
}

type CopyState = { reportId: string; ok: boolean } | null

function ReportPopup({ report, copy, onCopy }: { report: PublicReport; copy: CopyState; onCopy: () => void }) {
  const category = strings.categories[report.category]
  const copiedThis = copy?.reportId === report.id
  return (
    <div className="flex w-56 flex-col gap-2 font-sans text-sm text-ink">
      <img
        src={report.photoUrl}
        alt={strings.map.photoAlt(category)}
        loading="lazy"
        className="h-32 w-full rounded-lg bg-page object-cover"
      />
      <div>
        <p className="text-base font-semibold">{category}</p>
        <p className={`text-xs font-semibold ${SEVERITY_TEXT[report.severity]}`}>
          {strings.map.severity(strings.severities[report.severity])}
        </p>
      </div>
      <p>{report.description}</p>
      <p className="text-xs text-muted">{strings.map.reportedTimes(report.count)}</p>
      <button
        type="button"
        onClick={onCopy}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-on-accent"
      >
        {strings.map.copy}
      </button>
      {copiedThis && (
        <p role="status" className={`text-xs ${copy.ok ? 'text-muted' : 'text-severity-high'}`}>
          {copy.ok ? strings.map.copied : strings.map.copyFailed}
        </p>
      )}
    </div>
  )
}

export function MapScreen() {
  const [copy, setCopy] = useState<CopyState>(null)
  const reports = useQuery({
    queryKey: reportsKey,
    queryFn: api.listReports,
    refetchInterval: MAP_POLL_MS,
  })

  // Only reports with a place can be drawn. The API sends open reports only, which all have one.
  const pins = (reports.data?.reports ?? []).filter((report) => report.lat !== null && report.lng !== null)

  async function copyReport(report: PublicReport) {
    try {
      await navigator.clipboard.writeText(buildCityReport(report))
      setCopy({ reportId: report.id, ok: true })
    } catch {
      setCopy({ reportId: report.id, ok: false })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{strings.map.title}</h1>
        <p className="mt-1 text-sm text-muted">{strings.map.subtitle}</p>
      </header>

      {/* `isolate` keeps Leaflet's own layers underneath the app's header and navigation. */}
      <div className="relative isolate z-0 h-[58dvh] min-h-80 overflow-hidden rounded-2xl border border-line bg-surface">
        <MapContainer center={[MAP_CENTER.lat, MAP_CENTER.lng]} zoom={ZOOM} className="h-full w-full">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {pins.map((report) => (
            <CircleMarker
              key={report.id}
              center={[report.lat as number, report.lng as number]}
              radius={pinRadius(report.count)}
              pathOptions={{ className: `pin pin-${report.severity}`, weight: 2, fillOpacity: 0.6 }}
            >
              <Popup minWidth={224} maxWidth={224}>
                <ReportPopup report={report} copy={copy} onCopy={() => void copyReport(report)} />
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div aria-live="polite">
        {reports.isPending && <p className="text-sm text-muted">{strings.map.loading}</p>}

        {reports.isError && !reports.data && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p role="alert" className="text-base text-severity-high">
              {reports.error.message || strings.map.error}
            </p>
            <button
              type="button"
              onClick={() => void reports.refetch()}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 font-semibold text-accent"
            >
              {strings.map.retry}
            </button>
          </div>
        )}

        {reports.data && (
          <p className="text-sm font-semibold text-ink">
            {pins.length === 0 ? strings.map.empty : strings.map.count(pins.length)}
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {SEVERITIES.map((severity) => (
            <li key={severity} className="flex items-center gap-2 text-sm text-ink">
              <span className={`inline-block size-3 rounded-full ${SEVERITY_DOT[severity]}`} aria-hidden="true" />
              {strings.severities[severity]}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted">{strings.map.legend}</p>
      </section>
    </div>
  )
}
