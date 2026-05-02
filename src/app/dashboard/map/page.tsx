import { getI18n } from '@/lib/i18n'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MapPin } from 'lucide-react'
import InventoryMap from './InventoryMap'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const { t, numLocale } = await getI18n()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } },
  )

  const [{ data: units }, { data: projects }] = await Promise.all([
    supabase
      .from('inventory')
      .select('id, unit_name, project_name, unit_type, price, status, lat, lng')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('project_name'),
    supabase
      .from('projects')
      .select('id, name, lat, lng, location, status')
      .not('lat', 'is', null)
      .not('lng', 'is', null),
  ])

  const fmt = (n: number) => new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(n)
  const mappedUnits = (units ?? []).map((unit) => ({
    id: unit.id,
    lat: Number(unit.lat),
    lng: Number(unit.lng),
    label: unit.project_name ?? unit.unit_name ?? t('وحدة', 'Unit'),
    type: unit.unit_type ?? '',
    price: fmt(Number(unit.price || 0)),
    status: (unit.status ?? 'available').toLowerCase(),
  }))
  const mappedProjects = (projects ?? []).map((project) => ({
    id: project.id,
    lat: Number(project.lat),
    lng: Number(project.lng),
    name: project.name,
    location: project.location ?? '',
    status: project.status ?? 'active',
  }))

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#00C27C] shadow-lg shadow-[#00C27C]/20">
          <MapPin size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900">{t('خريطة العقارات', 'Property Map')}</h1>
          <p className="text-xs text-slate-400">
            {mappedUnits.length} {t('وحدة', 'units')} - {mappedProjects.length} {t('مشروع على الخريطة', 'projects on map')}
          </p>
        </div>
      </div>

      <InventoryMap units={mappedUnits} projects={mappedProjects} />
    </div>
  )
}
