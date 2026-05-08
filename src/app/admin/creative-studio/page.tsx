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
          <p className="text-sm font-black text-[var(--fi-emerald)]">NEXUS Creative</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-[var(--fi-ink)]">AI Creative Studio</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--fi-muted)]">
            توليد إعلانات، منشورات، بريد إلكتروني، وفيديوهات HeyGen من وصف العقار في ثوانٍ.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-[var(--fi-emerald)]">{copyCount}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">نص مولّد</p>
          </div>
          <div className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-paper)] px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black text-[#C9964A]">{videoCount}</p>
            <p className="text-xs font-semibold text-[var(--fi-muted)]">فيديو</p>
          </div>
        </div>
      </div>

      <CreativeStudioClient />

      {/* Recent Assets */}
      {assets.length > 0 && (
        <div className="rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-4 text-[var(--fi-muted)]" />
            <p className="font-black text-[var(--fi-ink)]">الأصول المولّدة مؤخراً</p>
          </div>
          <div className="space-y-3">
            {assets.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-[var(--fi-line)] p-3">
                <div className={`mt-0.5 rounded-lg p-1.5 ${a.asset_type === 'video' ? 'bg-[#C9964A]/10 text-[#C9964A]' : 'bg-[var(--fi-emerald)]/10 text-[var(--fi-emerald)]'}`}>
                  {a.asset_type === 'video' ? <Video className="size-3.5" /> : <FileText className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[var(--fi-ink)] capitalize">{a.asset_type.replace('_', ' ')}</span>
                    <span className="text-xs font-semibold text-[var(--fi-muted)]">via {a.provider}</span>
                  </div>
                  {a.output_text && (
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--fi-muted)]">{a.output_text}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--fi-muted)]">
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
