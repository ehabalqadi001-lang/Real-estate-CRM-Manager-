'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Building2, X, MapPin, Search } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { MasterplanNode } from './MasterplanMap'

// استيراد الخريطة بشكل ديناميكي لتعطيل الـ SSR
const MasterplanMap = dynamic(() => import('./MasterplanMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <div className="text-emerald-600 font-black animate-pulse flex flex-col items-center gap-3">
        <MapPin className="size-8 animate-bounce" />
        جاري تحميل المخطط التفاعلي...
      </div>
    </div>
  )
})

interface MasterplanBoardProps {
  projectId: string
  projectName: string
  imageUrl: string
  width: number
  height: number
  nodes: MasterplanNode[]
}

export function MasterplanBoard({ projectId, projectName, imageUrl, width, height, nodes }: MasterplanBoardProps) {
  const [liveNodes, setLiveNodes] = useState<MasterplanNode[]>(nodes)
  const [selectedNode, setSelectedNode] = useState<MasterplanNode | null>(null)

  useEffect(() => {
    // إنشاء عميل Supabase الخاص بالمتصفح
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // الاشتراك في قناة التحديثات اللحظية لجدول العُقد
    const channel = supabase
      .channel(`masterplan_updates_${projectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'masterplan_nodes', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const updatedNode = payload.new as MasterplanNode
          setLiveNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? { ...n, ...updatedNode } : n)))
          // تحديث الواجهة الجانبية فوراً إذا كان المبنى المُحدَّث هو المفتوح حالياً
          setSelectedNode((prev) => (prev?.id === updatedNode.id ? { ...prev, ...updatedNode } : prev))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  return (
    <div className="relative flex h-[800px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      
      {/* الخريطة التفاعلية */}
      <div className="flex-1 relative">
        {/* شريط أدوات عائم فوق الخريطة */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center gap-4">
          <div>
            <h2 className="font-black text-slate-900 text-sm">مخطط {projectName}</h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">اضغط على أي مبنى أو منطقة للتفاصيل</p>
          </div>
        </div>

        <MasterplanMap
          imageUrl={imageUrl}
          width={width}
          height={height}
          nodes={liveNodes}
          onNodeClick={(node) => setSelectedNode(node)}
        />
      </div>

      {/* القائمة الجانبية (تظهر عند اختيار مبنى) */}
      <div className={`w-80 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full shadow-2xl z-[500]'}`}>
        {selectedNode && (
          <>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{selectedNode.label}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedNode.node_type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg p-1.5">
                <X className="size-4" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                <div className="text-sm flex justify-between items-center mb-2">
                  <span className="text-slate-500 font-bold">الوحدات المتاحة</span>
                  <span className="font-black text-emerald-600">{selectedNode.metadata?.available_units ?? 0}</span>
                </div>
                {selectedNode.metadata?.price_range && (
                  <div className="text-sm flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500 font-bold">متوسط السعر</span>
                    <span className="font-black text-slate-900">{selectedNode.metadata.price_range}</span>
                  </div>
                )}
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black transition-colors text-sm shadow-sm shadow-emerald-200">
                <Search className="size-4" /> عرض كل الوحدات المتاحة هنا
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
