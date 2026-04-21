'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, FileText, Info, PauseCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { approveCompany, rejectCompany, requestCompanyInfo, suspendCompany } from '@/app/admin/companies/actions'

export interface AdminCompanyRow {
  id: string
  name: string
  active: boolean | null
  isSuspended: boolean
  planTier: string
  website: string | null
  createdAt: string | null
  suspendedReason: string | null
}

export interface AdminCompanyOwner {
  id: string
  fullName: string | null
  email: string
  phone: string
  companyId: string | null
  companyName: string | null
  commercialRegisterImages: unknown
  taxCardImages: unknown
  vatImage: string | null
  idFrontImage: string | null
  idBackImage: string | null
}

interface CompanyApprovalSheetProps {
  company: AdminCompanyRow
  owner: AdminCompanyOwner | null
}

function collectDocuments(owner: AdminCompanyOwner | null) {
  if (!owner) return []
  const docs: { label: string; url: string }[] = []

  function pushMany(label: string, value: unknown) {
    if (!value) return
    if (typeof value === 'string') docs.push({ label, url: value })
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string') docs.push({ label: `${label} ${index + 1}`, url: item })
        if (item && typeof item === 'object' && typeof (item as { url?: unknown }).url === 'string') {
          docs.push({ label: `${label} ${index + 1}`, url: String((item as { url: string }).url) })
        }
      })
    }
  }

  pushMany('السجل التجاري', owner.commercialRegisterImages)
  pushMany('البطاقة الضريبية', owner.taxCardImages)
  pushMany('شهادة ضريبة القيمة المضافة', owner.vatImage)
  pushMany('وجه البطاقة', owner.idFrontImage)
  pushMany('ظهر البطاقة', owner.idBackImage)

  return docs
}

export function CompanyApprovalSheet({ company, owner }: CompanyApprovalSheetProps) {
  const [open, setOpen] = useState(false)
  const documents = useMemo(() => collectDocuments(owner), [owner])

  return (
    <>
      <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(true)}>
        <FileText className="size-4" />
        مراجعة
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-3xl" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-xl font-black">{company.name}</SheetTitle>
            <SheetDescription>
              طلب انضمام شركة · {company.createdAt ? new Date(company.createdAt).toLocaleDateString('ar-EG') : 'تاريخ غير محدد'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-4">
            <section className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="المسؤول" value={owner?.fullName ?? owner?.email ?? 'غير محدد'} />
              <InfoItem label="البريد" value={owner?.email ?? 'غير محدد'} dir="ltr" />
              <InfoItem label="الهاتف" value={owner?.phone ?? 'غير محدد'} dir="ltr" />
              <InfoItem label="الخطة" value={company.planTier} />
              <InfoItem label="الموقع" value={company.website ?? 'غير مسجل'} dir="ltr" />
              <div className="rounded-lg border border-[var(--fi-line)] p-3">
                <p className="text-xs text-[var(--fi-muted)]">الحالة</p>
                <div className="mt-2"><CompanyStatus company={company} /></div>
              </div>
            </section>

            {company.suspendedReason ? (
              <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 text-sm text-[var(--fi-ink)]">
                {company.suspendedReason}
              </div>
            ) : null}

            <section className="space-y-3">
              <h3 className="font-black text-[var(--fi-ink)]">الوثائق المرفوعة</h3>
              {documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--fi-line)] p-8 text-center text-sm text-[var(--fi-muted)]">
                  لا توجد وثائق مرفوعة لهذه الشركة.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <a key={`${doc.label}-${doc.url}`} href={doc.url} target="_blank" rel="noreferrer" className="group rounded-lg border border-[var(--fi-line)] bg-[var(--fi-paper)] p-3 transition hover:shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-[var(--fi-emerald)]" />
                          <span className="font-bold text-[var(--fi-ink)]">{doc.label}</span>
                        </div>
                        <ExternalLink className="size-4 text-[var(--fi-muted)]" />
                      </div>
                      <p className="mt-2 truncate text-xs text-[var(--fi-muted)]" dir="ltr">{doc.url}</p>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-3 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 lg:grid-cols-2">
              <form action={approveCompany}>
                <input type="hidden" name="id" value={company.id} />
                <Button className="w-full"><CheckCircle2 className="size-4" />موافقة وإرسال ترحيب</Button>
              </form>

              <form action={suspendCompany}>
                <input type="hidden" name="id" value={company.id} />
                <input type="hidden" name="reason" value="تعليق من مالك المنصة بعد مراجعة الوثائق" />
                <Button className="w-full" variant="outline"><PauseCircle className="size-4" />تعليق الشركة</Button>
              </form>

              <form action={rejectCompany} className="space-y-2">
                <input type="hidden" name="id" value={company.id} />
                <Input name="reason" required placeholder="سبب الرفض" />
                <Button className="w-full" variant="destructive"><XCircle className="size-4" />رفض وإرسال السبب</Button>
              </form>

              <form action={requestCompanyInfo} className="space-y-2">
                <input type="hidden" name="id" value={company.id} />
                <Input name="reason" required placeholder="البيانات المطلوبة من الشركة" />
                <Button className="w-full" variant="outline"><Info className="size-4" />طلب استكمال بيانات</Button>
              </form>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function InfoItem({ label, value, dir }: { label: string; value: string; dir?: 'rtl' | 'ltr' }) {
  return (
    <div className="rounded-lg border border-[var(--fi-line)] p-3">
      <p className="text-xs text-[var(--fi-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--fi-ink)]" dir={dir}>{value}</p>
    </div>
  )
}

function CompanyStatus({ company }: { company: AdminCompanyRow }) {
  if (company.isSuspended) return <Badge variant="destructive">معلقة</Badge>
  if (company.active) return <Badge>نشطة</Badge>
  return <Badge variant="secondary">بانتظار الموافقة</Badge>
}
