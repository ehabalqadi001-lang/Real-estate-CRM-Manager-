import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import TeamList from '@/components/team/TeamList'
import AddMemberButton from '@/components/team/AddMemberButton'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  let members: Record<string, unknown>[] = []
  let fetchError = null
  let exactErrorDetails: string | null = null

  try {
    const { data, error } = await supabase.from('team_members').select('*').order('created_at')
    if (error) { exactErrorDetails = error.message; throw error; }
    members = data || []
  } catch (e: unknown) {
    fetchError = "تعذر جلب بيانات فريق العمل.";
    exactErrorDetails = exactErrorDetails || (e instanceof Error ? e.message : 'Unknown error');
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة فريق العمل</h1>
          <p className="text-sm text-slate-500 mt-1">إضافة الموظفين وتوزيع المهام البيعية</p>
        </div>
        <AddMemberButton />
      </div>

      {fetchError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center">
           <p className="text-red-600 font-bold mb-2">تنبيه النظام</p>
           <code className="bg-red-50 text-red-800 px-4 py-2 rounded-lg text-xs font-mono inline-block" dir="ltr">
             Technical Error: {exactErrorDetails}
           </code>
        </div>
      ) : (
        <TeamList members={members} />
      )}
    </div>
  )
}