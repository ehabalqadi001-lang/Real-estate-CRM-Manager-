import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { MapPin } from 'lucide-react'
import InventoryMap from './InventoryMap'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: units } = await supabase
    .from('inventory')
    .select('id, unit_name, project_name, unit_type, price, status, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('project_name')

  // Also query projects table if migrated
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, lat, lng, location, status')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  const fmt = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="w-10 h-10 bg-[#00C27C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C27C]/20">
          <MapPin size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900">خريطة العقارات</h1>
          <p className="text-xs text-slate-400">
            {units?.length ?? 0} وحدة · {projects?.length ?? 0} مشروع على الخريطة
          </p>
        </div>
      </div>

      {(!units?.length && !projects?.length) ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <MapPin size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-bold text-slate-600">لا توجد وحدات أو مشاريع بإحداثيات مسجلة</p>
          <p className="text-sm text-slate-400 mt-1">أضف lat/lng للوحدات أو المشاريع لعرضها على الخريطة</p>
        </div>
      ) : (
        <InventoryMap
          units={(units ?? []).map(u => ({
            id: u.id,
            lat: Number(u.lat),
            lng: Number(u.lng),
            label: u.project_name ?? u.unit_name ?? 'وحدة',
            type: u.unit_type ?? '',
            price: fmt(Number(u.price || 0)),
            status: (u.status ?? 'available').toLowerCase(),
          }))}
          projects={(projects ?? []).map(p => ({
            id: p.id,
            lat: Number(p.lat),
            lng: Number(p.lng),
            name: p.name,
            location: p.location ?? '',
            status: p.status ?? 'active',
          }))}
        />
      )}
    </div>
  )
}
