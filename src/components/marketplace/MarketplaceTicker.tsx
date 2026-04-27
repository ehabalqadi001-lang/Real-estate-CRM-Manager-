import { createRawClient } from '@/lib/supabase/server'

export async function MarketplaceTicker() {
  const supabase = await createRawClient()
  const { data: items } = await supabase
    .from('marketplace_ticker')
    .select('id,type,content,logo_url,developer_name,badge_color')
    .eq('is_active', true)
    .order('display_order')
    .limit(20)

  if (!items?.length) return null

  // Duplicate items so the scroll loops seamlessly
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden border-b border-slate-200/60 bg-gradient-to-r from-[#0c1a2e] via-[#0f2040] to-[#0c1a2e] py-2.5">
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{ animation: 'fi-ticker 35s linear infinite', willChange: 'transform' }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-white/90"
          >
            {item.type === 'logo' && item.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logo_url}
                alt={item.developer_name ?? ''}
                className="inline size-4 rounded object-contain opacity-90"
              />
            )}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
              style={{ backgroundColor: item.badge_color ?? '#10b981' }}
            >
              {item.type === 'launch' ? '🚀 جديد' : item.type === 'logo' ? '🏢' : '📢'}
            </span>
            <span>{item.content ?? item.developer_name ?? ''}</span>
            <span className="text-white/20 select-none">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes fi-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
