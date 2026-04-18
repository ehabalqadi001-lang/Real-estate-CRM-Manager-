import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'شروط وأحكام الدفع الإلكتروني | FAST INVESTMENT',
}

export default function PaymentTermsPage() {
  return (
    <main className="min-h-screen bg-[#F7FBF8] px-4 py-8 text-[#102033]" dir="rtl">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <header className="border-b border-[#DDE6E4] bg-[#27AE60] px-6 py-8 text-white md:px-10">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-white/15">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em]">FAST INVESTMENT</p>
              <h1 className="mt-2 text-2xl font-black leading-10 md:text-4xl">
                شروط وأحكام الدفع الإلكتروني - منصة FAST INVESTMENT
              </h1>
            </div>
          </div>
        </header>

        <article className="space-y-7 px-6 py-8 text-lg font-semibold leading-9 md:px-10">
          <p>
            مرحباً بك في FAST INVESTMENT. توضح هذه الصفحة الشروط والأحكام المتعلقة بعمليات الدفع الإلكتروني وشراء باقات الإعلانات (النقاط).
          </p>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">1. وسائل الدفع المقبولة</h2>
            <ul className="mt-3 list-disc space-y-2 pr-6">
              <li>البطاقات البنكية والمحافظ الإلكترونية بالتعاون مع Paymob بالجنيه المصري.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">2. سياسة التسليم</h2>
            <ul className="mt-3 list-disc space-y-2 pr-6">
              <li>تسليم باقات النقاط يتم بشكل فوري وآلي بعد تأكيد الدفع.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">3. سياسة الاسترجاع والإلغاء</h2>
            <ul className="mt-3 list-disc space-y-2 pr-6">
              <li>يحق للعميل طلب استرداد المبلغ خلال 14 يوماً بشرط عدم استخدام أي نقطة.</li>
              <li>الباقات المستخدمة (جزئياً أو كلياً) غير قابلة للاسترداد.</li>
              <li>يتم رد المبلغ لنفس وسيلة الدفع خلال 7-14 يوم عمل.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">4. الأمان</h2>
            <ul className="mt-3 list-disc space-y-2 pr-6">
              <li>المنصة لا تخزن بيانات البطاقات، جميع العمليات مشفرة عبر Paymob.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">5. الدعم الفني</h2>
            <ul className="mt-3 list-disc space-y-2 pr-6">
              <li>للتواصل (رقم/واتساب: 01101160208) أو عبر الشات الداخلي.</li>
            </ul>
          </section>

          <Link
            href="/marketplace/buy-points"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#27AE60] px-5 text-sm font-black text-white transition hover:bg-[#1F8E4F]"
          >
            العودة إلى شراء النقاط
          </Link>
        </article>
      </section>
    </main>
  )
}
