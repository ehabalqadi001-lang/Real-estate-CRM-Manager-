import { Clock, ShieldAlert, LogOut } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center" dir="rtl">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 animate-pulse">
          <Clock size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">طلبك قيد المراجعة</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          شكراً لتسجيلك في منصة FAST INVESTMENT. 
          يتم الآن مراجعة بياناتك ووثائقك من قبل فريق الإدارة. ستصلك رسالة تأكيد فور تفعيل حسابك.
        </p>
        <div className="flex flex-col gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-400 border border-slate-100 flex items-center gap-2">
            <ShieldAlert size={16} /> مدة المراجعة المتوقعة: 24-48 ساعة عمل.
          </div>
          {/* زر تسجيل الخروج للعودة لاحقاً */}
          <button className="mt-4 text-red-500 font-bold text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  )
}