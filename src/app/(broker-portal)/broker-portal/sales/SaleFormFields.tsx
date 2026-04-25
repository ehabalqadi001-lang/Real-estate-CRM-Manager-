'use client'

import { useState, useMemo } from 'react'
import { UploadCloud, CheckCircle, FileText } from 'lucide-react'

type Developer = { id: string; name: string; name_ar: string | null; region: string | null }
type Project = { id: string; name: string; developer_id: string }
type CommissionRate = {
  developer_id: string | null
  project_id: string | null
  rate_percentage: number
  agent_share_percentage: number
}
type Exception = {
  developer_id: string
  project_id: string | null
  developer_commission_rate: number
  broker_commission_rate: number
}

interface Props {
  developers: Developer[]
  projects: Project[]
  rates: CommissionRate[]
  exception: Exception | null
  allExceptions: Exception[]
}

type DocSlot = { name: string; label: string; required: boolean }

const STAGE_DOC_SLOTS: Record<string, DocSlot[]> = {
  eoi: [
    { name: 'doc_eoi_form', label: 'استمارة EOI', required: true },
  ],
  reservation: [
    { name: 'doc_reservation_form', label: 'استمارة الحجز', required: true },
    { name: 'doc_client_id', label: 'بطاقة العميل / جواز السفر / الإقامة', required: true },
    { name: 'doc_payment_agreement', label: 'نظام السداد المتفق عليه', required: false },
  ],
  contract: [
    { name: 'doc_contract_p1', label: 'الصفحة الأولى من العقد', required: true },
    { name: 'doc_contract_p2', label: 'الصفحة الثانية من العقد', required: true },
    { name: 'doc_contract_p3', label: 'الصفحة الثالثة من العقد', required: false },
    { name: 'doc_payment_plan', label: 'Payment Plan', required: true },
    { name: 'doc_layout', label: 'Layout', required: true },
    { name: 'doc_master_plan', label: 'Master Plan', required: false },
  ],
}

const STAGE_LABELS: Record<string, string> = {
  eoi: 'EOI',
  reservation: 'Reservation',
  contract: 'Contract',
}

