'use client'

import { useState } from 'react'
import { loginAction, registerAction } from './actions'
import { AlertTriangle, Briefcase, User, Mail, Lock, Building, Phone, MapPin, Upload, FileText } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [accountType, setAccountType] = useState('individual')
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{message: string, details: string} | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorState(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      let result;
      if (isLogin) {
        result = await loginAction(formData)
      } else {
        result = await registerAction(formData)
      }

      if (result && !result.success) {
        setErrorState({ message: result.message, details: result.details })
        setLoading(false) // إيقاف التحميل فقط إذا كان هناك خطأ حقيقي
      }
    } catch (err: any) {
      // الحل الجذري لمشكلة NEXT_REDIRECT:
      // إذا كان الخطأ هو عملية توجيه شرعية من Next.js، اتركه يمر ولا تعتبره خطأ
      if (err.message === 'NEXT_REDIRECT' || err.digest?.startsWith('NEXT_REDIRECT')) {
        throw err; 
      }
      
      // أما إذا كان خطأ حقيقي في الاتصال، اصطده واعرضه
      setErrorState({ message: "خطأ في الاتصال بالخادم", details: err.message })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12" dir="rtl">
      <div className="max-w-xl w-full">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-wider">FAST INVESTMENT</h1>
          <p className="text-sm font-bold text-blue-600 tracking-widest uppercase mt-1">Enterprise CRM</p>
        </div>

        {errorState && (
          <div className="mb-6 bg-white rounded-2xl border-2 border-red-50 p-6 text-center shadow-sm animate-in fade-in">
            <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <p className="text-red-600 font-bold text-sm mb-2">{errorState.message}</p>
            <code className="block bg-slate-50 p-2 rounded text-[10px] font-mono text-slate-500" dir="ltr">
              {errorState.details}
            </code>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}>تسجيل الدخول</button>
            <button type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}>إنشاء حساب جديد</button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5" encType="multipart/form-data">
            
            {!isLogin && (
              <div className="space-y-4 mb-6 animate-in fade-in">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-center">نوع الحساب المطلوب</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setAccountType('individual')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${accountType === 'individual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                    <User size={24} />
                    <span className="text-xs font-bold">وكيل عقاري (فرد)</span>
                  </button>
                  <button type="button" onClick={() => setAccountType('company')} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${accountType === 'company' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                    <Briefcase size={24} />
                    <span className="text-xs font-bold">شركة وساطة</span>
                  </button>
                </div>
                <input type="hidden" name="accountType" value={accountType} />
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل / مسؤول التواصل</label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input name="fullName" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input name="phone" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium text-left" dir="ltr" placeholder="01X XXXX XXXX" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المنطقة / المحافظة</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input name="region" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium" />
                  </div>
                </div>

                {accountType === 'company' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة (الرسمي)</label>
                      <div className="relative">
                        <Building className="absolute right-3 top-3 text-slate-400" size={18} />
                        <input name="companyName" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رقم السجل التجاري</label>
                      <div className="relative">
                        <FileText className="absolute right-3 top-3 text-slate-400" size={18} />
                        <input name="commercialRegNo" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium text-left" dir="ltr" />
                      </div>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-3 uppercase text-center">الوثائق المطلوبة للمراجعة</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50">
                      <input type="file" name="idDocument" accept="image/*,.pdf" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-700">رفع بطاقة الهوية</p>
                      <p className="text-[10px] text-slate-500 mt-1">(للفرد أو لمسؤول الشركة)</p>
                    </div>

                    {accountType === 'company' && (
                      <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50">
                        <input type="file" name="licenseDocument" accept="image/*,.pdf" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <FileText className="mx-auto text-slate-400 mb-2" size={24} />
                        <p className="text-xs font-bold text-slate-700">رفع السجل التجاري</p>
                        <p className="text-[10px] text-slate-500 mt-1">(أو رخصة المزاولة)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input name="email" type="email" required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium text-left" dir="ltr" placeholder="admin@fast-investment.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input name="password" type="password" required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium text-left" dir="ltr" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 disabled:bg-slate-400 mt-4">
              {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'تأكيد وإنشاء الحساب')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}