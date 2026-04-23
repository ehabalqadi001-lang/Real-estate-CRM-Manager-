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

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-2xl bg-slate-100">
      <p className="font-bold text-slate-400">جاري تحميل الخريطة...</p>
    </div>
  ),
})

export default function InventoryMap({ units, projects }: Props) {
  return <MapClient units={units} projects={projects} />
}