export function SaleFormFields({ developers, projects, rates, allExceptions }: Props) {
  const [region, setRegion] = useState('')
  const [devSearch, setDevSearch] = useState('')
  const [developerId, setDeveloperId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [dealValue, setDealValue] = useState(0)
  const [stage, setStage] = useState('eoi')
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({})

  const regions = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const d of developers) {
      if (d.region && !seen.has(d.region)) {
        seen.add(d.region)
        result.push(d.region)
      }
    }
    return result.sort()
  }, [developers])

  const visibleDevelopers = useMemo(() => {
    let list = developers
    if (region) list = list.filter((d) => d.region === region)
    if (devSearch.trim()) {
      const q = devSearch.trim().toLowerCase()
      list = list.filter((d) => (d.name_ar ?? d.name).toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
    }
    return list
  }, [developers, region, devSearch])

  const filteredProjects = useMemo(
    () => (developerId ? projects.filter((p) => p.developer_id === developerId) : []),
    [developerId, projects],
  )

  const commission = useMemo(() => {
    if (!developerId) return null

    let ex = allExceptions.find(
      (e) => e.developer_id === developerId && e.project_id === projectId && projectId !== '',
    )
    if (!ex) ex = allExceptions.find((e) => e.developer_id === developerId && !e.project_id)

    if (ex) {
      return { devRate: ex.developer_commission_rate, brokerRate: ex.broker_commission_rate, source: 'exception' as const }
    }

    let rate = rates.find((r) => r.developer_id === developerId && r.project_id === projectId && projectId !== '')
    if (!rate) rate = rates.find((r) => r.developer_id === developerId && !r.project_id)

    if (rate) {
      const brokerShare = rate.agent_share_percentage / 100
      const brokerRate = +(rate.rate_percentage * brokerShare).toFixed(2)
      return { devRate: rate.rate_percentage, brokerRate, source: 'standard' as const }
    }

    return null
  }, [developerId, projectId, rates, allExceptions])

  const grossCommission = dealValue && commission ? Math.round(dealValue * (commission.devRate / 100)) : 0
  const brokerCommission = dealValue && commission ? Math.round(dealValue * (commission.brokerRate / 100)) : 0

  const docSlots = STAGE_DOC_SLOTS[stage] ?? []

  return (
    <>
      {/* Stage selector */}
      <div className="col-span-2">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">مرحلة التعاقد</span>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(STAGE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setStage(value); setSelectedFiles({}) }}
              className={`py-2.5 rounded-lg border text-sm font-black transition-all ${
                stage === value
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="stage" value={stage} />
      </div>

      {/* Region filter */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">المنطقة</span>
        <select
          value={region}
          onChange={(e) => { setRegion(e.target.value); setDeveloperId(''); setProjectId(''); setDevSearch('') }}
          className="field"
        >
          <option value="">كل المناطق</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      {/* Developer search + select */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">المطور</span>
        <input
          type="search"
          placeholder="ابحث عن مطور…"
          value={devSearch}
          onChange={(e) => { setDevSearch(e.target.value); setDeveloperId(''); setProjectId('') }}
          className="field mb-1.5"
        />
        <select
          name="developerId"
          required
          value={developerId}
          onChange={(e) => { setDeveloperId(e.target.value); setProjectId('') }}
          className="field"
          size={visibleDevelopers.length > 0 && (region || devSearch) ? Math.min(visibleDevelopers.length + 1, 6) : 1}
        >
          <option value="">اختر المطور…</option>
          {visibleDevelopers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name_ar ?? d.name}{d.region && d.region !== 'متعدد المناطق' ? ` — ${d.region}` : ''}
            </option>
          ))}
        </select>
        {(region || devSearch) && visibleDevelopers.length === 0 && (
          <p className="mt-1 text-xs font-semibold text-red-500">لا يوجد مطور مطابق</p>
        )}
      </label>

      {/* Project select */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">المشروع</span>
        <select
          name="projectId"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={!developerId || filteredProjects.length === 0}
          className="field disabled:opacity-50"
        >
          <option value="">{developerId && filteredProjects.length === 0 ? 'لا توجد مشاريع لهذا المطور' : 'اختر المشروع…'}</option>
          {filteredProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {/* Hidden name fields */}
      <input type="hidden" name="projectName" value={filteredProjects.find((p) => p.id === projectId)?.name ?? ''} />
      <input type="hidden" name="developerName" value={developers.find((d) => d.id === developerId)?.name_ar ?? developers.find((d) => d.id === developerId)?.name ?? ''} />

      {/* Commission preview */}
      {commission && developerId && (
        <div className={`col-span-2 rounded-xl border p-3 text-xs font-semibold ${
          commission.source === 'exception'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>
          <p className="mb-1 font-black">
            {commission.source === 'exception' ? '⭐ عمولة استثنائية خاصة بك' : '📋 عمولة قياسية'}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span>عمولة المطور: <strong>{commission.devRate}%</strong></span>
            <span>نصيبك: <strong>{commission.brokerRate}%</strong></span>
            {dealValue > 0 && (
              <>
                <span>إجمالي العمولة: <strong>{grossCommission.toLocaleString('ar-EG')} ج.م</strong></span>
                <span>عمولتك: <strong>{brokerCommission.toLocaleString('ar-EG')} ج.م</strong></span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Deal value */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">قيمة البيع</span>
        <input
          name="dealValue"
          required
          type="number"
          min={0}
          className="field text-left"
          dir="ltr"
          onChange={(e) => setDealValue(Number(e.target.value))}
        />
      </label>

      {/* Developer sales person */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">اسم سيلز المطور</span>
        <input name="developerSalesName" className="field" placeholder="اختياري" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">رقم التواصل مع سيلز المطور</span>
        <input name="developerSalesPhone" className="field text-left" dir="ltr" placeholder="اختياري" />
      </label>

      {/* Document upload slots */}
      <div className="col-span-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-4 space-y-3">
        <p className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          مستندات مرحلة {STAGE_LABELS[stage]}
          <span className="text-gray-400 font-normal">— {docSlots.filter(s => s.required).length} مطلوب{docSlots.some(s => !s.required) ? ` + ${docSlots.filter(s => !s.required).length} اختياري` : ''}</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {docSlots.map((slot) => {
            const fileName = selectedFiles[slot.name]
            return (
              <label
                key={slot.name}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  fileName
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                }`}
              >
                <div className="shrink-0">
                  {fileName
                    ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                    : <UploadCloud className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200 truncate leading-tight">
                    {slot.label}
                    {slot.required && <span className="mr-1 text-red-500">*</span>}
                  </p>
                  <p className={`text-[11px] mt-0.5 truncate ${fileName ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {fileName || (slot.required ? 'مطلوب — اضغط للرفع' : 'اختياري')}
                  </p>
                </div>
                <input
                  type="file"
                  name={slot.name}
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const name = e.target.files?.[0]?.name ?? ''
                    setSelectedFiles(prev => ({ ...prev, [slot.name]: name }))
                  }}
                />
              </label>
            )
          })}
        </div>
      </div>
    </>
  )
}
