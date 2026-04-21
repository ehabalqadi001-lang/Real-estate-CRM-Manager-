import { CheckCircle2, PauseCircle, XCircle } from 'lucide-react'
import { CompanyApprovalSheet, type AdminCompanyOwner, type AdminCompanyRow } from '@/components/admin/company-approval-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createTypedServerClient } from '@/lib/supabase/typed'
import { requirePermission } from '@/shared/rbac/require-permission'
import { approveCompany, rejectCompany, suspendCompany } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminCompaniesPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  await requirePermission('admin.view')
  const params = await searchParams
  const status = params?.status ?? 'all'
  const supabase = await createTypedServerClient()

  const [{ data: companies, error }, { data: owners }] = await Promise.all([
    supabase.from('companies').select('*').order('created_at', { ascending: false }),
    supabase
      .from('user_profiles')
      .select('id, full_name, email, phone, company_id, company_name, commercial_register_images, tax_card_images, vat_image, id_front_image, id_back_image')
      .eq('role', 'company_admin'),
  ])

  const filtered = (companies ?? []).filter((company) => {
    if (status === 'pending') return !company.active && !company.is_suspended
    if (status === 'active') return company.active && !company.is_suspended
    if (status === 'suspended') return company.is_suspended
    return true
  })

  return (
    <main className="space-y-5 p-4 sm:p-6" dir="rtl">
      <Header title="إدارة الشركات" subtitle="مراجعة الشركات، الموافقات، الوثائق والتعليق." />

      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'الكل'],
          ['pending', 'بانتظار الموافقة'],
          ['active', 'نشطة'],
          ['suspended', 'معلقة'],
        ].map(([key, label]) => (
          <a key={key} href={`/admin/companies?status=${key}`} className={`rounded-lg px-3 py-2 text-sm font-bold ${status === key ? 'bg-[var(--fi-ink)] text-white' : 'border border-[var(--fi-line)] bg-[var(--fi-paper)] text-[var(--fi-ink)]'}`}>
            {label}
          </a>
        ))}
      </div>

      {error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState message="لا توجد شركات في هذا التصنيف." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)]">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-[var(--fi-soft)] text-[var(--fi-muted)]">
              <tr>
                <th className="p-3 text-right">اسم الشركة</th>
                <th className="p-3 text-right">المسؤول</th>
                <th className="p-3 text-right">السجل التجاري</th>
                <th className="p-3 text-right">تاريخ التقديم</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => {
                const owner = owners?.find((item) => item.company_id === company.id || item.id === company.owner_id)
                const companyRow: AdminCompanyRow = {
                  id: company.id,
                  name: company.name,
                  active: company.active,
                  isSuspended: company.is_suspended,
                  planTier: company.plan_tier,
                  website: company.website,
                  createdAt: company.created_at,
                  suspendedReason: company.suspended_reason,
                }
                const ownerRow: AdminCompanyOwner | null = owner ? {
                  id: owner.id,
                  fullName: owner.full_name,
                  email: owner.email,
                  phone: owner.phone,
                  companyId: owner.company_id,
                  companyName: owner.company_name,
                  commercialRegisterImages: owner.commercial_register_images,
                  taxCardImages: owner.tax_card_images,
                  vatImage: owner.vat_image,
                  idFrontImage: owner.id_front_image,
                  idBackImage: owner.id_back_image,
                } : null

                return (
                  <tr key={company.id} className="border-t border-[var(--fi-line)]">
                    <td className="p-3 font-black text-[var(--fi-ink)]">{company.name}</td>
                    <td className="p-3 text-[var(--fi-muted)]">{owner?.full_name ?? owner?.email ?? 'غير محدد'}</td>
                    <td className="p-3">{Array.isArray(owner?.commercial_register_images) ? `${owner.commercial_register_images.length} ملف` : 'غير مرفق'}</td>
                    <td className="p-3">{company.created_at ? new Date(company.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                    <td className="p-3"><CompanyStatus company={company} /></td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <form action={approveCompany}>
                          <input type="hidden" name="id" value={company.id} />
                          <Button size="sm"><CheckCircle2 className="size-4" />موافقة</Button>
                        </form>
                        <form action={rejectCompany} className="flex gap-1">
                          <input type="hidden" name="id" value={company.id} />
                          <Input name="reason" placeholder="سبب الرفض" className="h-8 w-32" />
                          <Button size="sm" variant="destructive"><XCircle className="size-4" />رفض</Button>
                        </form>
                        <form action={suspendCompany}>
                          <input type="hidden" name="id" value={company.id} />
                          <input type="hidden" name="reason" value="تعليق من المالك" />
                          <Button size="sm" variant="outline"><PauseCircle className="size-4" />تعليق</Button>
                        </form>
                        <CompanyApprovalSheet company={companyRow} owner={ownerRow} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5">
      <h1 className="text-2xl font-black text-[var(--fi-ink)]">{title}</h1>
      <p className="mt-1 text-sm text-[var(--fi-muted)]">{subtitle}</p>
    </section>
  )
}

function CompanyStatus({ company }: { company: { active: boolean | null; is_suspended: boolean } }) {
  if (company.is_suspended) return <Badge variant="destructive">معلقة</Badge>
  if (company.active) return <Badge>نشطة</Badge>
  return <Badge variant="secondary">بانتظار الموافقة</Badge>
}

function ErrorState({ message }: { message: string }) {
  return <Card><CardContent className="p-8 text-center text-destructive">{message}</CardContent></Card>
}

function EmptyState({ message }: { message: string }) {
  return <Card><CardContent className="p-8 text-center text-[var(--fi-muted)]">{message}</CardContent></Card>
}
