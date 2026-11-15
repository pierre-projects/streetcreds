// The short form of the City switches, for the folded panel on the board: one key for each group
// and nothing else. A key is the shape and letter of that group's pins on the map, so the row is
// the map's legend and its switches at once. The names are in the tooltips, and are read out by
// screen readers. CityLayerToggles is the long form, with the names and the numbers written out.
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

interface CityLayerKeysProps {
  /** Every City record, before any group is switched off. */
  records: CityRecord[]
  status: CityRecordsState['status']
  layers: CityLayers
  /** Given a function from the current groups to the next, like a state setter, so two quick taps both count. */
  onChange: (update: (current: CityLayers) => CityLayers) => void
}

// A square for a barrier, a diamond for a helpful place: the same shapes as the pins.
const KEYS: { layer: CityLayer; shape: string }[] = [
  ...BARRIER_LAYERS.map((layer) => ({ layer, shape: 'filter-square' })),
  ...RESOURCE_LAYERS.map((layer) => ({ layer, shape: 'filter-square filter-diamond' })),
]

export function CityLayerKeys({ records, status, layers, onChange }: CityLayerKeysProps) {
  const counts = status === 'ready' ? countByLayer(records) : null

  return (
    <div role="group" aria-label={strings.city.title} className="flex">
      {KEYS.map(({ layer, shape }) => (
        <button
          key={layer}
          type="button"
          className="city-key"
          aria-pressed={layers[layer]}
          aria-label={strings.city.layerToggle(strings.city.layers[layer], counts ? counts[layer] : null)}
          title={strings.city.layers[layer]}
          disabled={status !== 'ready'}
          onClick={() => onChange((current) => ({ ...current, [layer]: !current[layer] }))}
        >
          <span className={shape} aria-hidden="true">
            <span>{strings.city.layerLetter[layer]}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
