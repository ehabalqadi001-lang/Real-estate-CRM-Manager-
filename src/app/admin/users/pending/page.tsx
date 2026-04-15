import { getPendingUsers, updateUserStatus } from './actions'
import { AlertTriangle, CheckCircle, XCircle, FileText, User, Building, Phone, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PendingUser {
  id: string
  full_name: string
  account_type: string
  phone?: string
  region?: string
  company_name?: string
  commercial_reg_no?: string
  id_document_url?: string
  license_document_url?: string
  created_at: string
}

export default async function PendingUsersPage() {
  let pendingUsers: PendingUser[] = []
  let fetchError = null
  let exactErrorDetails = null

  try {
    pendingUsers = await getPendingUsers()
  } catch (e: unknown) {
    fetchError = "حدث خطأ أثناء جلب قائمة الحسابات المعلقة من قاعدة البيانات."
    exactErrorDetails = e instanceof Error ? e.message : "Database connection error"
  }

  // دوال الـ Server Actions المباشرة للأزرار
  const approveUser = async (formData: FormData) => {
    'use server'
    const id = formData.get('userId') as string
    await updateUserStatus(id, 'approved')
  }

  const rejectUser = async (formData: FormData) => {
    'use server'
    const id = formData.get('userId') as string
    await updateUserStatus(id, 'rejected')
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">طلبات الموافقة المعلقة</h1>
          <p className="text-sm text-slate-500 mt-1">مراجعة وثائق التسجيل للشركات والأفراد قبل تفعيل حساباتهم</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm">
          {pendingUsers.length} طلب بانتظار المراجعة
        </div>
      </div>

      {/* صائد الأخطاء الإجباري (Rule 3) */}
      {fetchError ? (
        <div className="bg-white rounded-3xl border-2 border-red-50 p-12 text-center shadow-sm">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-bold text-lg mb-2">{fetchError}</p>
          <code className="block bg-slate-50 p-2 rounded text-xs font-mono text-slate-500" dir="ltr">
            {exactErrorDetails}
          </code>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">لا توجد طلبات معلقة</h2>
          <p className="text-slate-500 mt-2">جميع الحسابات تمت مراجعتها بنجاح.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pendingUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
              
              <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    {user.account_type === 'company' ? <Building className="text-blue-600" size={20}/> : <User className="text-slate-600" size={20}/>}
                    {user.full_name}
                  </h3>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${user.account_type === 'company' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                    {user.account_type === 'company' ? 'شركة وساطة' : 'وكيل فردي'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-400">تاريخ التسجيل</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(user.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6 flex-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={16} className="text-slate-400" /> {user.phone || 'غير مسجل'}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={16} className="text-slate-400" /> {user.region || 'غير مسجل'}
                </div>
                {user.account_type === 'company' && (
                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold mb-1">بيانات الشركة:</p>
                    <p className="font-bold text-slate-800">{user.company_name} <span className="text-xs text-slate-500 font-normal ml-2">(س.ت: {user.commercial_reg_no})</span></p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase">الوثائق المرفوعة:</p>
                {user.id_document_url && (
                  <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${user.id_document_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 p-2 rounded-lg">
                    <FileText size={16} /> عرض بطاقة الهوية / الجواز
                  </a>
                )}
                {user.license_document_url && (
                  <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${user.license_document_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 p-2 rounded-lg">
                    <FileText size={16} /> عرض السجل التجاري / الرخصة
                  </a>
                )}
              </div>

              {/* أزرار اتخاذ القرار (Forms with Server Actions) */}
              <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100">
                <form action={approveUser}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-colors">
                    <CheckCircle size={18} /> تفعيل الحساب
                  </button>
                </form>
                <form action={rejectUser}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold transition-colors border border-red-200">
                    <XCircle size={18} /> رفض الطلب
                  </button>
                </form>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}