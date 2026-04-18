'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { Building, ChevronLeft, ChevronRight, DollarSign, GripVertical, User } from 'lucide-react'

interface Deal {
  id: string
  title?: string
  stage?: string
  unit_value?: number
  buyer_name?: string
  compound?: string
}

const STAGES = [
  { key: 'New', label: 'جديد', tone: 'slate' },
  { key: 'Negotiation', label: 'تفاوض', tone: 'blue' },
  { key: 'Contracted', label: 'عقد', tone: 'violet' },
  { key: 'Registration', label: 'توثيق', tone: 'amber' },
  { key: 'Handover', label: 'تسليم', tone: 'emerald' },
  { key: 'Lost', label: 'خسارة', tone: 'red' },
] as const

function DealCard({
  deal,
  stageIndex,
  onMove,
  isDragging = false,
}: {
  deal: Deal
  stageIndex: number
  onMove: (dealId: string, targetStage: string) => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }
  const previousStage = STAGES[stageIndex - 1]
  const nextStage = STAGES[stageIndex + 1]

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="rounded-lg border border-[var(--fi-line)] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex size-8 shrink-0 touch-none items-center justify-center rounded-lg text-slate-300 transition hover:bg-[var(--fi-soft)] hover:text-[var(--fi-emerald)] active:cursor-grabbing md:cursor-grab"
          aria-label="سحب الصفقة"
        >
          <GripVertical size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--fi-ink)]">{deal.title ?? deal.compound ?? 'صفقة'}</p>
          {deal.unit_value ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[var(--fi-emerald)]">
              <DollarSign size={12} />
              {new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(deal.unit_value)} ج.م
            </p>
          ) : null}
          {deal.buyer_name && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[var(--fi-muted)]">
              <User size={11} /> {deal.buyer_name}
            </p>
          )}
          {deal.compound && deal.title !== deal.compound && (
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-[var(--fi-muted)]">
              <Building size={11} /> {deal.compound}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
        <button
          type="button"
          disabled={!previousStage}
          onClick={() => previousStage && onMove(deal.id, previousStage.key)}
          className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-[var(--fi-line)] text-xs font-black text-[var(--fi-muted)] disabled:opacity-40"
        >
          <ChevronRight size={14} />
          السابق
        </button>
        <button
          type="button"
          disabled={!nextStage}
          onClick={() => nextStage && onMove(deal.id, nextStage.key)}
          className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[var(--fi-emerald)] text-xs font-black text-white disabled:opacity-40"
        >
          التالي
          <ChevronLeft size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function DragCard({ deal }: { deal: Deal }) {
  return (
    <div className="w-56 rotate-1 rounded-lg border-2 border-[var(--fi-emerald)] bg-white p-3 shadow-2xl">
      <p className="truncate text-sm font-black text-[var(--fi-ink)]">{deal.title ?? deal.compound ?? 'صفقة'}</p>
      {deal.unit_value ? (
        <p className="mt-1 text-xs font-bold text-[var(--fi-emerald)]">
          {new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(deal.unit_value)} ج.م
        </p>
      ) : null}
    </div>
  )
}

function Column({
  stage,
  stageIndex,
  deals,
  focused,
  onMove,
}: {
  stage: (typeof STAGES)[number]
  stageIndex: number
  deals: Deal[]
  focused: boolean
  onMove: (dealId: string, targetStage: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key })
  const total = deals.reduce((sum, deal) => sum + Number(deal.unit_value ?? 0), 0)

  return (
    <section
      className={`${focused ? 'flex' : 'hidden'} min-h-[520px] w-full shrink-0 snap-center flex-col rounded-lg border border-[var(--fi-line)] bg-white shadow-sm transition md:flex md:w-[300px] ${isOver ? 'ring-2 ring-[var(--fi-emerald)] ring-offset-2' : ''}`}
    >
      <div className="border-b border-[var(--fi-line)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${stageDot(stage.tone)}`} />
            <h2 className="text-sm font-black text-[var(--fi-ink)]">{stage.label}</h2>
          </div>
          <span className="rounded-full bg-[var(--fi-soft)] px-2.5 py-1 text-xs font-black text-[var(--fi-emerald)]">{deals.length}</span>
        </div>
        {total > 0 && (
          <p className="mt-2 text-xs font-bold text-[var(--fi-muted)]">
            {new Intl.NumberFormat('ar-EG', { notation: 'compact', maximumFractionDigits: 1 }).format(total)} ج.م
          </p>
        )}
      </div>

      <SortableContext items={deals.map((deal) => deal.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-28 flex-1 space-y-2 overflow-y-auto p-2">
          <AnimatePresence initial={false}>
            {deals.length ? (
              deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} stageIndex={stageIndex} onMove={onMove} />
              ))
            ) : (
              <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)] px-3 text-center text-xs font-bold text-[var(--fi-muted)]">
                لا توجد صفقات في هذه المرحلة
              </div>
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </section>
  )
}

export default function KanbanBoard({
  initialDeals,
  onStageChange,
}: {
  initialDeals: Deal[]
  onStageChange: (dealId: string, newStage: string) => Promise<void>
}) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [focusedStage, setFocusedStage] = useState<(typeof STAGES)[number]['key']>('New')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } })
  )

  const activeDeal = activeId ? deals.find((deal) => deal.id === activeId) ?? null : null
  const grouped = useMemo(() => {
    return STAGES.map((stage) => ({
      ...stage,
      deals: deals.filter((deal) => (deal.stage ?? 'New') === stage.key),
    }))
  }, [deals])

  const getStageForDeal = useCallback((id: string) => deals.find((deal) => deal.id === id)?.stage ?? 'New', [deals])

  async function moveDeal(dealId: string, targetStage: string) {
    const currentStage = getStageForDeal(dealId)
    if (targetStage === currentStage) return

    setDeals((current) => current.map((deal) => (deal.id === dealId ? { ...deal, stage: targetStage } : deal)))
    try {
      await onStageChange(dealId, targetStage)
      setFocusedStage(targetStage as (typeof STAGES)[number]['key'])
    } catch {
      setDeals((current) => current.map((deal) => (deal.id === dealId ? { ...deal, stage: currentStage } : deal)))
    }
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const dealId = String(active.id)
    const overId = String(over.id)
    const targetStage = STAGES.find((stage) => stage.key === overId)?.key ?? getStageForDeal(overId)
    await moveDeal(dealId, targetStage)
  }

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:hidden">
        {grouped.map((stage) => (
          <button
            key={stage.key}
            type="button"
            onClick={() => setFocusedStage(stage.key)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-black transition ${
              focusedStage === stage.key
                ? 'border-[var(--fi-emerald)] bg-[var(--fi-soft)] text-[var(--fi-emerald)]'
                : 'border-[var(--fi-line)] bg-white text-[var(--fi-muted)]'
            }`}
          >
            {stage.label}
            <span className="rounded-full bg-white px-2 py-0.5">{stage.deals.length}</span>
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex snap-x gap-3 overflow-x-auto pb-4 md:snap-none">
          {grouped.map((stage, index) => (
            <Column
              key={stage.key}
              stage={stage}
              stageIndex={index}
              deals={stage.deals}
              focused={focusedStage === stage.key}
              onMove={(dealId, targetStage) => void moveDeal(dealId, targetStage)}
            />
          ))}
        </div>
        <DragOverlay>{activeDeal ? <DragCard deal={activeDeal} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}

function stageDot(tone: (typeof STAGES)[number]['tone']) {
  const tones = {
    slate: 'bg-slate-400',
    blue: 'bg-[var(--fi-info)]',
    violet: 'bg-violet-500',
    amber: 'bg-[var(--fi-warning)]',
    emerald: 'bg-[var(--fi-emerald)]',
    red: 'bg-[var(--fi-danger)]',
  }

  return tones[tone]
}
