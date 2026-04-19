import { ShieldCheck, SlidersHorizontal, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AppRole } from '@/shared/auth/types'
import { loadPermissionMatrixData } from '@/shared/rbac/dynamic-engine'
import { hasPermission, type Permission } from '@/shared/rbac/permissions'
import { requirePermission } from '@/shared/rbac/require-permission'
import { PermissionToggle } from './PermissionToggle'

export const dynamic = 'force-dynamic'

type PermissionRow = {
  id: string
  key: string
  resource: string
  action: string
  description: string | null
}

const RESOURCE_LABELS: Record<string, string> = {
  ads: 'الإعلانات',
  projects: 'المشروعات',
  transactions: 'التحصيل والمعاملات',
  users: 'المستخدمون',
  inventory: 'المخزون',
  messages: 'الرسائل والتسويق',
  commissions: 'العمولات',
  platform: 'إدارة المنصة',
}

const ACTION_LABELS: Record<string, string> = {
  read: 'عرض',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'اعتماد',
  reject: 'رفض',
  import: 'استيراد',
  export: 'تصدير',
  broadcast: 'إرسال جماعي',
  whatsapp: 'واتساب',
  approve_payout: 'اعتماد صرف',
  grant_permissions: 'منح صلاحيات',
  impersonate: 'دخول كالمستخدم',
  manage: 'إدارة',
  audit: 'تدقيق',
  reports: 'تقارير',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير النظام',
  platform_admin: 'مدير المنصة',
  company_owner: 'مالك شركة',
  company_admin: 'مدير شركة',
  admin: 'مدير',
  company: 'شركة',
  broker: 'وسيط عقاري',
  agent: 'وسيط عقاري',
  viewer: 'مشاهد',
}

