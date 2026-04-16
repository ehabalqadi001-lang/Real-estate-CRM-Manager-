'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'

interface DealStatus {
  id: string
  compound: string
  property_type: string
  unit_value: number
  stage: string
  created_at: string
  developer?: string
}

const STAGES = [
  { key: 'EOI',          label: 'اهتمام أولي',    icon: FileText,    color: 'bg-slate-100 text-slate-600' },
  { key: 'Reservation',  label: 'حجز',            icon: Clock,       color: 'bg-yellow-100 text-yellow-700' },
  { key: 'Contracted',   label: 'تعاقد',           icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  { key: 'Registration', label: 'شهر عقاري',       icon: FileText,    color: 'bg-purple-100 text-purple-700' },
  { key: 'Handover',     label: 'تسليم الوحدة',    icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
]

export default function ClientPortalPage() {
  const [phone, setPhone] = useState('')
  const [deals, setDeals] = useState<DealStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    setSearched(false)

    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('deals')
        .select('id, compound, property_type, unit_value, stage, created_at, developer')
        .eq('buyer_phone', phone.trim())
        .order('created_at', { ascending: false })

      if (err) throw err
      setDeals(data || [])
      setSearched(true)
    } catch {
      setError('حدث خطأ أثناء البحث. تأكد من رقم الهاتف وحاول مجدداً.')
    } finally {
      setLoading(false)
    }
  }

  const getStageIndex = (stage: string) => STAGES.findIndex(s => s.key === stage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex flex-col items-center justify-start p-6 pt-16" dir="rtl">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-white italic">FAST <span className="text-yellow-400">INVESTMENT</span></h1>
        <p className="text-slate-400 text-sm mt-1">بوابة تتبع الصفقات للعملاء</p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-800 mb-2">تتبع صفقتك العقارية</h2>
        <p className="text-sm text-slate-500 mb-6">أدخل رقم هاتفك المسجل لعرض حالة صفقتك</p>

        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="مثال: 01012345678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            dir="ltr"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !phone.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {loading ? <span className="animate-spin">⟳</span> : <Search size={16} />}
            بحث
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      {/* Results */}
      {searched && (
        <div className="w-full max-w-2xl mt-6 space-y-4">
          {deals.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-xl">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-600 font-semibold">لم يتم العثور على صفقات مرتبطة بهذا الرقم</p>
              <p className="text-slate-400 text-sm mt-1">تأكد من الرقم أو تواصل مع فريق المبيعات</p>
            </div>
          ) : (
            deals.map(deal => {
              const stageIdx = getStageIndex(deal.stage)
              return (
                <div key={deal.id} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{deal.compound}</h3>
                      <p className="text-sm text-slate-500">{deal.property_type} • {deal.developer ?? 'غير محدد'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-blue-700">{Number(deal.unit_value).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">ج.م</div>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      {STAGES.map((s, i) => {
                        const done = i <= stageIdx
                        const active = i === stageIdx
                        return (
                          <div key={s.key} className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              active ? 'border-blue-500 bg-blue-500 text-white scale-110' :
                              done ? 'border-emerald-500 bg-emerald-500 text-white' :
                              'border-slate-200 bg-slate-100 text-slate-400'
                            }`}>
                              {done ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <span className={`text-xs mt-1 text-center leading-tight ${active ? 'text-blue-600 font-bold' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {s.label}
                            </span>
                            {i < STAGES.length - 1 && (
                              <div className={`h-0.5 w-full mt-4 ${done && i < stageIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                    <span>تاريخ التسجيل: {new Date(deal.created_at).toLocaleDateString('ar-EG')}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${STAGES[stageIdx]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                      {STAGES[stageIdx]?.label ?? deal.stage}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-slate-600 text-xs mt-10">
        للاستفسار: تواصل مع فريق المبيعات على واتساب
      </p>
    </div>
  )
}
