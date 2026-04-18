import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, FolderOpen, Layers, FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { ImportPanel } from './ImportPanel'
import { importDevelopersAction, importProjectsAction, importUnitsAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function DataEntryHubPage() {
  await requirePermission('inventory.read')
  const supabase = await createServerClient()

  const [{ count: projectCount }, { count: developerCount }, { count: unitCount }] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('developers').select('id', { count: 'exact', head: true }),
    supabase.from('units').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black text-[#0F8F83]">Data Entry Hub</p>
        <h1 className="mt-1 text-3xl font-black text-[#102033] dark:text-white">مركز إدخال البيانات</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          رفع وتحديث بيانات المطورين، المشاريع، والوحدات. يدعم CSV و Excel مع Drag & Drop.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<Building2 className="size-5" />} label="مطورون" value={String(developerCount ?? 0)} color="teal" />
        <KpiCard icon={<FolderOpen className="size-5" />} label="مشاريع" value={String(projectCount ?? 0)} color="gold" />
        <KpiCard icon={<Layers className="size-5" />} label="وحدات" value={String(unitCount ?? 0)} color="slate" />
      </div>

      {/* Upload Panels */}
      <div className="grid gap-5 md:grid-cols-3">
        <ImportPanel
          title="رفع مطورين"
          description="أعمدة مطلوبة: name / الاسم — اختيارية: phone, address, description"
          icon={<Building2 className="size-6 text-[#0F8F83]" />}
          action={importDevelopersAction}
          accept=".csv,.xlsx,.xls"
        />
        <ImportPanel
          title="رفع مشاريع"
          description="أعمدة: name / اسم المشروع — اختيارية: location, total_units, status"
          icon={<FolderOpen className="size-6 text-[#C9964A]" />}
          action={importProjectsAction}
          accept=".csv,.xlsx,.xls"
        />
        <ImportPanel
          title="رفع وحدات / إنفنتوري"
          description="أعمدة: unit_number / رقم الوحدة — اختيارية: floor, area_sqm, price, status"
          icon={<Layers className="size-6 text-slate-500" />}
          action={importUnitsAction}
          accept=".csv,.xlsx,.xls"
        />
      </div>

      {/* Column guide */}
      <div className="rounded-xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
        <p className="mb-3 font-black text-[#102033] dark:text-white">دليل أعمدة الملفات</p>
        <div className="grid gap-4 text-xs font-semibold md:grid-cols-3">
          <ColGuide title="developers.csv" cols={['name (إلزامي)', 'phone', 'address', 'description']} />
          <ColGuide title="projects.csv" cols={['name (إلزامي)', 'location', 'total_units', 'status']} />
          <ColGuide title="units.xlsx" cols={['unit_number (إلزامي)', 'floor', 'area_sqm', 'price', 'status', 'bedrooms', 'bathrooms']} />
        </div>
        <p className="mt-3 text-[10px] font-semibold text-slate-400">
          أسماء الأعمدة مقبولة باللغتين العربية والإنجليزية · الصف الأول = رأس الجدول
        </p>
      </div>

      {/* Bulk Operations */}
      <div className="rounded-xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
        <p className="mb-4 font-black text-[#102033] dark:text-white">عمليات جماعية</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-[#DDE6E4] font-semibold">
            <FileSpreadsheet className="size-4" />
            تصدير كامل الإنفنتوري
          </Button>
          <Button variant="outline" className="border-[#DDE6E4] font-semibold">
            <RefreshCw className="size-4" />
            مزامنة الأسعار
          </Button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'teal' | 'gold' | 'slate' }) {
  const colors = { teal: 'text-[#0F8F83] bg-[#EEF6F5]', gold: 'text-[#C9964A] bg-[#C9964A]/10', slate: 'text-slate-500 bg-slate-100' }
  return (
    <div className="rounded-xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color]}`}>{icon}</div>
      <p className="text-4xl font-black text-[#102033] dark:text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  )
}

function ColGuide({ title, cols }: { title: string; cols: string[] }) {
  return (
    <div>
      <p className="mb-2 font-black text-[#102033] dark:text-white">{title}</p>
      <ul className="space-y-1">
        {cols.map((c) => (
          <li key={c} className="flex items-center gap-1.5 text-slate-500">
            {c.includes('إلزامي') ? (
              <CheckCircle2 className="size-3 text-[#0F8F83]" />
            ) : (
              <AlertCircle className="size-3 text-slate-300" />
            )}
            {c}
          </li>
        ))}
      </ul>
    </div>
  )
}
