import { Clock, LogOut, ShieldAlert } from 'lucide-react'

export default function PendingPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#EEF6F5_0%,#F7FAF8_45%,#FFFFFF_100%)] p-4 text-center"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-3xl border border-[var(--fi-line)] bg-white p-4 sm:p-8 shadow-xl sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <Clock size={40} />
        </div>

        <h2 className="mb-4 text-2xl font-black text-[var(--fi-ink)]">طلبك قيد المراجعة الإدارية</h2>
        <p className="mb-8 text-sm leading-relaxed text-[var(--fi-muted)]">
          شكرا لتسجيلك في FAST INVESTMENT. يتم الآن فحص وثائقك بدقة للتأكد من هويتك وصحة بياناتك.
          ستصلك رسالة إشعار فور تفعيل حسابك.
        </p>

        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)] p-4 text-xs font-semibold text-[var(--fi-muted)]">
          <ShieldAlert size={16} />
          مدة المراجعة المتوقعة: خلال 24 ساعة عمل.
        </div>

        <form action="/auth/logout" method="post">
          <button className="mx-auto flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:underline">
            <LogOut size={16} />
            تسجيل الخروج والعودة لاحقا
          </button>
        </form>
      </div>
    </main>
  )
}
