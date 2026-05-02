'use client'

import { useState } from 'react'
import { Plus, X, User, Phone, Mail, Star, Percent } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useI18n } from '@/hooks/use-i18n'

const TIERS = [
  { value: 'bronze',   label: 'برونزي' },
  { value: 'silver',   label: 'فضي' },
  { value: 'gold',     label: 'ذهبي' },
  { value: 'platinum', label: 'بلاتينيوم' },
]

export default function AddBrokerButton() {
  const { dir } = useI18n()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    full_name: '', phone: '', email: '',
    tier: 'bronze', commission_rate: 3, specialties: '',
  })

  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const specialtiesArr = form.specialties
        ? form.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : []
      const { error } = await supabase.from('broker_profiles').insert([{
        full_name:       form.full_name,
        phone:           form.phone || null,
        email:           form.email || null,
        tier:            form.tier,
        commission_rate: form.commission_rate,
        specialties:     specialtiesArr,
        status:          'active',
      }])
      if (error) throw error
      setOpen(false)
      window.location.reload()
    } catch (err: unknown) {
      alert('خطأ: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#00C27C] hover:bg-[#009F64] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#00C27C]/20">
        <Plus size={16} /> إضافة وسيط
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Star size={16} className="text-amber-500" /> إضافة وسيط عقاري
              </h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل *</label>
                <div className="relative">
                  <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="text" value={form.full_name}
                    onChange={e => set('full_name', e.target.value)}
                    placeholder="اسم الوسيط"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                  <div className="relative">
                    <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">مستوى الوسيط</label>
                  <select value={form.tier} onChange={e => set('tier', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نسبة العمولة <span className="text-blue-600">{form.commission_rate}%</span>
                  </label>
                  <div className="relative">
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" min={0.5} max={20} step={0.25}
                      value={form.commission_rate}
                      onChange={e => set('commission_rate', parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">التخصصات (مفصولة بفاصلة)</label>
                <input type="text" value={form.specialties}
                  onChange={e => set('specialties', e.target.value)}
                  placeholder="شقق, فيلات, تجاري, ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#00C27C] hover:bg-[#009F64] text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                {loading ? 'جاري الحفظ...' : 'إضافة الوسيط'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
