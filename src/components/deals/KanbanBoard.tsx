'use client'

import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Building, DollarSign, User, GripVertical } from 'lucide-react'

interface Deal {
  id: string
  title?: string
  stage?: string
  unit_value?: number
  buyer_name?: string
  compound?: string
}

const STAGES = [
  { key: 'New',         label: 'جديد',        color: 'bg-slate-100 border-slate-200',   header: 'bg-slate-200 text-slate-700' },
  { key: 'Negotiation', label: 'تفاوض',       color: 'bg-blue-50  border-blue-200',     header: 'bg-blue-200 text-blue-800' },
  { key: 'Contracted',  label: 'عقد',         color: 'bg-purple-50 border-purple-200',  header: 'bg-purple-200 text-purple-800' },
  { key: 'Registration',label: 'توثيق',       color: 'bg-amber-50 border-amber-200',    header: 'bg-amber-200 text-amber-800' },
  { key: 'Handover',    label: 'تسليم',       color: 'bg-emerald-50 border-emerald-200',header: 'bg-emerald-200 text-emerald-800' },
  { key: 'Lost',        label: 'خسرنا',       color: 'bg-red-50 border-red-200',        header: 'bg-red-200 text-red-800' },
]

// ── Sortable deal card ───────────────────────────────────────
function DealCard({ deal, isDragging = false }: { deal: Deal; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style}
      className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-default select-none">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners}
          className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-900 truncate">{deal.title ?? deal.compound ?? 'صفقة'}</p>
          {deal.unit_value ? (
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <DollarSign size={10} />
              {new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(deal.unit_value)} ج.م
            </p>
          ) : null}
          {deal.buyer_name && (
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <User size={9} /> {deal.buyer_name}
            </p>
          )}
          {deal.compound && deal.title !== deal.compound && (
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
              <Building size={9} /> {deal.compound}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Overlay card (while dragging) ───────────────────────────
function DragCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-400 p-3 shadow-2xl rotate-2 w-48">
      <p className="text-xs font-black text-slate-900 truncate">{deal.title ?? deal.compound ?? 'صفقة'}</p>
      {deal.unit_value ? (
        <p className="text-xs text-emerald-600 font-bold mt-1">
          {new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(deal.unit_value)} ج.م
        </p>
      ) : null}
    </div>
  )
}

// ── Column ───────────────────────────────────────────────────
function Column({ stage, deals }: { stage: typeof STAGES[0]; deals: Deal[] }) {
  const total = deals.reduce((s, d) => s + Number(d.unit_value ?? 0), 0)
  return (
    <div className={`flex flex-col rounded-2xl border ${stage.color} min-w-[200px] flex-shrink-0`}>
      <div className={`${stage.header} rounded-t-2xl px-3 py-2.5`}>
        <div className="flex justify-between items-center">
          <span className="font-black text-sm">{stage.label}</span>
          <span className="text-xs font-bold opacity-70">{deals.length}</span>
        </div>
        {total > 0 && (
          <p className="text-[10px] font-bold opacity-60 mt-0.5">
            {new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(total)} ج.م
          </p>
        )}
      </div>
      <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 flex-1 min-h-[80px]">
          {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
        </div>
      </SortableContext>
    </div>
  )
}

// ── Main board ───────────────────────────────────────────────
export default function KanbanBoard({
  initialDeals,
  onStageChange,
}: {
  initialDeals: Deal[]
  onStageChange: (dealId: string, newStage: string) => Promise<void>
}) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeDeal = activeId ? deals.find(d => d.id === activeId) ?? null : null

  const getStageForDeal = useCallback((id: string) =>
    deals.find(d => d.id === id)?.stage ?? 'New', [deals])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const dealId = String(active.id)
    const overId  = String(over.id)

    // Determine target stage: either a stage key or another deal's stage
    const targetStage = STAGES.find(s => s.key === overId)?.key
      ?? getStageForDeal(overId)

    const currentStage = getStageForDeal(dealId)
    if (targetStage === currentStage) return

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: targetStage } : d))

    try {
      await onStageChange(dealId, targetStage)
    } catch {
      // Rollback
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: currentStage } : d))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <Column key={stage.key} stage={stage}
            deals={deals.filter(d => (d.stage ?? 'New') === stage.key)} />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? <DragCard deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
