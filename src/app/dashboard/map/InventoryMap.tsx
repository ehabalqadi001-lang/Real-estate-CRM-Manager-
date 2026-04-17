'use client'

import dynamic from 'next/dynamic'

interface UnitPin {
  id: string
  lat: number
  lng: number
  label: string
  type: string
  price: string
  status: string
}

interface ProjectPin {
  id: string
  lat: number
  lng: number
  name: string
  location: string
  status: string
}

interface Props {
  units: UnitPin[]
  projects: ProjectPin[]
}

// Lazy-load the actual map to avoid SSR issues with Leaflet
const MapClient = dynamic(() => import('./MapClient'), { ssr: false, loading: () => (
  <div className="h-[600px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
    <p className="text-slate-400 font-bold">جاري تحميل الخريطة...</p>
  </div>
)})

export default function InventoryMap({ units, projects }: Props) {
  return <MapClient units={units} projects={projects} />
}
