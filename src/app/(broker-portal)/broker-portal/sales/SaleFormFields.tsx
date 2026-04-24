'use client'

import { useState, useMemo } from 'react'

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
  exception: Exception | null  // this broker's pre-loaded exceptions keyed by dev+proj
  allExceptions: Exception[]
}

export function SaleFormFields({ developers, projects, rates, allExceptions }: Props) {
  const [developerId, setDeveloperId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [dealValue, setDealValue] = useState(0)

  const filteredProjects = useMemo(
    () => (developerId ? projects.filter((p) => p.developer_id === developerId) : []),
    [developerId, projects],
  )

  // Commission lookup: exception (project-specific) > exception (dev-wide) > rate (project) > rate (dev) > defaults
  const commission = useMemo(() => {
    if (!developerId) return null

    // 1. Partner exception — project-specific
    let ex = allExceptions.find(
      (e) => e.developer_id === developerId && e.project_id === projectId && projectId !== '',
    )
    // 2. Partner exception — developer-wide
    if (!ex) ex = allExceptions.find((e) => e.developer_id === developerId && !e.project_id)

    if (ex) {
      return { devRate: ex.developer_commission_rate, brokerRate: ex.broker_commission_rate, source: 'exception' as const }
    }

    // 3. Standard rate — project-specific
    let rate = rates.find((r) => r.developer_id === developerId && r.project_id === projectId && projectId !== '')
    // 4. Standard rate — developer-wide
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

  return (
    <>
      {/* Developer select */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-black text-gray-700 dark:text-gray-300">المطور</span>
        <select
          name="developerId"
          required
          value={developerId}
          onChange={(e) => { setDeveloperId(e.target.value); setProjectId('') }}
          className="field"
        >
          <option value="">اختر المطور…</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name_ar ?? d.name}{d.region && d.region !== 'متعدد المناطق' ? ` — ${d.region}` : ''}
            </option>
          ))}
        </select>
      </label>

      {/* Project select — filtered by developer */}
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

      {/* Hidden name fields for backward compatibility with the action */}
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

      {/* Deal value — needs to update preview */}
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
    </>
  )
}
