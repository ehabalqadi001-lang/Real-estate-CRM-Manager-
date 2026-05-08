import { requirePermission } from '@/shared/rbac/require-permission'
import { createRawClient } from '@/lib/supabase/server'
import { Wand2, Clock, FileText, Video } from 'lucide-react'
import { CreativeStudioClient } from './CreativeStudioClient'

export const dynamic = 'force-dynamic'

export default async function CreativeStudioPage() {
  await requirePermission('messages.create')
  const supabase = await createRawClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const companyId = profile?.company_id ?? user!.id

  const { data: recent } = await supabase
    .from('creative_assets')
    .select('id, asset_type, title, output_text, provider, created_at, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10)

  const assets = recent ?? []
  const copyCount  = assets.filter((a) => a.asset_type !== 'video').length
  const videoCount = assets.filter((a) => a.asset_type === 'video').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[#0F8F83]">NEXUS Creative</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[#102033] dark:text-white">AI Creative Studio</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            توليد إعلانات، منشورات، بريد إلكتروني، وفيديوهات HeyGen من وصف العقار في ثوانٍ.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-[#DDE6E4] bg-white px-4 py-3 text-center shadow-sm dark:bg-slate-900">
            <p className="text-2xl font-black text-[#0F8F83]">{copyCount}</p>
            <p className="text-xs font-semibold text-slate-500">نص مولّد</p>
          </div>
          <div className="rounded-xl border border-[#DDE6E4] bg-white px-4 py-3 text-center shadow-sm dark:bg-slate-900">
            <p className="text-2xl font-black text-[#C9964A]">{videoCount}</p>
            <p className="text-xs font-semibold text-slate-500">فيديو</p>
          </div>
        </div>
      </div>

      <CreativeStudioClient />

      {/* Recent Assets */}
      {assets.length > 0 && (
        <div className="rounded-2xl border border-[#DDE6E4] bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-4 text-slate-400" />
            <p className="font-black text-[#102033] dark:text-white">الأصول المولّدة مؤخراً</p>
          </div>
          <div className="space-y-3">
            {assets.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-[#DDE6E4] p-3">
                <div className={`mt-0.5 rounded-lg p-1.5 ${a.asset_type === 'video' ? 'bg-[#C9964A]/10 text-[#C9964A]' : 'bg-[#0F8F83]/10 text-[#0F8F83]'}`}>
                  {a.asset_type === 'video' ? <Video className="size-3.5" /> : <FileText className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#102033] dark:text-white capitalize">{a.asset_type.replace('_', ' ')}</span>
                    <span className="text-xs font-semibold text-slate-400">via {a.provider}</span>
                  </div>
                  {a.output_text && (
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{a.output_text}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