const ROLE_COLOR: Record<string, string> = {
  super_admin: 'bg-[#C9964A]/15 text-[#9A6B26] ring-1 ring-[#C9964A]/20',
  platform_admin: 'bg-[#27AE60]/10 text-[#1E874B] ring-1 ring-[#27AE60]/20',
  company_admin: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  company_owner: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  agent: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  broker: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

export default async function PermissionMatrixPage() {
  await requirePermission('platform.manage')
  const { profiles, permissions, overrides } = await loadPermissionMatrixData()

  const grouped = groupByResource(permissions)
  const resources = Object.keys(grouped).sort((a, b) => labelResource(a).localeCompare(labelResource(b), 'ar'))
  const overrideLookup = new Map<string, { granted: boolean }>()

  for (const override of overrides) {
    overrideLookup.set(`${override.user_id}__${override.permission_id}`, {
      granted: override.granted,
    })
  }

  return (
    <div className="mx-auto w-full max-w-[calc(100vw-2rem)] space-y-5 px-3 py-4 sm:px-5 lg:max-w-[1180px]" dir="rtl">
      <header className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-[#DDE6E4] bg-[#F7FBF8] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#27AE60]">
              <ShieldCheck className="size-4" />
              Super Admin
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-[#102033] sm:text-3xl">
              مصفوفة الصلاحيات
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              امنح أو امنع صلاحيات محددة لكل مستخدم. الاستثناءات هنا تتغلب على صلاحيات الدور الافتراضية فوراً.
            </p>
          </div>

          <div className="grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
            <Legend label="افتراضي من الدور" value="~" className="border-slate-200 bg-slate-50 text-slate-500" />
            <Legend label="ممنوح كاستثناء" value="✓" className="border-[#27AE60] bg-[#27AE60] text-white" />
            <Legend label="ممنوع كاستثناء" value="×" className="border-red-200 bg-red-50 text-red-700" />
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <Metric icon={Users} label="المستخدمون" value={profiles.length.toLocaleString('ar-EG')} />
          <Metric icon={SlidersHorizontal} label="الصلاحيات" value={permissions.length.toLocaleString('ar-EG')} />
          <Metric icon={ShieldCheck} label="الاستثناءات" value={overrides.length.toLocaleString('ar-EG')} />
        </div>
      </header>

      <div className="space-y-4">
        {resources.map((resource) => (
          <section key={resource} className="overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#DDE6E4] bg-[#FBFCFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#102033]">{labelResource(resource)}</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {grouped[resource].length.toLocaleString('ar-EG')} صلاحية قابلة للتحكم
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-400">اضغط على الخانة للتبديل: منح ← منع ← افتراضي</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#DDE6E4] bg-white">
                    <th className="sticky right-0 z-20 w-[240px] bg-white px-4 py-3 text-right text-xs font-black text-[#102033] shadow-[-8px_0_14px_-14px_rgba(15,23,42,0.45)]">
                      المستخدم
                    </th>
                    {grouped[resource].map((permission) => (
                      <th key={permission.id} title={permission.description ?? permission.key} className="min-w-[92px] px-2 py-3 text-center">
                        <span className="block text-xs font-black text-[#102033]">{labelAction(permission.action)}</span>
                        <span className="mt-1 block text-[10px] font-semibold text-slate-400">{permission.key}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, index) => {
                    const role = (profile.role ?? 'viewer') as AppRole

                    return (
                      <tr key={`${resource}-${profile.id}`} className={`border-b border-[#EEF2F1] ${index % 2 ? 'bg-[#FBFCFA]' : 'bg-white'}`}>
                        <td className="sticky right-0 z-10 w-[240px] bg-inherit px-4 py-3 shadow-[-8px_0_14px_-14px_rgba(15,23,42,0.45)]">
                          <p className="truncate text-sm font-black text-[#102033]">{profile.full_name ?? profile.email ?? 'Unknown'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge className={`rounded-full px-2 py-0.5 text-[10px] ${ROLE_COLOR[role] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                              {ROLE_LABELS[role] ?? role}
                            </Badge>
                            {profile.email && <span className="max-w-[150px] truncate text-[10px] font-semibold text-slate-400">{profile.email}</span>}
                          </div>
                        </td>

                        {grouped[resource].map((permission) => {
                          const override = overrideLookup.get(`${profile.id}__${permission.id}`)
                          const roleDefault = hasPermission(role, permission.key as Permission)
                          const currentState: 'granted' | 'revoked' | 'default' = override
                            ? override.granted ? 'granted' : 'revoked'
                            : 'default'

                          return (
                            <td key={`${profile.id}-${permission.id}`} className="px-2 py-3 text-center">
                              <PermissionToggle
                                userId={profile.id}
                                permissionId={permission.id}
                                permissionKey={permission.key}
                                currentState={currentState}
                                defaultGranted={roleDefault}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="rounded-lg border border-[#DDE6E4] bg-white p-10 text-center">
          <p className="font-black text-[#102033]">لا يوجد مستخدمون لعرضهم.</p>
        </div>
      )}
    </div>
  )
}

function groupByResource(permissions: PermissionRow[]) {
  return permissions.reduce<Record<string, PermissionRow[]>>((groups, permission) => {
    groups[permission.resource] ??= []
    groups[permission.resource].push(permission)
    return groups
  }, {})
}

function labelResource(resource: string) {
  return RESOURCE_LABELS[resource] ?? resource
}

function labelAction(action: string) {
  return ACTION_LABELS[action] ?? action.replaceAll('_', ' ')
}

function Legend({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <span className="flex items-center gap-2 rounded-lg border border-[#DDE6E4] bg-white px-3 py-2">
      <span className={`flex size-7 items-center justify-center rounded-md border text-sm font-black ${className}`}>{value}</span>
      {label}
    </span>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DDE6E4] bg-[#FBFCFA] p-4">
      <Icon className="size-5 text-[#27AE60]" />
      <p className="mt-3 text-2xl font-black text-[#102033]">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  )
}
