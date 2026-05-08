import { requirePermission } from '@/shared/rbac/require-permission'
import { createServerClient } from '@/lib/supabase/server'
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
        <p className="text-sm font-black text-[var(--fi-emerald)]">Data Entry Hub</p>
        <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">مركز إدخال البيانات</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
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
          icon={<Building2 className="size-6 text-[var(--fi-emerald)]" />}
          action={importDevelopersAction}
          accept=".csv,.xlsx"
        />
        <ImportPanel
          title="رفع مشاريع"
          description="أعمدة: name / اسم المشروع — اختيارية: location, total_units, status"
          icon={<FolderOpen className="size-6" style={{ color: '#C9964A' }} />}
          action={importProjectsAction}
          accept=".csv,.xlsx"
        />
        <ImportPanel
          title="رفع وحدات / إنفنتوري"
          description="أعمدة: unit_number / رقم الوحدة — اختيارية: floor, area_sqm, price, status"
          icon={<Layers className="size-6 text-[var(--fi-muted)]" />}
          action={importUnitsAction}
          accept=".csv,.xlsx"
        />
      </div>

      {/* Column guide */}
      <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
        <p className="mb-3 font-black text-[var(--fi-ink)]">دليل أعمدة الملفات</p>
        <div className="grid gap-4 text-xs font-semibold md:grid-cols-3">
          <ColGuide title="developers.csv" cols={['name (إلزامي)', 'phone', 'address', 'description']} />
          <ColGuide title="projects.csv" cols={['name (إلزامي)', 'location', 'total_units', 'status']} />
          <ColGuide title="units.xlsx" cols={['unit_number (إلزامي)', 'floor', 'area_sqm', 'price', 'status', 'bedrooms', 'bathrooms']} />
        </div>
        <p className="mt-3 text-[10px] font-semibold text-[var(--fi-muted)]">
          أسماء الأعمدة مقبولة باللغتين العربية والإنجليزية · الصف الأول = رأس الجدول
        </p>
      </div>

      {/* Bulk Operations */}
      <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
        <p className="mb-4 font-black text-[var(--fi-ink)]">عمليات جماعية</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="font-semibold">
            <FileSpreadsheet className="size-4" />
            تصدير كامل الإنفنتوري
          </Button>
          <Button variant="outline" className="font-semibold">
            <RefreshCw className="size-4" />
            مزامنة الأسعار
          </Button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'teal' | 'gold' | 'slate' }) {
  const colors = {
    teal:  'text-[var(--fi-emerald)] bg-[var(--fi-soft)]',
    gold:  'bg-[#C9964A]/10 text-[#C9964A]',
    slate: 'text-[var(--fi-muted)] bg-[var(--fi-soft)]',
  }
  return (
    <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color]}`}>{icon}</div>
      <p className="text-4xl font-black text-[var(--fi-ink)]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">{label}</p>
    </div>
  )
}

function ColGuide({ title, cols }: { title: string; cols: string[] }) {
  return (
    <div>
      <p className="mb-2 font-black text-[var(--fi-ink)]">{title}</p>
      <ul className="space-y-1">
        {cols.map((c) => (
          <li key={c} className="flex items-center gap-1.5 text-[var(--fi-muted)]">
            {c.includes('إلزامي') ? (
              <CheckCircle2 className="size-3 text-[var(--fi-emerald)]" />
            ) : (
              <AlertCircle className="size-3 text-[var(--fi-line)]" />
            )}
            {c}
          </li>
        ))}
      </ul>
    </div>
  )
}
