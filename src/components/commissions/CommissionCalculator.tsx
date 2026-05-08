'use client'

import { useMemo, useState, useTransition } from 'react'
import { Calculator, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createDealFromCalculator } from '@/app/dashboard/commissions/actions'
import type { CommissionLeadOption, CommissionProjectOption, CommissionRateOption } from './commission-types'
import { useI18n } from '@/hooks/use-i18n'

export function CommissionCalculator({
  projects,
  rates,
  leads,
}: {
  projects: CommissionProjectOption[]
  rates: CommissionRateOption[]
  leads: CommissionLeadOption[]
}) {
  const { t, numLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const [dealValue, setDealValue] = useState('5000000')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [leadId, setLeadId] = useState('')
  const [isPending, startTransition] = useTransition()
  const project = projects.find((item) => item.id === projectId)
  const value = Number(dealValue || 0)

  const currency = t('ج.م', 'EGP')

  function formatMoney(val: number) {
    return `${new Intl.NumberFormat(numLocale, { maximumFractionDigits: 0 }).format(val)} ${currency}`
  }

  const calculation = useMemo(() => {
    const selectedRate = rates
      .filter((rate) => (!rate.projectId || rate.projectId === projectId) && (!rate.developerId || rate.developerId === project?.developerId))
      .filter((rate) => value >= rate.minValue && (rate.maxValue === null || value <= rate.maxValue))
      .sort((a, b) => (a.projectId ? -1 : 1) || b.minValue - a.minValue)[0]

    const rate = selectedRate?.ratePercentage ?? 2.5
    const agentShare = selectedRate?.agentSharePercentage ?? 70
    const companyShare = selectedRate?.companySharePercentage ?? 30
    const gross = value * rate / 100

    return {
      rate,
      gross,
      agentAmount: gross * agentShare / 100,
      companyAmount: gross * companyShare / 100,
    }
  }, [project?.developerId, projectId, rates, value])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="gap-2 bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90" />}>
        <Calculator className="size-4" />
        {t('حاسبة العمولة', 'Commission Calculator')}
      </SheetTrigger>
      <SheetContent side="left" className="bg-white sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right text-xl font-black">{t('حاسبة العمولة', 'Commission Calculator')}</SheetTitle>
          <SheetDescription className="text-right font-semibold">{t('احسب نصيب الوسيط والشركة قبل تسجيل الصفقة.', 'Calculate agent and company share before registering the deal.')}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <label className="grid gap-1 text-sm font-black">
            {t('قيمة الصفقة', 'Deal Value')}
            <Input inputMode="numeric" value={dealValue} onChange={(event) => setDealValue(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-black">
            {t('المشروع', 'Project')}
            <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.developerName}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-black">
            {t('العميل', 'Client')}
            <select className="h-10 rounded-lg border border-[var(--fi-line)] bg-white px-3" value={leadId} onChange={(event) => setLeadId(event.target.value)}>
              <option value="">{t('بدون عميل محدد', 'No client selected')}</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}
            </select>
          </label>
          <div className="grid gap-2 rounded-lg border border-[var(--fi-line)] bg-[var(--fi-soft)] p-3">
            <CalcRow label={t('نسبة العمولة', 'Commission Rate')} value={`${calculation.rate.toLocaleString(numLocale)}%`} />
            <CalcRow label={t('العمولة الإجمالية', 'Total Commission')} value={formatMoney(calculation.gross)} />
            <CalcRow label={t('نصيب الوسيط', 'Agent Share')} value={formatMoney(calculation.agentAmount)} />
            <CalcRow label={t('نصيب الشركة', 'Company Share')} value={formatMoney(calculation.companyAmount)} />
          </div>
          <Button
            className="h-10 w-full gap-2 bg-[var(--fi-emerald)] text-white hover:bg-[var(--fi-emerald)]/90"
            disabled={isPending || !value}
            onClick={() => startTransition(async () => {
              try {
                await createDealFromCalculator({
                  leadId: leadId || null,
                  projectId: projectId || null,
                  value,
                  title: t(`صفقة ${project?.name ?? 'عقارية'} بقيمة ${formatMoney(value)}`, `${project?.name ?? 'Property'} deal worth ${formatMoney(value)}`),
                })
                toast.success(t('تم إنشاء صفقة مبدئية', 'Draft deal created'))
                setOpen(false)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : t('تعذر إنشاء الصفقة', 'Could not create deal'))
              }
            })}
          >
            <Plus className="size-4" />
            {t('إضافة صفقة بهذه البيانات', 'Add Deal with These Values')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-bold text-[var(--fi-muted)]">{label}</span>
      <span className="font-black text-[var(--fi-ink)]">{value}</span>
    </div>
  )
}
