import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Payment Terms | FAST INVESTMENT',
}

export default function PaymentTermsPage() {
  return (
    <main className="min-h-screen bg-[#F7FBF8] px-4 py-8 text-[#102033]">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-[#DDE6E4] bg-white shadow-sm">
        <header className="border-b border-[#DDE6E4] bg-[#27AE60] px-4 sm:px-6 py-8 text-white md:px-10">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-white/15">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em]">FAST INVESTMENT</p>
              <h1 className="mt-2 text-2xl font-black leading-10 md:text-4xl">Electronic Payment Terms and Conditions</h1>
            </div>
          </div>
        </header>

        <article className="space-y-7 px-4 sm:px-6 py-8 text-lg font-semibold leading-9 md:px-10">
          <p>
            This page explains the terms related to electronic payments and marketplace points purchases on the FAST INVESTMENT platform.
          </p>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">1. Accepted payment methods</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Bank cards and mobile wallets are processed through Paymob in Egyptian Pounds (EGP).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">2. Delivery policy</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Points are credited after the payment is confirmed and the signed webhook is processed successfully.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">3. Refund and cancellation policy</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>A refund request can be reviewed if the purchased points were not used.</li>
              <li>Used points or partially consumed packages are not eligible for automatic refund.</li>
              <li>Approved refunds are returned to the original payment method.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">4. Security</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>The platform does not store card data. Payments are encrypted and processed by Paymob.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#27AE60]">5. Support</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>For payment issues, contact the platform support team through the internal support channels.</li>
            </ul>
          </section>

          <Link
            href="/marketplace/buy-points"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#27AE60] px-5 text-sm font-black text-white transition hover:bg-[#1F8E4F]"
          >
            Back to Buy Points
          </Link>
        </article>
      </section>
    </main>
  )
}
