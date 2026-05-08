'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, FileText, Info, PauseCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { approveCompany, rejectCompany, requestCompanyInfo, suspendCompany } from '@/app/admin/companies/actions'
import { useI18n } from '@/hooks/use-i18n'

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

function collectDocuments(owner: AdminCompanyOwner | null, labels: Record<string, string>) {
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

  pushMany(labels.commercialRegister, owner.commercialRegisterImages)
  pushMany(labels.taxCard, owner.taxCardImages)
  pushMany(labels.vatCert, owner.vatImage)
  pushMany(labels.idFront, owner.idFrontImage)
  pushMany(labels.idBack, owner.idBackImage)

  return docs
}

export function CompanyApprovalSheet({ company, owner }: CompanyApprovalSheetProps) {
  const { t, numLocale } = useI18n()
  const [open, setOpen] = useState(false)

  const docLabels = {
    commercialRegister: t('السجل التجاري', 'Commercial Register'),
    taxCard: t('البطاقة الضريبية', 'Tax Card'),
    vatCert: t('شهادة ضريبة القيمة المضافة', 'VAT Certificate'),
    idFront: t('وجه البطاقة', 'ID Front'),
    idBack: t('ظهر البطاقة', 'ID Back'),
  }

  const documents = useMemo(() => collectDocuments(owner, docLabels), [owner, docLabels])

  return (
    <>
      <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(true)}>
        <FileText className="size-4" />
        {t('مراجعة', 'Review')}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-3xl" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-xl font-black">{company.name}</SheetTitle>
            <SheetDescription>
              {t('طلب انضمام شركة', 'Company Join Request')} · {company.createdAt ? new Date(company.createdAt).toLocaleDateString(numLocale) : t('تاريخ غير محدد', 'Date unknown')}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-4">
            <section className="grid gap-3 sm:grid-cols-2">
              <InfoItem label={t('المسؤول', 'Contact')} value={owner?.fullName ?? owner?.email ?? t('غير محدد', 'N/A')} />
              <InfoItem label={t('البريد', 'Email')} value={owner?.email ?? t('غير محدد', 'N/A')} dir="ltr" />
              <InfoItem label={t('الهاتف', 'Phone')} value={owner?.phone ?? t('غير محدد', 'N/A')} dir="ltr" />
              <InfoItem label={t('الخطة', 'Plan')} value={company.planTier} />
              <InfoItem label={t('الموقع', 'Website')} value={company.website ?? t('غير مسجل', 'Not registered')} dir="ltr" />
              <div className="rounded-lg border border-[var(--fi-line)] p-3">
                <p className="text-xs text-[var(--fi-muted)]">{t('الحالة', 'Status')}</p>
                <div className="mt-2"><CompanyStatus company={company} t={t} /></div>
              </div>
            </section>

            {company.suspendedReason ? (
              <div className="rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3 text-sm text-[var(--fi-ink)]">
                {company.suspendedReason}
              </div>
            ) : null}

            <section className="space-y-3">
              <h3 className="font-black text-[var(--fi-ink)]">{t('الوثائق المرفوعة', 'Uploaded Documents')}</h3>
              {documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--fi-line)] p-8 text-center text-sm text-[var(--fi-muted)]">
                  {t('لا توجد وثائق مرفوعة لهذه الشركة.', 'No documents uploaded for this company.')}
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
                <Button className="w-full"><CheckCircle2 className="size-4" />{t('موافقة وإرسال ترحيب', 'Approve & Send Welcome')}</Button>
              </form>

              <form action={suspendCompany}>
                <input type="hidden" name="id" value={company.id} />
                <input type="hidden" name="reason" value={t('تعليق من مالك المنصة بعد مراجعة الوثائق', 'Suspended by platform owner after document review')} />
                <Button className="w-full" variant="outline"><PauseCircle className="size-4" />{t('تعليق الشركة', 'Suspend Company')}</Button>
              </form>

              <form action={rejectCompany} className="space-y-2">
                <input type="hidden" name="id" value={company.id} />
                <Input name="reason" required placeholder={t('سبب الرفض', 'Rejection reason')} />
                <Button className="w-full" variant="destructive"><XCircle className="size-4" />{t('رفض وإرسال السبب', 'Reject & Send Reason')}</Button>
              </form>

              <form action={requestCompanyInfo} className="space-y-2">
                <input type="hidden" name="id" value={company.id} />
                <Input name="reason" required placeholder={t('البيانات المطلوبة من الشركة', 'Data required from company')} />
                <Button className="w-full" variant="outline"><Info className="size-4" />{t('طلب استكمال بيانات', 'Request More Info')}</Button>
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

function CompanyStatus({ company, t }: { company: AdminCompanyRow; t: (ar: string, en: string) => string }) {
  if (company.isSuspended) return <Badge variant="destructive">{t('معلقة', 'Suspended')}</Badge>
  if (company.active) return <Badge>{t('نشطة', 'Active')}</Badge>
  return <Badge variant="secondary">{t('بانتظار الموافقة', 'Pending Approval')}</Badge>
}
