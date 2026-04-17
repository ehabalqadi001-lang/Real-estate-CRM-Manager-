'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const unitIcon = (status: string) => L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:${status === 'available' ? '#00C27C' : status === 'reserved' ? '#f59e0b' : '#ef4444'};
    border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const projectIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:6px;
    background:#0C1A2E;border:2px solid #00C27C;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:10px;font-weight:900
  ">P</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface UnitPin { id: string; lat: number; lng: number; label: string; type: string; price: string; status: string }
interface ProjectPin { id: string; lat: number; lng: number; name: string; location: string; status: string }

// Cairo center as default
const CAIRO = { lat: 30.0444, lng: 31.2357 }

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, points])
  return null
}

export default function MapClient({ units, projects }: { units: UnitPin[]; projects: ProjectPin[] }) {
  const allPoints: [number, number][] = [
    ...units.map(u => [u.lat, u.lng] as [number, number]),
    ...projects.map(p => [p.lat, p.lng] as [number, number]),
  ]

  const center = allPoints.length > 0
    ? allPoints.reduce((acc, [lat, lng]) => [acc[0] + lat / allPoints.length, acc[1] + lng / allPoints.length], [0, 0]) as [number, number]
    : [CAIRO.lat, CAIRO.lng] as [number, number]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#00C27C] inline-block" />متاح</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />محجوز</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />مباع</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#0C1A2E] inline-block border border-[#00C27C]" />مشروع</span>
      </div>

      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '560px', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {allPoints.length > 0 && <FitBounds points={allPoints} />}

        {units.map(unit => (
          <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={unitIcon(unit.status)}>
            <Popup>
              <div style={{ direction: 'rtl', minWidth: '160px' }}>
                <p style={{ fontWeight: 900, fontSize: '13px', marginBottom: '4px' }}>{unit.label}</p>
                <p style={{ fontSize: '11px', color: '#64748b' }}>{unit.type}</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#00C27C', marginTop: '4px' }}>{unit.price} ج.م</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {projects.map(project => (
          <Marker key={project.id} position={[project.lat, project.lng]} icon={projectIcon}>
            <Popup>
              <div style={{ direction: 'rtl', minWidth: '160px' }}>
                <p style={{ fontWeight: 900, fontSize: '13px', marginBottom: '4px' }}>{project.name}</p>
                {project.location && <p style={{ fontSize: '11px', color: '#64748b' }}>{project.location}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
