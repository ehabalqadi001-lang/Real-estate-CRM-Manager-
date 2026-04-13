'use client'

import { useState } from 'react'
import { loginAction, registerAction } from './actions'
import { AlertTriangle, Briefcase, User, Mail, Lock, Building } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [accountType, setAccountType] = useState('individual') // individual | company
  const [loading, setLoading] = useState(false)
  
  // حالة صائد الأخطاء
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

      // إذا رجع بنتيجة (يعني هناك خطأ، لأن النجاح يقوم بعمل Redirect)
      if (result && !result.success) {
        setErrorState({ message: result.message, details: result.details })
      }
    } catch (err: any) {
      setErrorState({ message: "خطأ في الاتصال بالخادم", details: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full">
        
        {/* اللوجو */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-wider">FAST INVESTMENT</h1>
          <p className="text-sm font-bold text-blue-600 tracking-widest uppercase mt-1">Enterprise CRM</p>
        </div>

        {/* صائد الأخطاء القياسي */}
        {errorState && (
          <div className="mb-6 bg-white rounded-2xl border-2 border-red-50 p-6 text-center shadow-sm animate-in fade-in slide-in-from-top-4">
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
          {/* أزرار التبديل (دخول / تسجيل) */}
          <div className="flex border-b border-slate-100">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setErrorState(null); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              تسجيل الدخول
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setErrorState(null); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            
            {/* خيارات إنشاء الحساب (فقط في حالة التسجيل) */}
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
                {/* حقل إرسال نوع الحساب مع الفورم */}
                <input type="hidden" name="accountType" value={accountType} />
              </div>
            )}

            {/* الحقول الإضافية للتسجيل */}
            {!isLogin && (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل (الرباعي)</label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 text-slate-400" size={18} />
                    <input name="fullName" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium" />
                  </div>
                </div>

                {accountType === 'company' && (
                  <div className="animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة (الرسمي)</label>
                    <div className="relative">
                      <Building className="absolute right-3 top-3 text-slate-400" size={18} />
                      <input name="companyName" required className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* الحقول الأساسية (إيميل وباسورد) - تظهر دائماً */}
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

            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 disabled:bg-slate-400 mt-2">
              {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'تأكيد وإنشاء الحساب')}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}