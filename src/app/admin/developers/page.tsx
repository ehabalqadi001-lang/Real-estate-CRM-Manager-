import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import { saveCommissionRate, saveDeveloper } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminDevelopersPage() {
  await requirePermission('admin.view')
  const supabase = await createTypedServerClient()
  const [{ data: developers }, { data: projects }, { data: rates }] = await Promise.all([
    supabase.from('developers').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name, developer_id').order('name'),
    supabase.from('commission_rates').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <main className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[420px_1fr]" dir="rtl">
      <section className="space-y-5">
        <Card>
          <CardHeader><CardTitle>إضافة مطور</CardTitle></CardHeader>
          <CardContent>
            <form action={saveDeveloper} className="space-y-3">
              <Field name="name" label="الاسم بالإنجليزية" required />
              <Field name="name_ar" label="الاسم بالعربية" required />
              <Field name="phone" label="الهاتف" />
              <Field name="email" label="البريد" type="email" />
              <Field name="website" label="الموقع" />
              <select name="tier" className="h-8 w-full rounded-lg border px-2 text-sm"><option value="premium">Premium</option><option value="standard">Standard</option><option value="basic">Basic</option></select>
              <label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked /> نشط</label>
              <Button className="w-full">حفظ المطور</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>إعداد نسبة عمولة</CardTitle></CardHeader>
          <CardContent>
            <form action={saveCommissionRate} className="space-y-3">
              <select name="developer_id" className="h-8 w-full rounded-lg border px-2 text-sm" required>{developers?.map((developer) => <option key={developer.id} value={developer.id}>{developer.name_ar ?? developer.name}</option>)}</select>
              <select name="project_id" className="h-8 w-full rounded-lg border px-2 text-sm"><option value="">كل المشاريع</option>{projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              <Field name="min_value" label="أقل قيمة صفقة" type="number" defaultValue="0" />
              <Field name="max_value" label="أعلى قيمة صفقة" type="number" />
              <Field name="rate_percentage" label="نسبة العمولة %" type="number" step="0.1" required />
              <div className="grid grid-cols-2 gap-2"><Field name="agent_share_percentage" label="نصيب الوكيل %" type="number" defaultValue="70" /><Field name="company_share_percentage" label="نصيب الشركة %" type="number" defaultValue="30" /></div>
              <Button className="w-full">حفظ النسبة</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Card><CardHeader><CardTitle>المطورون</CardTitle></CardHeader><CardContent className="space-y-3">{developers?.map((developer) => <div key={developer.id} className="rounded-lg border border-[var(--fi-line)] p-4"><p className="font-black">{developer.name_ar ?? developer.name}</p><p className="text-sm text-[var(--fi-muted)]">{developer.email ?? developer.phone ?? 'لا توجد بيانات اتصال'} · {developer.tier}</p></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>نسب العمولة</CardTitle></CardHeader><CardContent className="space-y-3">{rates?.map((rate) => <div key={rate.id} className="rounded-lg border border-[var(--fi-line)] p-4 text-sm"><p className="font-black">{rate.rate_percentage}%</p><p className="text-[var(--fi-muted)]">وكيل {rate.agent_share_percentage}% · شركة {rate.company_share_percentage}%</p></div>)}</CardContent></Card>
      </section>
    </main>
  )
}

function Field(props: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  const { label, ...inputProps } = props
  return <div className="space-y-1.5"><Label htmlFor={props.name}>{label}</Label><Input id={props.name} {...inputProps} /></div>
}
