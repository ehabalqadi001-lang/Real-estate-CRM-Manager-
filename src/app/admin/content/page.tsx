import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import { saveAnnouncement, toggleAnnouncement } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  await requirePermission('admin.view')
  const supabase = await createTypedServerClient()
  const { data: announcements } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })

  return (
    <main className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[420px_1fr]" dir="rtl">
      <Card><CardHeader><CardTitle>إعلان جديد</CardTitle></CardHeader><CardContent><form action={saveAnnouncement} className="space-y-3"><Field name="title" label="العنوان" required /><div className="space-y-1"><Label>النص</Label><Textarea name="body" /></div><select name="type" className="h-8 w-full rounded-lg border px-2"><option value="banner">Banner</option><option value="card">Card</option><option value="popup">Popup</option><option value="featured_notice">Featured Notice</option></select><select name="target_audience" className="h-8 w-full rounded-lg border px-2"><option value="all">الكل</option><option value="individuals">أفراد</option><option value="companies">شركات</option><option value="agents">وكلاء</option></select><Field name="start_date" label="تاريخ البداية" type="datetime-local" /><Field name="end_date" label="تاريخ النهاية" type="datetime-local" /><Button className="w-full">نشر الإعلان</Button></form></CardContent></Card>
      <section className="space-y-4">
        <Card><CardHeader><CardTitle>معاينة على لوحة التحكم</CardTitle></CardHeader><CardContent><div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4"><p className="font-black">تنبيه مميز</p><p className="text-sm text-[var(--fi-muted)]">سيظهر الإعلان هنا حسب النوع والجمهور المستهدف.</p></div></CardContent></Card>
        {announcements?.map((item) => <Card key={item.id}><CardContent className="flex items-center justify-between gap-4 p-4"><div><p className="font-black">{item.title}</p><p className="text-sm text-[var(--fi-muted)]">{item.type} · {item.target_audience} · {item.is_active ? 'نشط' : 'متوقف'}</p></div><form action={toggleAnnouncement}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="is_active" value={item.is_active ? 'false' : 'true'} /><Button variant="outline">{item.is_active ? 'إيقاف' : 'تفعيل'}</Button></form></CardContent></Card>)}
      </section>
    </main>
  )
}

function Field(props: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  const { label, ...inputProps } = props
  return <div className="space-y-1"><Label>{label}</Label><Input {...inputProps} /></div>
}
