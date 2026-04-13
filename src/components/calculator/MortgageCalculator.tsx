'use client'

import { useState, useMemo } from 'react'
import { Printer, Percent, Calendar, DollarSign, ArrowDownToLine } from 'lucide-react'

interface PaymentRow {
  paymentNumber: number
  date: string
  paymentAmount: number
  remainingBalance: number
}

export default function MortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState<number>(5000000)
  const [downPaymentPct, setDownPaymentPct] = useState<number>(10)
  const [years, setYears] = useState<number>(7)
  const [interestRate, setInterestRate] = useState<number>(0) // 0 means developer plan (No bank interest)
  const [frequency, setFrequency] = useState<number>(4) // 1: Yearly, 2: Semi, 4: Quarterly, 12: Monthly

  // محرك الحساب المالي (Financial Engine)
  const calcData = useMemo(() => {
    const downPaymentValue = propertyPrice * (downPaymentPct / 100)
    const financedAmount = propertyPrice - downPaymentValue
    const totalPeriods = years * frequency
    let paymentAmount = 0
    let totalInterest = 0

    // حساب القسط
    if (interestRate > 0) {
      // نظام بنكي (فائدة متناقصة - Amortization)
      const periodRate = (interestRate / 100) / frequency
      paymentAmount = (financedAmount * periodRate * Math.pow(1 + periodRate, totalPeriods)) / (Math.pow(1 + periodRate, totalPeriods) - 1)
      totalInterest = (paymentAmount * totalPeriods) - financedAmount
    } else {
      // نظام المطورين العقاريين (بدون فائدة)
      paymentAmount = financedAmount / totalPeriods
      totalInterest = 0
    }

    // توليد جدول السداد
    let balance = financedAmount
    const schedule: PaymentRow[] = []
    const periodRate = (interestRate / 100) / frequency
    
    let currentDate = new Date()

    for (let i = 1; i <= totalPeriods; i++) {
      let interestForPeriod = 0
      if (interestRate > 0) {
        interestForPeriod = balance * periodRate
      }
      const principalForPeriod = paymentAmount - interestForPeriod
      balance -= principalForPeriod

      // إضافة الأشهر حسب دورة الدفع
      currentDate.setMonth(currentDate.getMonth() + (12 / frequency))

      schedule.push({
        paymentNumber: i,
        date: currentDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
        paymentAmount: paymentAmount,
        remainingBalance: balance > 0 ? balance : 0
      })
    }

    return { downPaymentValue, financedAmount, paymentAmount, totalInterest, schedule }
  }, [propertyPrice, downPaymentPct, years, interestRate, frequency])

  // دالة الطباعة (تخفي القوائم أثناء الطباعة)
  const handlePrint = () => {
    window.print()
  }

  // تنسيق العملة
  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(val)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* قسم الإحصائيات العلوية (ملخص العرض) */}
      <div className="bg-slate-950 p-8 text-white grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-bold mb-2">قيمة القسط (دوري)</p>
          <h3 className="text-3xl font-black text-blue-400">{formatCurrency(calcData.paymentAmount)} <span className="text-lg">ج.م</span></h3>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-bold mb-2">المبلغ الممول (المتبقي)</p>
          <h3 className="text-3xl font-black text-white">{formatCurrency(calcData.financedAmount)} <span className="text-lg">ج.م</span></h3>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-bold mb-2">إجمالي الفوائد البنكية</p>
          <h3 className="text-3xl font-black text-emerald-400">{formatCurrency(calcData.totalInterest)} <span className="text-lg">ج.م</span></h3>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* لوحة إدخال البيانات */}
        <div className="xl:col-span-1 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 print:hidden">
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-3 mb-4">محددات الخطة السعرية</h3>
          
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2"><DollarSign size={14}/> إجمالي قيمة العقار</label>
            <input type="number" value={propertyPrice} onChange={(e) => setPropertyPrice(Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
          </div>

          <div>
            <label className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-2"><ArrowDownToLine size={14}/> الدفعة المقدمة (Down Payment)</span>
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formatCurrency(calcData.downPaymentValue)} ج.م</span>
            </label>
            <div className="flex gap-4 items-center">
              <input type="range" min="0" max="100" step="1" value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} className="flex-1" />
              <span className="font-bold w-12 text-center bg-white border rounded-lg py-1">{downPaymentPct}%</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2"><Calendar size={14}/> سنوات التقسيط</label>
            <input type="number" min="1" max="30" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2"><Calendar size={14}/> دورية السداد</label>
            <select value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold bg-white">
              <option value={12}>شهري (Monthly)</option>
              <option value={4}>ربع سنوي (Quarterly)</option>
              <option value={2}>نصف سنوي (Semi-Annually)</option>
              <option value={1}>سنوي (Annually)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2"><Percent size={14}/> نسبة الفائدة السنوية (0 = خطة مطور)</label>
            <input type="number" min="0" max="40" step="0.5" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
          </div>
        </div>

        {/* جدول السداد */}
        <div className="xl:col-span-2 flex flex-col h-[700px]">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h3 className="text-xl font-bold text-slate-900">جدول خطة السداد المقترحة</h3>
               <p className="text-sm text-slate-500 mt-1">تفاصيل الدفعات والأرصدة المتبقية</p>
            </div>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-800 text-slate-800 px-4 py-2 rounded-xl transition-all font-bold text-sm print:hidden shadow-sm">
              <Printer size={16} /> طباعة العرض
            </button>
          </div>

          {/* الجدول (قابل للتمرير) */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-600"># القسط</th>
                    <th className="px-6 py-4 font-bold text-slate-600">تاريخ الاستحقاق (تقريبي)</th>
                    <th className="px-6 py-4 font-bold text-slate-600">قيمة القسط</th>
                    <th className="px-6 py-4 font-bold text-slate-600">الرصيد المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calcData.schedule.map((row) => (
                    <tr key={row.paymentNumber} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.paymentNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{row.date}</td>
                      <td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(row.paymentAmount)}</td>
                      <td className="px-6 py-4 text-slate-500">{formatCurrency(row.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* تنسيقات الطباعة المخفية */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .xl\\:col-span-2, .xl\\:col-span-2 * { visibility: visible; }
          .bg-slate-950, .bg-slate-950 * { visibility: visible; color: black !important; background: white !important; }
          .xl\\:col-span-2 { position: absolute; left: 0; top: 150px; width: 100%; height: auto !important; }
          .bg-slate-950 { position: absolute; left: 0; top: 0; width: 100%; border: 1px solid #ccc; }
          .custom-scrollbar { overflow: visible !important; }
        }
      `}} />
    </div>
  )
}