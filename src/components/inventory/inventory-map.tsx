'use client'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Button } from '@/components/ui/button'
import type { InventoryUnit } from './inventory-types'

interface InventoryMapProps {
  units: InventoryUnit[]
  onDetails: (unit: InventoryUnit) => void
}

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function formatEgp(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function InventoryMap({ units, onDetails }: InventoryMapProps) {
  const mappedUnits = units.filter((unit) => unit.latitude && unit.longitude)
  const center: [number, number] = mappedUnits.length
    ? [mappedUnits[0].latitude as number, mappedUnits[0].longitude as number]
    : [30.0444, 31.2357]

  return (
    <div className="h-[520px] overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)]" dir="ltr">
      <MapContainer center={center} zoom={mappedUnits.length ? 11 : 10} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappedUnits.map((unit) => (
          <Marker key={unit.id} position={[unit.latitude as number, unit.longitude as number]} icon={icon}>
            <Popup>
              <div className="min-w-44 space-y-2 text-right" dir="rtl">
                <p className="font-bold">{unit.projectNameAr}</p>
                <p className="text-xs text-slate-500">{unit.unitNumber} - {unit.city}</p>
                <p className="font-black">{formatEgp(unit.price)}</p>
                <Button size="sm" onClick={() => onDetails(unit)}>عرض التفاصيل</Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
