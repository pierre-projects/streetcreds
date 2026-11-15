import L from 'leaflet'
import { useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { MAP_CENTER } from '../../../../shared/constants'
import { Button } from '../../app/ui'
import { questStrings } from './strings'
import 'leaflet/dist/leaflet.css'

function TapPin({
  position,
  onPick,
}: {
  position: { lat: number; lng: number } | null
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<span style="display:block;width:16px;height:16px;border-radius:999px;background:#1a1a1a;border:2px solid #fff;margin:14px"></span>',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    [],
  )
  if (!position) return null
  return <Marker position={[position.lat, position.lng]} icon={icon} />
}

export function LocationPicker({
  onConfirm,
}: {
  onConfirm: (lat: number, lng: number) => void
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{questStrings.report.locationDenied}</p>
      <div className="h-56 overflow-hidden rounded-control border border-ink">
        <MapContainer center={[MAP_CENTER.lat, MAP_CENTER.lng]} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <TapPin position={position} onPick={(lat, lng) => setPosition({ lat, lng })} />
        </MapContainer>
      </div>
      <Button
        disabled={position === null}
        onClick={() => {
          if (position) onConfirm(position.lat, position.lng)
        }}
      >
        {questStrings.report.submit}
      </Button>
    </div>
  )
}
