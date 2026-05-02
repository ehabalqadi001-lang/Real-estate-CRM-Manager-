'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Clock, DollarSign, MoreHorizontal, Phone, User } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/motion'

// Initial stages as per the CRM architecture
const STAGES = [
  { id: 'new', title: 'New Leads (جديد)', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contacted (تم التواصل)', color: 'bg-amber-500' },
  { id: 'meeting', title: 'Meeting (موعد محدد)', color: 'bg-purple-500' },
  { id: 'negotiation', title: 'Negotiation (تفاوض)', color: 'bg-pink-500' },
  { id: 'won', title: 'Closed Won (تم البيع)', color: 'bg-emerald-500' },
]

// Mock data to render the UI before connecting to Supabase
const INITIAL_DEALS = [
  { id: 'deal_1', title: 'Villa in New Cairo', client: 'Ahmed Hassan', amount: '12,500,000 EGP', stage: 'new' },
  { id: 'deal_2', title: 'Chalet in North Coast', client: 'Mona Ali', amount: '8,200,000 EGP', stage: 'contacted' },
  { id: 'deal_3', title: 'Penthouse - Zayed', client: 'Omar Tarek', amount: '15,000,000 EGP', stage: 'meeting' },
]

export function PipelineBoard() {
  const [deals, setDeals] = useState(INITIAL_DEALS)
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDeal(dealId)
    e.dataTransfer.setData('dealId', dealId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Necessary to allow dropping
  }

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('dealId')
    if (!dealId) return

    setDeals((current) =>
      current.map((deal) =>
        deal.id === dealId ? { ...deal, stage: targetStage } : deal
      )
    )
    setDraggedDeal(null)
  }

  return (
    <div className="sales-command min-h-screen p-6" dir="ltr">
      {/* Header */}
      <div className="sales-hero rounded-3xl p-8 mb-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Sales Command Pipeline</h1>
          <p className="text-white/70 font-semibold max-w-xl">
            Manage your active deals, move clients through stages, and track your cell's overall GMV in real-time.
          </p>
        </motion.div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar h-[calc(100vh-250px)] items-start">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id)

          return (
            <div
              key={stage.id}
              className="sales-stage-column flex-shrink-0 w-[calc(100vw-2rem)] xs:w-72 sm:w-80 rounded-2xl p-4 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className="font-black text-slate-800">{stage.title}</h3>
                </div>
                <span className="bg-white/60 text-slate-500 font-bold text-xs px-2 py-0.5 rounded-md shadow-sm">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deals List */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
                {stageDeals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    variants={fadeUp}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, deal.id)}
                    onDragEnd={() => setDraggedDeal(null)}
                    className={`sales-deal-card cursor-grab bg-white p-4 rounded-xl border ${draggedDeal === deal.id ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{deal.title}</h4>
                      <button aria-label="More options" className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="size-4" aria-hidden="true" /></button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><User className="size-3.5 text-slate-400" /> {deal.client}</div>
                      <div className="flex items-center gap-2 text-xs font-black text-emerald-600"><DollarSign className="size-3.5 text-emerald-500" /> {deal.amount}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}