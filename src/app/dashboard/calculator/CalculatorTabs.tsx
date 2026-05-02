'use client'

import { useState } from 'react'

// ─── Mortgage Calculator ───────────────────────────────────────────────────
function MortgageCalc() {
  const [price, setPrice]       = useState(2_000_000)
  const [down, setDown]         = useState(20)
  const [rate, setRate]         = useState(12)
  const [years, setYears]       = useState(10)

  const principal = price * (1 - down / 100)
  const monthly   = rate / 100 / 12
  const n         = years * 12
  const payment   = monthly === 0
    ? principal / n
    : (principal * monthly * Math.pow(1 + monthly, n)) / (Math.pow(1 + monthly, n) - 1)
  const total     = payment * n
  const interest  = total - principal

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[
          { label: 'سعر العقار (ج.م)', value: price, set: setPrice, min: 100_000, max: 50_000_000, step: 50_000 },
          { label: 'نسبة المقدم (%)', value: down, set: setDown, min: 0, max: 60, step: 1 },
          { label: 'نسبة الفائدة السنوية (%)', value: rate, set: setRate, min: 1, max: 30, step: 0.5 },
          { label: 'مدة التمويل (سنوات)', value: years, set: setYears, min: 1, max: 30, step: 1 },
        ].map(f => (
          <div key={f.label}>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-slate-700">{f.label}</label>
              <span className="text-sm font-black text-blue-700">{f.value.toLocaleString()}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
              onChange={e => f.set(Number(e.target.value))}
              className="w-full accent-blue-600" />
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold opacity-80">نتائج التمويل</h3>
        {[
          { label: 'مبلغ التمويل', value: principal.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م' },
          { label: 'القسط الشهري', value: payment.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م', big: true },
          { label: 'إجمالي الفوائد', value: interest.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م' },
          { label: 'إجمالي المدفوعات', value: total.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م' },
        ].map(r => (
          <div key={r.label} className={`flex justify-between ${r.big ? 'bg-white/15 rounded-xl p-3' : ''}`}>
            <span className="opacity-80 text-sm">{r.label}</span>
            <span className={`font-black ${r.big ? 'text-xl text-yellow-300' : ''}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Payment Plan Calculator ───────────────────────────────────────────────
function PaymentPlanCalc() {
  const [unitPrice, setUnitPrice]   = useState(3_000_000)
  const [downPct, setDownPct]       = useState(10)
  const [installments, setInst]     = useState(8)
  const [deliveryPct, setDel]       = useState(10)
  const [maintenancePct, setMaint]  = useState(8)

  const down         = unitPrice * (downPct / 100)
  const delivery     = unitPrice * (deliveryPct / 100)
  const maintenance  = unitPrice * (maintenancePct / 100)
  const remaining    = unitPrice - down - delivery - maintenance
  const perInst      = remaining > 0 ? remaining / installments : 0

  const schedule = Array.from({ length: installments }, (_, i) => ({
    num: i + 1,
    amount: perInst,
    label: `القسط ${i + 1}`,
  }))

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[
          { label: 'سعر الوحدة (ج.م)', value: unitPrice, set: setUnitPrice, min: 500_000, max: 20_000_000, step: 100_000 },
          { label: 'نسبة المقدم (%)', value: downPct, set: setDownPct, min: 5, max: 50, step: 1 },
          { label: 'عدد الأقساط', value: installments, set: setInst, min: 2, max: 48, step: 1 },
          { label: 'نسبة التسليم (%)', value: deliveryPct, set: setDel, min: 0, max: 30, step: 1 },
          { label: 'نسبة صيانة (%)', value: maintenancePct, set: setMaint, min: 0, max: 15, step: 0.5 },
        ].map(f => (
          <div key={f.label}>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-slate-700">{f.label}</label>
              <span className="text-sm font-black text-emerald-700">{f.value.toLocaleString()}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
              onChange={e => f.set(Number(e.target.value))}
              className="w-full accent-emerald-600" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 grid grid-cols-1 xs:grid-cols-2 gap-3">
          {[
            { label: 'المقدم', value: down },
            { label: 'قسط التسليم', value: delivery },
            { label: 'رسوم الصيانة', value: maintenance },
            { label: 'قيمة القسط', value: perInst },
          ].map(r => (
            <div key={r.label} className="text-center">
              <div className="text-xs text-slate-500 font-medium">{r.label}</div>
              <div className="text-base font-black text-emerald-800">{r.value.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</div>
              <div className="text-xs text-slate-400">ج.م</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-2 text-right text-slate-500">القسط</th>
                <th className="p-2 text-right text-slate-500">المبلغ (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(s => (
                <tr key={s.num} className="border-t border-slate-100">
                  <td className="p-2 text-slate-700 font-medium">{s.label}</td>
                  <td className="p-2 font-bold text-emerald-700">{s.amount.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── ROI / IRR Calculator ──────────────────────────────────────────────────
function ROICalc() {
  const [purchase, setPurchase]   = useState(2_000_000)
  const [rental, setRental]       = useState(8_000)
  const [appreciation, setApp]    = useState(10)
  const [holdYears, setHold]      = useState(5)
  const [expenses, setExp]        = useState(5)

  const annualRent      = rental * 12 * (1 - expenses / 100)
  const futureValue     = purchase * Math.pow(1 + appreciation / 100, holdYears)
  const capitalGain     = futureValue - purchase
  const totalReturn     = annualRent * holdYears + capitalGain
  const roi             = (totalReturn / purchase) * 100
  const annualizedROI   = (Math.pow(1 + roi / 100, 1 / holdYears) - 1) * 100
  const grossYield      = ((rental * 12) / purchase) * 100
  const netYield        = (annualRent / purchase) * 100

  // IRR approximation (Newton-Raphson, simplified)
  const cashFlows = [-purchase, ...Array(holdYears - 1).fill(annualRent), annualRent + futureValue]
  let irr = 0.1
  for (let iter = 0; iter < 100; iter++) {
    const npv = cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + irr, t), 0)
    const dnpv = cashFlows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + irr, t + 1), 0)
    if (Math.abs(dnpv) < 1e-10) break
    irr -= npv / dnpv
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[
          { label: 'سعر الشراء (ج.م)', value: purchase, set: setPurchase, min: 200_000, max: 20_000_000, step: 100_000 },
          { label: 'الإيجار الشهري (ج.م)', value: rental, set: setRental, min: 0, max: 100_000, step: 500 },
          { label: 'معدل ارتفاع القيمة السنوي (%)', value: appreciation, set: setApp, min: 0, max: 30, step: 0.5 },
          { label: 'سنوات الاحتفاظ', value: holdYears, set: setHold, min: 1, max: 20, step: 1 },
          { label: 'مصاريف التشغيل السنوية (%)', value: expenses, set: setExp, min: 0, max: 30, step: 1 },
        ].map(f => (
          <div key={f.label}>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-semibold text-slate-700">{f.label}</label>
              <span className="text-sm font-black text-purple-700">{f.value.toLocaleString()}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
              onChange={e => f.set(Number(e.target.value))}
              className="w-full accent-purple-600" />
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-br from-purple-700 to-indigo-900 text-white rounded-2xl p-4 sm:p-6 space-y-3">
        <h3 className="text-lg font-bold opacity-80">تحليل العائد</h3>
        {[
          { label: 'العائد الإجمالي على الاستثمار', value: roi.toFixed(1) + '%', big: true },
          { label: 'المعدل الداخلي للعائد (IRR)', value: (irr * 100).toFixed(1) + '%', big: true },
          { label: 'العائد السنوي المركب', value: annualizedROI.toFixed(1) + '%' },
          { label: 'العائد الإيجاري الإجمالي', value: grossYield.toFixed(1) + '%' },
          { label: 'العائد الإيجاري الصافي', value: netYield.toFixed(1) + '%' },
          { label: 'مكاسب رأس المال', value: capitalGain.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م' },
          { label: 'القيمة المتوقعة بعد ' + holdYears + ' سنوات', value: futureValue.toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م' },
        ].map(r => (
          <div key={r.label} className={`flex justify-between ${r.big ? 'bg-white/15 rounded-xl p-3' : ''}`}>
            <span className="opacity-70 text-xs">{r.label}</span>
            <span className={`font-black ${r.big ? 'text-lg text-yellow-300' : 'text-sm'}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tabs Shell ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'mortgage',  label: 'حاسبة القسط الشهري' },
  { id: 'plan',      label: 'خطة السداد' },
  { id: 'roi',       label: 'العائد على الاستثمار (ROI/IRR)' },
]

export default function CalculatorTabs() {
  const [active, setActive] = useState('mortgage')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
              active === t.id
                ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {active === 'mortgage' && <MortgageCalc />}
        {active === 'plan'     && <PaymentPlanCalc />}
        {active === 'roi'      && <ROICalc />}
      </div>
    </div>
  )
}
