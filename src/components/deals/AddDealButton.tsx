'use client'

import { useState } from 'react'
import { Briefcase, DollarSign, Loader2, Percent, PlusIcon, User, X } from 'lucide-react'
import { closeDeal } from '@/app/dashboard/deals/actions'
import { useI18n } from '@/hooks/use-i18n'

interface Lead {
  id: string
  client_name: string
}

interface TeamMember {
  id: string
  full_name: string
}

interface AddDealButtonProps {
  activeLeads: Lead[]
  teamMembers: TeamMember[]
}

export default function AddDealButton({ activeLeads, teamMembers }: AddDealButtonProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = activeLeads.length > 0 && teamMembers.length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const leadId = String(formData.get('leadId') ?? '')
    const agentId = String(formData.get('agentId') ?? '')
    const finalPrice = Number(formData.get('finalPrice'))
    const commissionRate = Number(formData.get('commissionRate'))

    if (!leadId) {
      setError(t('اختر العميل الذي أتم الشراء أولاً.', 'Please select the client who made the purchase first.'))
      return
    }

    if (!agentId) {
      setError(t('اختر الوكيل المسؤول عن الصفقة أولاً.', 'Please select the agent responsible for this deal first.'))
      return
    }

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      setError(t('أدخل قيمة عقد صحيحة أكبر من صفر.', 'Enter a valid contract value greater than zero.'))
      return
    }

    if (!Number.isFinite(commissionRate) || commissionRate <= 0) {
      setError(t('أدخل نسبة عمولة صحيحة أكبر من صفر.', 'Enter a valid commission rate greater than zero.'))
      return
    }

    setIsLoading(true)

    try {
      const response = await closeDeal({
        leadId,
        agentId,
        finalPrice,
        commissionRate,
        discount: 0,
      })

      if (response?.success) {
        setIsOpen(false)
        window.location.reload()
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : t('تعذر حفظ الصفقة. حاول مرة أخرى.', 'Failed to save the deal. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-emerald-700"
      >
        <PlusIcon size={18} aria-hidden="true" />
        {t('توثيق صفقة جديدة', 'Document New Deal')}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-800">
                <Briefcase className="text-emerald-600" aria-hidden="true" />
                {t('توثيق عقد مبيعات', 'Document Sales Contract')}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200"
                aria-label={t('إغلاق', 'Close')}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5 p-6">
              {!canSubmit ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-800">
                  {activeLeads.length === 0
                    ? t('لا يوجد عملاء نشطون متاحون للتوثيق حالياً.', 'No active clients available for documentation currently.')
                    : t('لا يوجد وكلاء متاحون داخل الشركة. أضف وكيلاً أو فعّل حساب الوكيل أولاً.', 'No agents available in the company. Add an agent or activate an agent account first.')}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <User size={16} aria-hidden="true" />
                  {t('العميل', 'Client')}
                </label>
                <select
                  name="leadId"
                  defaultValue=""
                  disabled={isLoading || activeLeads.length === 0}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{t('اختر العميل الذي أتم الشراء...', 'Select the client who made the purchase...')}</option>
                  {activeLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.client_name || t('عميل بدون اسم', 'Unnamed client')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <User size={16} aria-hidden="true" />
                  {t('الوكيل المسؤول', 'Responsible Agent')}
                </label>
                <select
                  name="agentId"
                  defaultValue=""
                  disabled={isLoading || teamMembers.length === 0}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{t('اختر الوكيل لإضافة العمولة لحسابه...', 'Select agent to credit the commission...')}</option>
                  {teamMembers.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.full_name || t('وكيل بدون اسم', 'Unnamed agent')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <DollarSign size={16} aria-hidden="true" />
                    {t('قيمة العقد النهائية', 'Final Contract Value')}
                  </label>
                  <input
                    type="number"
                    name="finalPrice"
                    min="1"
                    inputMode="decimal"
                    disabled={isLoading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-bold outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={t('مثال: 5000000', 'e.g. 5000000')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <Percent size={16} aria-hidden="true" />
                    {t('نسبة العمولة (%)', 'Commission Rate (%)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="commissionRate"
                    min="0.01"
                    inputMode="decimal"
                    disabled={isLoading}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-bold outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={t('مثال: 2.5', 'e.g. 2.5')}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 p-3.5 font-black text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      {t('جاري التوثيق...', 'Documenting...')}
                    </>
                  ) : (
                    t('تأكيد الصفقة وحساب العمولة', 'Confirm Deal & Calculate Commission')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
