import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { requirePermission } from '@/shared/rbac/require-permission'
import { deletePartnerCommissionException, saveCommissionRate, saveDeveloper, savePartnerCommissionException } from './actions'

export const dynamic = 'force-dynamic'

const AREAS = [
  'NEW CAPITAL',
  'NEW CAIRO',
  '6TH OF OCTOBER',
  'ZAYED',
  'NEW ZAYED',
  'NORTH COAST',
  'AIN SOKHNA',
  'SHEROUK',
  'HELIOPOLIS',
  'NEW HELIOPOLIS',
  'AL OBOUR CITY',
] as const

export default async function AdminDevelopersPage() {
  await requirePermission('admin.view')
  const service = createServiceRoleClient()

  const [
    { data: developers },
    { data: projects },
    { data: rates },
    { data: exceptions },
    { data: partners },
  ] = await Promise.all([
    service.from('developers').select('id, name, name_ar, email, phone, tier, active, region').order('name'),
    service.from('projects').select('id, name, developer_id').order('name'),
    service.from('commission_rates').select('*').order('created_at', { ascending: false }),
    service
      .from('partner_commission_exceptions')
      .select('id, profile_id, developer_id, project_id, developer_commission_rate, broker_commission_rate, note, created_at')
      .order('created_at', { ascending: false }),
    service
      .from('profiles')
      .select('id, full_name, email, account_type, role')
      .in('account_type', ['individual', 'company', 'client'])
      .or('role.eq.broker,role.eq.company_owner,role.eq.company_admin,role.eq.CLIENT,role.eq.viewer')
      .order('full_name'),
  ])

  const developerMap = Object.fromEntries((developers ?? []).map((d) => [d.id, d.name_ar ?? d.name]))
  const projectMap = Object.fromEntries((projects ?? []).map((p) => [p.id, p.name]))
  const partnerMap = Object.fromEntries((partners ?? []).map((p) => [p.id, p.full_name ?? p.email]))

  return (
    <main className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[440px_1fr]" dir="rtl">

      {/* ── Left column: forms ── */}
      <section className="space-y-5">

        {/* Add developer */}
        <Card>
          <CardHeader><CardTitle>إضافة مطور</CardTitle></CardHeader>
          <CardContent>
            <form action={saveDeveloper} className="space-y-3">
              <Field name="name" label="الاسم بالإنجليزية" required />
              <Field name="name_ar" label="الاسم بالعربية" required />
              <Field name="phone" label="الهاتف" />
              <Field name="email" label="البريد" type="email" />
              <Field name="website" label="الموقع" />
              <select name="tier" className="h-8 w-full rounded-lg border px-2 text-sm">
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="basic">Basic</option>
              </select>

              {/* Regions */}
              <div className="space-y-1.5">
                <Label>المناطق الجغرافية</Label>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border bg-muted/30 p-3">
                  {AREAS.map((area) => (
                    <label key={area} className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                      <input type="checkbox" name="regions" value={area} className="accent-emerald-600" />
                      {area}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input name="active" type="checkbox" defaultChecked /> نشط
              </label>
              <Button className="w-full">حفظ المطور</Button>
            </form>
          </CardContent>
        </Card>

        {/* Standard commission rates */}
        <Card>
          <CardHeader>
            <CardTitle>نسبة عمولة قياسية</CardTitle>
            <p className="text-xs text-muted-foreground">تُطبَّق على جميع الشركاء ما لم تكن هناك استثناء خاص</p>
          </CardHeader>
          <CardContent>
            <form action={saveCommissionRate} className="space-y-3">
              <div className="space-y-1.5">
                <Label>المطور</Label>
                <select name="developer_id" className="h-8 w-full rounded-lg border px-2 text-sm" required>
                  {developers?.map((d) => <option key={d.id} value={d.id}>{d.name_ar ?? d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المشروع (اختياري — فارغ = كل المشاريع)</Label>
                <select name="project_id" className="h-8 w-full rounded-lg border px-2 text-sm">
                  <option value="">كل المشاريع</option>
                  {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <Field name="min_value" label="أقل قيمة صفقة" type="number" defaultValue="0" />
              <Field name="max_value" label="أعلى قيمة صفقة (فارغ = بلا حد)" type="number" />
              <Field name="rate_percentage" label="نسبة عمولة المطور %" type="number" step="0.01" required />
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <Field name="agent_share_percentage" label="نصيب الوكيل %" type="number" defaultValue="70" />
                <Field name="company_share_percentage" label="نصيب الشركة %" type="number" defaultValue="30" />
              </div>
              <Button className="w-full">حفظ النسبة القياسية</Button>
            </form>
          </CardContent>
        </Card>

        {/* Partner commission exceptions */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">استثناء عمولة لشريك</CardTitle>
            <p className="text-xs text-muted-foreground">تُلغي النسبة القياسية لشريك بعينه على مطور أو مشروع محدد</p>
          </CardHeader>
          <CardContent>
            <form action={savePartnerCommissionException} className="space-y-3">
              <div className="space-y-1.5">
                <Label>الشريك (وسيط / شركة)</Label>
                <select name="profile_id" className="h-8 w-full rounded-lg border px-2 text-sm" required>
                  <option value="">اختر شريكاً…</option>
                  {partners?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? p.email} — {p.account_type ?? p.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المطور</Label>
                <select name="developer_id" className="h-8 w-full rounded-lg border px-2 text-sm" required>
                  <option value="">اختر مطوراً…</option>
                  {developers?.map((d) => <option key={d.id} value={d.id}>{d.name_ar ?? d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المشروع (اختياري — فارغ = كل مشاريع هذا المطور)</Label>
                <select name="project_id" className="h-8 w-full rounded-lg border px-2 text-sm">
                  <option value="">كل المشاريع</option>
                  {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <Field name="developer_commission_rate" label="عمولة المطور %" type="number" step="0.01" required />
                <Field name="broker_commission_rate" label="عمولة الشريك %" type="number" step="0.01" required />
              </div>
              <Field name="note" label="ملاحظة (اختياري)" />
              <Button className="w-full bg-amber-600 hover:bg-amber-700">حفظ الاستثناء</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* ── Right column: lists ── */}
      <section className="space-y-5">

        {/* Developers list */}
        <Card>
          <CardHeader><CardTitle>المطورون ({developers?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {developers?.map((d) => (
              <div key={d.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black">{d.name_ar ?? d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.email ?? d.phone ?? '—'} · {d.tier}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${d.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.active ? 'نشط' : 'معطل'}
                  </span>
                </div>
                {d.region && d.region !== 'متعدد المناطق' && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.region.split(',').map((r: string) => r.trim()).filter(Boolean).map((r: string) => (
                      <span key={r} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">{r}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Standard commission rates */}
        <Card>
          <CardHeader><CardTitle>النسب القياسية ({rates?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {rates?.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <p className="font-black">{developerMap[r.developer_id] ?? r.developer_id} {r.project_id ? `· ${projectMap[r.project_id] ?? ''}` : '· كل المشاريع'}</p>
                <p className="text-muted-foreground">
                  عمولة المطور: <strong>{r.rate_percentage}%</strong>
                  {' · '}وكيل: {r.agent_share_percentage}%
                  {' · '}شركة: {r.company_share_percentage}%
                  {r.min_value || r.max_value ? ` · صفقة ${r.min_value?.toLocaleString('ar-EG') ?? 0}${r.max_value ? ` – ${r.max_value.toLocaleString('ar-EG')}` : '+'}` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Partner exceptions */}
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="text-amber-800">استثناءات العمولة ({exceptions?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(exceptions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">لا توجد استثناءات حتى الآن.</p>
            )}
            {exceptions?.map((ex) => (
              <div key={ex.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-black text-amber-900">{partnerMap[ex.profile_id] ?? ex.profile_id}</p>
                    <p className="text-amber-700">
                      {developerMap[ex.developer_id] ?? ex.developer_id}
                      {ex.project_id ? ` · ${projectMap[ex.project_id] ?? ex.project_id}` : ' · كل المشاريع'}
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      عمولة المطور: <strong>{ex.developer_commission_rate}%</strong>
                      {' · '}عمولة الشريك: <strong>{ex.broker_commission_rate}%</strong>
                      {ex.note ? ` · ${ex.note}` : ''}
                    </p>
                  </div>
                  <form action={deletePartnerCommissionException}>
                    <input type="hidden" name="id" value={ex.id} />
                    <button type="submit" className="rounded px-2 py-1 text-xs font-black text-red-600 hover:bg-red-50">حذف</button>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </section>
    </main>
  )
}

function Field(props: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  const { label, ...inputProps } = props
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...inputProps} />
    </div>
  )
}
