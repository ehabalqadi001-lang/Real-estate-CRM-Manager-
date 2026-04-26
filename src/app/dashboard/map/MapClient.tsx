'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface UnitPin { id: string; lat: number; lng: number; label: string; type: string; price: string; status: string }
interface ProjectPin { id: string; lat: number; lng: number; name: string; location: string; status: string }

const CAIRO: [number, number] = [30.0444, 31.2357]

const unitIcon = (status: string) => L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:999px;
    background:${status === 'available' ? '#00C27C' : status === 'reserved' ? '#f59e0b' : '#ef4444'};
    border:3px solid white;box-shadow:0 3px 10px rgba(15,23,42,0.35)
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const projectIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:24px;height:24px;border-radius:8px;
    background:#0C1A2E;border:2px solid #00C27C;
    box-shadow:0 4px 12px rgba(15,23,42,0.38);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:11px;font-weight:900
  ">P</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(L.latLngBounds(points), { padding: [46, 46], maxZoom: 15 })
  }, [map, points])
  return null
}

function MapSearchFlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 13, { duration: 0.8 })
  }, [map, target])
  return null
}

export default function MapClient({ units, projects }: { units: UnitPin[]; projects: ProjectPin[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [target, setTarget] = useState<[number, number] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => status === 'all' || unit.status === status)
  }, [status, units])

  const allPoints = useMemo<[number, number][]>(() => [
    ...filteredUnits.map((unit) => [unit.lat, unit.lng] as [number, number]),
    ...projects.map((project) => [project.lat, project.lng] as [number, number]),
  ], [filteredUnits, projects])

  const center = allPoints.length > 0
    ? allPoints.reduce((acc, [lat, lng]) => [acc[0] + lat / allPoints.length, acc[1] + lng / allPoints.length], [0, 0] as [number, number])
    : CAIRO

  async function searchArea() {
    const cleanQuery = query.trim()
    if (!cleanQuery || isSearching) return

    setIsSearching(true)
    setSearchError(null)
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        limit: '1',
        countrycodes: 'eg',
        q: cleanQuery,
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
      const results = await response.json() as Array<{ lat?: string; lon?: string }>
      const first = results[0]
      if (!first?.lat || !first.lon) {
        setSearchError('لم يتم العثور على المنطقة')
        return
      }
      setTarget([Number(first.lat), Number(first.lon)])
    } catch {
      setSearchError('تعذر البحث الآن')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-[#00C27C]" />متاح</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-amber-400" />محجوز</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-red-500" />مباع</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-md border border-[#00C27C] bg-[#0C1A2E]" />مشروع</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="available">متاح</option>
            <option value="reserved">محجوز</option>
            <option value="sold">مباع</option>
          </select>
          <div className="flex min-w-0">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void searchArea()
              }}
              placeholder="ابحث عن منطقة: التجمع، زايد، العاصمة"
              className="h-10 min-w-0 rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-[#00C27C]"
            />
            <button
              type="button"
              onClick={() => void searchArea()}
              disabled={isSearching}
              className="h-10 rounded-l-lg bg-[#0C1A2E] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              {isSearching ? 'بحث...' : 'بحث'}
            </button>
          </div>
        </div>
      </div>

      {searchError && <p className="px-4 pt-3 text-xs font-bold text-red-600">{searchError}</p>}

      {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
      <MapContainer center={center} zoom={11} style={{ height: '560px', width: '100%' }} scrollWheelZoom>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {allPoints.length > 0 && <FitBounds points={allPoints} />}
        <MapSearchFlyTo target={target} />

        {filteredUnits.map((unit) => (
          <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={unitIcon(unit.status)}>
            <Popup>
              {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
              <div style={{ direction: 'rtl', minWidth: 170 }}>
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                <p style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{unit.label}</p>
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                <p style={{ fontSize: 11, color: '#64748b' }}>{unit.type}</p>
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                <p style={{ fontSize: 13, fontWeight: 800, color: '#00C27C', marginTop: 4 }}>{unit.price} ج.م</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {projects.map((project) => (
          <Marker key={project.id} position={[project.lat, project.lng]} icon={projectIcon}>
            <Popup>
              {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
              <div style={{ direction: 'rtl', minWidth: 170 }}>
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                <p style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{project.name}</p>
                {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
                {project.location && <p style={{ fontSize: 11, color: '#64748b' }}>{project.location}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {allPoints.length === 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-500">
          الخريطة تعمل الآن، لكن لا توجد وحدات أو مشاريع بإحداثيات محفوظة. استخدم البحث لمشاهدة المناطق، ثم أضف lat/lng للعقارات لظهور العلامات.
        </div>
      )}
    </div>
  )
}
