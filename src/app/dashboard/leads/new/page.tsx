import { redirect } from 'next/navigation'
import { ArrowRight, Building2, DollarSign, Mail, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { addLead } from '../actions'
import SubmitLeadButton from './SubmitLeadButton'
import { NewLeadForm } from './NewLeadForm'

async function createLeadAction(formData: FormData) {
  'use server'

  const result = await addLead(formData)

  if (result && !result.success) {
    redirect(`/dashboard/leads/new?error=${encodeURIComponent(result.error ?? 'تعذر إضافة العميل')}`)
  }

  redirect('/dashboard/leads')
}

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function NewLeadPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/dashboard/leads" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
          <ArrowRight size={16} /> العودة للعملاء المحتملين
        </Link>

        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-950">إضافة عميل محتمل</h1>
            <p className="mt-1 text-sm text-slate-500">سجل بيانات العميل ليظهر داخل مسار المبيعات الخاص بك.</p>
          </div>

          {params.error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {params.error}
            </div>
          )}

          <NewLeadForm action={createLeadAction}>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                <User size={16} /> اسم العميل
              </label>
              <input
                name="clientName"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="مثال: أحمد محمود"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Phone size={16} /> رقم الهاتف
                </label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-blue-500"
                  placeholder="010..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Mail size={16} /> البريد الإلكتروني
                </label>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-blue-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Building2 size={16} /> نوع العقار
                </label>
                <select
                  name="propertyType"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 outline-none focus:border-blue-500"
                  defaultValue="سكني"
                >
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="إداري">إداري</option>
                  <option value="طبي">طبي</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <DollarSign size={16} /> القيمة المتوقعة
                </label>
                <input
                  name="expectedValue"
                  type="number"
                  defaultValue={0}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <SubmitLeadButton />
            </div>
          </NewLeadForm>
        </div>
      </div>
    </div>
  )
}
