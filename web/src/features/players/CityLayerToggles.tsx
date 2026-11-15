// The switches for what comes from the City: one row for the barriers its survey found, one for
// helpful places, and a line under them saying what is going on. The parent keeps which groups
// are on; this only draws them and asks for changes. The shape on each switch is the key for the
// pins on the map: a square for a barrier, a diamond for a helpful place.
import { strings } from '../../app/strings'
import {
  BARRIER_LAYERS,
  type CityLayer,
  type CityLayers,
  type CityRecord,
  countByLayer,
  RESOURCE_LAYERS,
} from './cityRecords'
import type { CityRecordsState } from './useCityRecords'

interface CityLayerTogglesProps {
  /** Every City record, before any group is switched off. */
  records: CityRecord[]
  status: CityRecordsState['status']
  layers: CityLayers
  /** Given a function from the current groups to the next, like a state setter, so two quick taps both count. */
  onChange: (update: (current: CityLayers) => CityLayers) => void
  /** For the phone: no numbers on the switches, so they fit the screen. */
  compact?: boolean
}

const ROWS: { label: string; layers: readonly CityLayer[]; shape: string }[] = [
  { label: strings.city.barriersLabel, layers: BARRIER_LAYERS, shape: 'filter-square' },
  { label: strings.city.resourcesLabel, layers: RESOURCE_LAYERS, shape: 'filter-square filter-diamond' },
]

export function CityLayerToggles({ records, status, layers, onChange, compact = false }: CityLayerTogglesProps) {
  const counts = status === 'ready' ? countByLayer(records) : null
  const anyOn = Object.values(layers).some(Boolean)

  return (
    <div className="flex flex-col gap-2">
      {ROWS.map((row) => (
        <div key={row.label} role="group" aria-label={row.label} className="flex flex-col gap-1">
          <p className="text-xs text-muted">{row.label}</p>
          <div className="flex flex-wrap gap-2">
            {row.layers.map((layer) => (
              <button
                key={layer}
                type="button"
                className="filter-toggle"
                aria-pressed={layers[layer]}
                aria-label={strings.city.layerToggle(strings.city.layers[layer], counts ? counts[layer] : null)}
                disabled={status !== 'ready'}
                onClick={() => onChange((current) => ({ ...current, [layer]: !current[layer] }))}
              >
                <span className={row.shape} aria-hidden="true">
                  <span>{strings.city.layerLetter[layer]}</span>
                </span>
                {strings.city.layers[layer]}
                {!compact && counts && <span className="font-mono tabular-nums text-muted">{counts[layer]}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Always at least one line tall, so nothing below jumps when the text appears. */}
      <p className="min-h-4 text-xs text-muted" aria-live="polite">
        {status === 'loading' && strings.city.loading}
        {status === 'error' && strings.city.error}
        {status === 'ready' && anyOn && strings.city.zoomHint}
      </p>
    </div>
  )
}
