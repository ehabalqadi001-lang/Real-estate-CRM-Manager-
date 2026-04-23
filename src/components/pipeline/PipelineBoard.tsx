'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
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
import { toast } from 'sonner'
import {
  Calendar,
  Filter,
  GripVertical,
  MessageCircle,
  Plus,
  Save,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  User,
  WalletCards,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AiFollowUpMessageButton } from '@/components/ai/ai-follow-up-message-button'
import { createBrowserSupabaseClient } from '@/shared/supabase/browser'
import type { CreateDealInput, UpdateDealInput } from '@/app/dashboard/pipeline/actions'

export type PipelineStage = 'new' | 'contacted' | 'viewing' | 'offer' | 'contract' | 'closed' | 'lost'

export type PipelineDeal = {
  id: string
  leadId: string | null
  unitId: string | null
  agentId: string | null
  stage: PipelineStage
  title: string
  clientName: string
  projectName: string
  unitName: string
  value: number
  expectedCloseDate: string | null
  notes: string | null
  agentName: string
  createdAt: string
  updatedAt: string | null
}

export type PipelineLeadOption = {
  id: string
  name: string
  phone: string | null
}

export type PipelineUnitOption = {
  id: string
  label: string
  projectName: string
  price: number
}

export type PipelineAgentOption = {
  id: string
  name: string
}

export type DealActivityItem = {
  id: string
  dealId: string
  action: string
  note: string | null
  createdAt: string
}

type PipelineBoardProps = {
  initialDeals: PipelineDeal[]
  leads: PipelineLeadOption[]
  units: PipelineUnitOption[]
  agents: PipelineAgentOption[]
  activities: DealActivityItem[]
  canAssignAgents: boolean
  userRole?: string
  userName?: string
  onStageChange: (dealId: string, stage: PipelineStage) => Promise<void>
  onCreateDeal: (input: CreateDealInput) => Promise<{ id: string }>
  onUpdateDeal: (input: UpdateDealInput) => Promise<void>
  onAddActivity: (dealId: string, note: string) => Promise<void>
}

const STAGES: Array<{ key: PipelineStage; label: string; tone: string; color: string; bg: string }> = [
  { key: 'new',       label: 'New Lead',    tone: 'bg-slate-400',   color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  { key: 'contacted', label: 'Contacted',   tone: 'bg-sky-500',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
  { key: 'viewing',   label: 'Site Visit',  tone: 'bg-violet-500',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  { key: 'offer',     label: 'Offer Made',  tone: 'bg-amber-500',   color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { key: 'contract',  label: 'Contract',    tone: 'bg-teal-500',    color: '#14b8a6', bg: 'rgba(20,184,166,0.10)' },
  { key: 'closed',    label: 'Closed Won',  tone: 'bg-emerald-500', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'lost',      label: 'Lost',        tone: 'bg-red-400',     color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
]

export function PipelineBoard({
  initialDeals,
  leads,
  units,
  agents,
  activities,
  canAssignAgents,
  userRole,
  userName,
  onStageChange,
  onCreateDeal,
  onUpdateDeal,
  onAddActivity,
}: PipelineBoardProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [agentFilter, setAgentFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [minValue, setMinValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } }),
  )

  useEffect(() => {
    const channel = supabase
      .channel('pipeline-deals-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, (payload) => {
        const row = payload.new as Record<string, unknown> | null
        if (!row?.id) return

        setDeals((current) => {
          const index = current.findIndex((deal) => deal.id === row.id)
          if (payload.eventType === 'DELETE') return current.filter((deal) => deal.id !== payload.old.id)

          if (index === -1) {
            return [normalizeRealtimeDeal(row), ...current]
          }

          return current.map((deal) =>
            deal.id === row.id
              ? {
                  ...deal,
                  stage: normalizeStage(String(row.stage ?? deal.stage)),
                  value: Number(row.unit_value ?? row.value ?? deal.value),
                  expectedCloseDate:
                    typeof row.expected_close_date === 'string'
                      ? row.expected_close_date
                      : deal.expectedCloseDate,
                  notes: typeof row.notes === 'string' ? row.notes : deal.notes,
                  updatedAt: typeof row.updated_at === 'string' ? row.updated_at : deal.updatedAt,
                }
              : deal,
          )
        })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (agentFilter !== 'all' && deal.agentId !== agentFilter) return false
      if (projectFilter !== 'all' && deal.projectName !== projectFilter) return false
      if (minValue && deal.value < Number(minValue)) return false
      if (dateFilter !== 'all' && !withinDateFilter(deal.expectedCloseDate, dateFilter)) return false
      return true
    })
  }, [agentFilter, dateFilter, deals, minValue, projectFilter])

  const grouped = useMemo(
    () =>
      STAGES.map((stage) => ({
        ...stage,
        deals: filteredDeals.filter((deal) => deal.stage === stage.key),
      })),
    [filteredDeals],
  )

  const activeDeal = activeId ? deals.find((deal) => deal.id === activeId) ?? null : null
  const projects = Array.from(new Set(deals.map((deal) => deal.projectName).filter(Boolean)))
  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0)
  const avgDeal = filteredDeals.length ? totalValue / filteredDeals.length : 0
  const closedDeals = filteredDeals.filter((deal) => deal.stage === 'closed').length

  function moveDeal(dealId: string, targetStage: PipelineStage) {
    const current = deals.find((deal) => deal.id === dealId)
    if (!current || current.stage === targetStage) return

    setDeals((items) =>
      items.map((deal) => (deal.id === dealId ? { ...deal, stage: targetStage } : deal)),
    )
    startTransition(async () => {
      try {
        await onStageChange(dealId, targetStage)
        toast.success('Deal moved successfully')
      } catch (error) {
        setDeals((items) =>
          items.map((deal) => (deal.id === dealId ? { ...deal, stage: current.stage } : deal)),
        )
        toast.error(error instanceof Error ? error.message : 'Failed to move deal')
      }
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    if (!event.over) return
    const dealId = String(event.active.id)
    const overId = String(event.over.id)
    const targetStage =
      STAGES.find((stage) => stage.key === overId)?.key ??
      deals.find((deal) => deal.id === overId)?.stage
    if (targetStage) moveDeal(dealId, targetStage)
  }

  return (
    <section className="sales-command-shell space-y-5" dir="ltr">
      <WelcomeHeader role={userRole} name={userName} totalValue={totalValue} closedDeals={closedDeals} />

      {/* Pipeline control card */}
      <Card className="sales-card overflow-hidden rounded-3xl border-[var(--fi-line)] bg-white">
        <CardHeader className="gap-4 xl:grid-cols-[1fr_auto]">
          <div>
            <Badge className="sales-pill bg-[var(--fi-soft)] px-3 py-1 text-[var(--sales-blue)]">
              SALES PIPELINE
            </Badge>
            <CardTitle className="mt-3 text-2xl font-black text-[var(--fi-ink)]">Deal Kanban Board</CardTitle>
            <CardDescription className="mt-2 font-semibold leading-7 text-[var(--fi-muted)]">
              Full Kanban board with optimistic updates and real-time team synchronization.
            </CardDescription>
          </div>
          <Button
            className="sales-primary h-11 gap-2 rounded-2xl px-5"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="size-4" />
            New Deal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPI row */}
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Total Deals" value={filteredDeals.length.toLocaleString('en-US')} icon={<Target className="size-4 text-[var(--sales-blue)]" />} />
            <Stat label="Pipeline Value" value={formatMoney(totalValue)} icon={<TrendingUp className="size-4 text-emerald-500" />} />
            <Stat label="Average Deal" value={formatMoney(avgDeal)} icon={<WalletCards className="size-4 text-violet-500" />} />
          </div>

          {/* Filter bar */}
          <div className="grid gap-2 rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-soft)]/70 p-3 md:grid-cols-4">
            <FilterSelect
              icon={<User className="size-4" />}
              value={agentFilter}
              onChange={setAgentFilter}
              label="Agent"
            >
              <option value="all">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              icon={<WalletCards className="size-4" />}
              value={projectFilter}
              onChange={setProjectFilter}
              label="Project"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              icon={<Calendar className="size-4" />}
              value={dateFilter}
              onChange={setDateFilter}
              label="Close Date"
            >
              <option value="all">All Dates</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
            </FilterSelect>

            <label className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--fi-line)] bg-white px-3">
              <Filter className="size-4 text-[var(--sales-blue)]" />
              <Input
                className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
                inputMode="numeric"
                placeholder="Min Value (EGP)"
                value={minValue}
                onChange={(event) => setMinValue(event.target.value)}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {grouped.map((column) => (
            <PipelineColumn
              key={column.key}
              stage={column}
              disabled={isPending}
              onDealClick={setSelectedDeal}
              onMove={moveDeal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <CompactDealCard deal={activeDeal} isOverlay onClick={() => undefined} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Deal detail sheet */}
      <DealDetailSheet
        deal={selectedDeal}
        activities={activities.filter((activity) => activity.dealId === selectedDeal?.id)}
        onClose={() => setSelectedDeal(null)}
        onUpdate={async (input) => {
          await onUpdateDeal(input)
          setDeals((items) =>
            items.map((deal) =>
              deal.id === input.dealId
                ? {
                    ...deal,
                    stage: input.stage ? normalizeStage(input.stage) : deal.stage,
                    value: input.value ?? deal.value,
                    expectedCloseDate: input.expectedCloseDate ?? deal.expectedCloseDate,
                    notes: input.notes ?? deal.notes,
                  }
                : deal,
            ),
          )
        }}
        onAddActivity={onAddActivity}
      />

      {/* Add deal sheet */}
      <AddDealSheet
        open={isAddOpen}
        leads={leads}
        units={units}
        agents={agents}
        canAssignAgents={canAssignAgents}
        onClose={() => setIsAddOpen(false)}
        onCreate={async (input) => {
          const created = await onCreateDeal(input)
          toast.success('Deal created successfully')
          setIsAddOpen(false)
          setDeals((items) => [
            {
              id: created.id,
              leadId: input.leadId,
              unitId: input.unitId ?? null,
              agentId: input.agentId ?? null,
              stage: 'new',
              title: input.title,
              clientName: leads.find((lead) => lead.id === input.leadId)?.name ?? 'Client',
              projectName: units.find((unit) => unit.id === input.unitId)?.projectName ?? '',
              unitName: units.find((unit) => unit.id === input.unitId)?.label ?? '',
              value: input.value,
              expectedCloseDate: input.expectedCloseDate ?? null,
              notes: input.notes ?? null,
              agentName: agents.find((agent) => agent.id === input.agentId)?.name ?? 'Team',
              createdAt: new Date().toISOString(),
              updatedAt: null,
            },
            ...items,
          ])
        }}
      />
    </section>
  )
}

/* ─── Welcome Hero ─────────────────────────────────────────────── */
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}
const heroChild = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
}

function WelcomeHeader({
  role,
  name,
  totalValue,
  closedDeals,
}: {
  role?: string
  name?: string
  totalValue: number
  closedDeals: number
}) {
  const profile = getWelcomeProfile(role)

  return (
    <section className="sales-hero rounded-3xl p-5 sm:p-6 lg:p-8">
      <motion.div
        variants={heroStagger}
        initial="hidden"
        animate="show"
        className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center"
      >
        <div>
          <motion.div variants={heroChild} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
            <Sparkles className="size-3.5 text-emerald-300" />
            FAST INVESTMENT · Sales Command
          </motion.div>
          <motion.h1 variants={heroChild} className="mt-5 max-w-3xl text-2xl font-black leading-tight text-white sm:text-4xl">
            {profile.title}
          </motion.h1>
          <motion.p variants={heroChild} className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100/80 sm:text-base">
            {profile.message}
          </motion.p>
          {name && (
            <motion.p variants={heroChild} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white">
              <span className="size-2 rounded-full bg-emerald-400" />
              Active workspace: {name}
            </motion.p>
          )}
        </div>

        {/* KPI tiles */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <motion.div variants={heroChild} className="rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-400/20">
                <CheckCircle2 className="size-4 text-emerald-300" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100/70">Closed Wins</p>
            </div>
            <p className="fi-tabular mt-3 text-3xl font-black text-white">
              {closedDeals.toLocaleString('en-US')}
            </p>
            <p className="mt-1 text-[11px] font-bold text-blue-100/50">Deals successfully closed</p>
          </motion.div>
          <motion.div variants={heroChild} className="rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-400/20">
                <TrendingUp className="size-4 text-blue-300" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100/70">Active Pipeline</p>
            </div>
            <p className="fi-tabular mt-3 text-2xl font-black text-white">{formatMoney(totalValue)}</p>
            <p className="mt-1 text-[11px] font-bold text-blue-100/50">Total pipeline value</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

/* ─── Pipeline Column ───────────────────────────────────────────── */
function PipelineColumn({
  stage,
  disabled,
  onDealClick,
  onMove,
}: {
  stage: { key: PipelineStage; label: string; tone: string; color: string; bg: string; deals: PipelineDeal[] }
  disabled: boolean
  onDealClick: (deal: PipelineDeal) => void
  onMove: (dealId: string, stage: PipelineStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key })
  const total = stage.deals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <section
      className={`sales-stage-column flex min-h-[560px] w-[310px] shrink-0 flex-col rounded-3xl border shadow-sm transition-all duration-200 ${
        isOver
          ? 'border-[var(--sales-blue)] ring-2 ring-[var(--sales-blue)]/20 shadow-[0_0_0_2px_rgba(37,99,235,0.12)]'
          : 'border-[var(--fi-line)]'
      }`}
    >
      {/* Column header */}
      <div className="border-b border-[var(--fi-line)] p-4" style={{ background: stage.bg }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2.5 rounded-full ${stage.tone} shadow-sm`}
              style={{ boxShadow: `0 0 0 3px ${stage.color}22` }}
            />
            <h2 className="font-black text-[var(--fi-ink)]">{stage.label}</h2>
          </div>
          <Badge
            className="sales-pill font-black tabular-nums"
            variant="secondary"
            style={{ color: stage.color, background: `${stage.color}18`, border: `1px solid ${stage.color}30` }}
          >
            {stage.deals.length.toLocaleString('en-US')}
          </Badge>
        </div>
        <p className="mt-2 text-[11px] font-bold text-[var(--fi-muted)]">
          Stage value: {formatMoney(total)}
        </p>
      </div>

      {/* Droppable deal list */}
      <SortableContext
        items={stage.deals.map((deal) => deal.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="min-h-32 flex-1 space-y-2 overflow-y-auto p-2">
          {stage.deals.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-[var(--fi-line)] bg-[var(--fi-soft)]/50 px-4 text-center text-xs font-bold text-[var(--fi-muted)]">
              Drop deals here
            </div>
          ) : (
            stage.deals.map((deal) => (
              <SortableDealCard
                key={deal.id}
                deal={deal}
                disabled={disabled}
                onClick={() => onDealClick(deal)}
                onMove={onMove}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  )
}

/* ─── Sortable Deal Card ────────────────────────────────────────── */
function SortableDealCard({
  deal,
  disabled,
  onClick,
  onMove,
}: {
  deal: PipelineDeal
  disabled: boolean
  onClick: () => void
  onMove: (dealId: string, stage: PipelineStage) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    disabled,
  })
  const baseTransform = CSS.Transform.toString(transform)
  const style = {
    transform: [baseTransform, isDragging ? 'scale(1.02)' : ''].filter(Boolean).join(' ') || undefined,
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <CompactDealCard
        deal={deal}
        onClick={onClick}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="flex size-8 touch-none items-center justify-center rounded-xl text-[var(--fi-muted)] hover:bg-[var(--fi-soft)] md:cursor-grab"
            aria-label="Drag deal"
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
      <div className="mt-1 hidden grid-cols-2 gap-1 max-md:grid">
        {STAGES.map((stage) => stage.key).includes(deal.stage) && (
          <>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => moveRelative(deal, -1, onMove)}
            >
              ← Previous
            </Button>
            <Button type="button" size="xs" onClick={() => moveRelative(deal, 1, onMove)}>
              Next →
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Compact Deal Card ─────────────────────────────────────────── */
function CompactDealCard({
  deal,
  onClick,
  dragHandle,
  isOverlay = false,
}: {
  deal: PipelineDeal
  onClick: () => void
  dragHandle?: React.ReactNode
  isOverlay?: boolean
}) {
  const stageData = STAGES.find((s) => s.key === deal.stage)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`sales-deal-card w-full rounded-2xl border border-[var(--fi-line)] bg-white p-3 text-left shadow-sm transition ${
        isOverlay ? 'w-72 rotate-1 shadow-xl' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--fi-ink)]">{deal.clientName}</p>
          <p className="mt-0.5 truncate text-xs font-bold text-[var(--fi-muted)]">
            {deal.unitName || deal.projectName || deal.title}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black"
              style={{
                color: stageData?.color ?? '#667085',
                background: stageData?.bg ?? 'rgba(102,112,133,0.10)',
              }}
            >
              <span className={`size-1.5 rounded-full ${stageData?.tone ?? 'bg-slate-400'}`} />
              {stageLabel(deal.stage)}
            </span>
            <span className="text-xs font-black text-[var(--fi-ink)]">{formatMoney(deal.value)}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--fi-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {daysInStage(deal.updatedAt ?? deal.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'No date'}
            </span>
          </div>
        </div>
        <Avatar size="sm">
          <AvatarFallback>{initials(deal.agentName)}</AvatarFallback>
        </Avatar>
      </div>
    </button>
  )
}

/* ─── Deal Detail Sheet ─────────────────────────────────────────── */
function DealDetailSheet({
  deal,
  activities,
  onClose,
  onUpdate,
  onAddActivity,
}: {
  deal: PipelineDeal | null
  activities: DealActivityItem[]
  onClose: () => void
  onUpdate: (input: UpdateDealInput) => Promise<void>
  onAddActivity: (dealId: string, note: string) => Promise<void>
}) {
  const [stage, setStage] = useState<PipelineStage>('new')
  const [value, setValue] = useState('')
  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [notes, setNotes] = useState('')
  const [activityNote, setActivityNote] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!deal) return
    const timeout = window.setTimeout(() => {
      setStage(deal.stage)
      setValue(String(deal.value || 0))
      setExpectedCloseDate(deal.expectedCloseDate ?? '')
      setNotes(deal.notes ?? '')
      setActivityNote('')
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [deal])

  return (
    <Sheet open={deal !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sales-command-sheet w-full overflow-y-auto bg-white sm:max-w-xl">
        {deal && (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="text-xl font-black text-[var(--fi-ink)]">{deal.clientName}</SheetTitle>
              <SheetDescription className="font-semibold">
                {deal.projectName || deal.unitName || deal.title}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pipeline Stage">
                  <select
                    className="h-10 rounded-xl border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] focus:border-[var(--sales-blue)] focus:outline-none"
                    value={stage}
                    onChange={(event) => setStage(event.target.value as PipelineStage)}
                  >
                    {STAGES.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Deal Value (EGP)">
                  <Input inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} />
                </Field>
                <Field label="Expected Close Date">
                  <Input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(event) => setExpectedCloseDate(event.target.value)}
                  />
                </Field>
                <Field label="WhatsApp Message">
                  <Button type="button" variant="outline" className="gap-2 bg-white">
                    <MessageCircle className="size-4 text-emerald-600" />
                    Coming Soon
                  </Button>
                </Field>
              </div>

              <Field label="Deal Notes">
                <textarea
                  className="min-h-24 w-full rounded-xl border border-[var(--fi-line)] bg-white p-3 text-sm outline-none transition focus:border-[var(--sales-blue)] focus:ring-2 focus:ring-[var(--sales-blue)]/15"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Field>

              <AiFollowUpMessageButton
                clientName={deal.clientName}
                dealStage={stageLabel(stage)}
                lastContactDate={deal.updatedAt ?? deal.createdAt}
                propertyInterest={deal.unitName || deal.projectName || deal.title}
                objections={notes || deal.notes}
              />

              <Button
                type="button"
                className="w-full gap-2 rounded-xl bg-[var(--fi-emerald)] font-black text-white hover:bg-[var(--fi-emerald)]/90"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await onUpdate({
                      dealId: deal.id,
                      stage,
                      value: Number(value),
                      expectedCloseDate: expectedCloseDate || null,
                      notes,
                    })
                    toast.success('Deal saved successfully')
                  })
                }
              >
                <Save className="size-4" />
                Save Changes
              </Button>

              <Field label="Log Activity">
                <textarea
                  className="min-h-20 w-full rounded-xl border border-[var(--fi-line)] bg-white p-3 text-sm outline-none transition focus:border-[var(--sales-blue)] focus:ring-2 focus:ring-[var(--sales-blue)]/15"
                  value={activityNote}
                  placeholder="Add a note about this deal…"
                  onChange={(event) => setActivityNote(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 rounded-xl bg-white"
                  onClick={() =>
                    startTransition(async () => {
                      if (!activityNote.trim()) return
                      await onAddActivity(deal.id, activityNote.trim())
                      setActivityNote('')
                      toast.success('Activity logged')
                    })
                  }
                >
                  <AlertCircle className="mr-2 size-4 text-[var(--sales-blue)]" />
                  Log Activity
                </Button>
              </Field>

              {/* Activity log */}
              <div>
                <p className="mb-2 text-sm font-black text-[var(--fi-ink)]">Activity Log</p>
                <div className="space-y-2">
                  {activities.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[var(--fi-line)] p-4 text-center text-xs font-bold text-[var(--fi-muted)]">
                      No activities logged for this deal yet
                    </p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="rounded-xl border border-[var(--fi-line)] bg-[var(--fi-soft)]/50 p-3">
                        <p className="text-xs font-black text-[var(--fi-ink)]">
                          {activity.note || activity.action}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[var(--fi-muted)]">
                          {new Date(activity.createdAt).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ─── Add Deal Sheet ────────────────────────────────────────────── */
function AddDealSheet({
  open,
  leads,
  units,
  agents,
  canAssignAgents,
  onClose,
  onCreate,
}: {
  open: boolean
  leads: PipelineLeadOption[]
  units: PipelineUnitOption[]
  agents: PipelineAgentOption[]
  canAssignAgents: boolean
  onClose: () => void
  onCreate: (input: CreateDealInput) => Promise<void>
}) {
  const [leadId, setLeadId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [value, setValue] = useState('')
  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [notes, setNotes] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [unitSearch, setUnitSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredLeads = leads
    .filter((lead) => lead.name.includes(leadSearch) || lead.phone?.includes(leadSearch))
    .slice(0, 8)
  const filteredUnits = units
    .filter((unit) => `${unit.label} ${unit.projectName}`.includes(unitSearch))
    .slice(0, 8)
  const selectedLead = leads.find((lead) => lead.id === leadId)
  const selectedUnit = units.find((unit) => unit.id === unitId)

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="sales-command-sheet w-full overflow-y-auto bg-white sm:max-w-xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-black text-[var(--fi-ink)]">Create New Deal</SheetTitle>
          <SheetDescription className="font-semibold">
            Select a client and unit, then set the expected deal value to get started.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <SearchPicker
            label="Client"
            search={leadSearch}
            onSearch={setLeadSearch}
            placeholder="Search by client name or phone…"
            selectedLabel={selectedLead?.name}
            items={filteredLeads.map((lead) => ({
              id: lead.id,
              label: lead.name,
              sub: lead.phone ?? '',
            }))}
            onSelect={setLeadId}
          />

          <SearchPicker
            label="Unit"
            search={unitSearch}
            onSearch={setUnitSearch}
            placeholder="Search by unit or project name…"
            selectedLabel={selectedUnit ? `${selectedUnit.label} — ${selectedUnit.projectName}` : undefined}
            items={filteredUnits.map((unit) => ({
              id: unit.id,
              label: unit.label,
              sub: `${unit.projectName} · ${formatMoney(unit.price)}`,
            }))}
            onSelect={(id) => {
              setUnitId(id)
              const unit = units.find((item) => item.id === id)
              if (unit && !value) setValue(String(unit.price || 0))
            }}
          />

          {canAssignAgents && (
            <Field label="Assign Agent">
              <select
                className="h-10 w-full rounded-xl border border-[var(--fi-line)] bg-white px-3 text-sm font-bold text-[var(--fi-ink)] focus:border-[var(--sales-blue)] focus:outline-none"
                value={agentId}
                onChange={(event) => setAgentId(event.target.value)}
              >
                <option value="">Current Team Member</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Deal Value (EGP)">
              <Input inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} />
            </Field>
            <Field label="Expected Close Date">
              <Input
                type="date"
                value={expectedCloseDate}
                onChange={(event) => setExpectedCloseDate(event.target.value)}
              />
            </Field>
          </div>

          <Field label="Initial Notes">
            <textarea
              className="min-h-24 w-full rounded-xl border border-[var(--fi-line)] bg-white p-3 text-sm outline-none transition focus:border-[var(--sales-blue)] focus:ring-2 focus:ring-[var(--sales-blue)]/15"
              value={notes}
              placeholder="Add any initial context for this deal…"
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>

          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-[var(--fi-emerald)] font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-[var(--fi-emerald)]/90"
            disabled={isPending || !leadId || !value}
            onClick={() =>
              startTransition(async () => {
                await onCreate({
                  leadId,
                  unitId: unitId || null,
                  agentId: agentId || null,
                  title: selectedLead?.name ? `${selectedLead.name} Deal` : 'New Deal',
                  value: Number(value),
                  expectedCloseDate: expectedCloseDate || null,
                  notes: notes || null,
                })
              })
            }
          >
            <Plus className="mr-2 size-5" />
            Create Deal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── SearchPicker ──────────────────────────────────────────────── */
function SearchPicker({
  label,
  search,
  onSearch,
  placeholder,
  selectedLabel,
  items,
  onSelect,
}: {
  label: string
  search: string
  onSearch: (value: string) => void
  placeholder: string
  selectedLabel?: string
  items: Array<{ id: string; label: string; sub: string }>
  onSelect: (id: string) => void
}) {
  return (
    <Field label={label}>
      <div className="rounded-xl border border-[var(--fi-line)] bg-white p-2">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--fi-soft)] px-2.5">
          <Search className="size-4 shrink-0 text-[var(--fi-emerald)]" />
          <Input
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={placeholder}
          />
        </div>
        {selectedLabel && (
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Selected: {selectedLabel}
          </p>
        )}
        <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-3 text-center text-xs font-bold text-[var(--fi-muted)]">No results found</p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-[var(--fi-soft)]"
                onClick={() => onSelect(item.id)}
              >
                <p className="text-sm font-black text-[var(--fi-ink)]">{item.label}</p>
                <p className="mt-0.5 text-xs font-bold text-[var(--fi-muted)]">{item.sub}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </Field>
  )
}

/* ─── Field ─────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-black text-[var(--fi-ink)]">
      {label}
      {children}
    </label>
  )
}

/* ─── FilterSelect ──────────────────────────────────────────────── */
function FilterSelect({
  label,
  value,
  onChange,
  icon,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  icon: React.ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--fi-line)] bg-white px-3">
      <span className="shrink-0 text-[var(--sales-blue)]">{icon}</span>
      <span className="sr-only">{label}</span>
      <select
        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--fi-ink)] outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  )
}

/* ─── Stat ──────────────────────────────────────────────────────── */
function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="sales-kpi rounded-2xl border border-[var(--fi-line)] bg-[var(--fi-paper)] p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-black text-[var(--fi-muted)]">{label}</p>
      </div>
      <p className="fi-tabular mt-2 text-xl font-black text-[var(--fi-ink)]">{value}</p>
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function normalizeRealtimeDeal(row: Record<string, unknown>): PipelineDeal {
  return {
    id: String(row.id),
    leadId: typeof row.lead_id === 'string' ? row.lead_id : null,
    unitId: typeof row.unit_id === 'string' ? row.unit_id : null,
    agentId: typeof row.agent_id === 'string' ? row.agent_id : null,
    stage: normalizeStage(String(row.stage ?? 'new')),
    title: typeof row.title === 'string' ? row.title : 'New Deal',
    clientName: typeof row.title === 'string' ? row.title : 'Client',
    projectName: '',
    unitName: '',
    value: Number(row.unit_value ?? row.value ?? 0),
    expectedCloseDate: typeof row.expected_close_date === 'string' ? row.expected_close_date : null,
    notes: typeof row.notes === 'string' ? row.notes : null,
    agentName: 'Team Member',
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

export function normalizeStage(stage: string): PipelineStage {
  const map: Record<string, PipelineStage> = {
    new: 'new',
    lead: 'new',
    New: 'new',
    contacted: 'contacted',
    qualified: 'contacted',
    viewing: 'viewing',
    site_visit: 'viewing',
    offer: 'offer',
    proposal: 'offer',
    negotiation: 'offer',
    Negotiation: 'offer',
    contract: 'contract',
    reservation: 'contract',
    Contracted: 'contract',
    closed: 'closed',
    closed_won: 'closed',
    Registration: 'closed',
    Handover: 'closed',
    lost: 'lost',
    closed_lost: 'lost',
    Lost: 'lost',
  }
  return map[stage] ?? 'new'
}

function moveRelative(
  deal: PipelineDeal,
  delta: number,
  onMove: (dealId: string, stage: PipelineStage) => void,
) {
  const index = STAGES.findIndex((stage) => stage.key === deal.stage)
  const next = STAGES[index + delta]
  if (next) onMove(deal.id, next.key)
}

function stageLabel(stage: PipelineStage) {
  return STAGES.find((item) => item.key === stage)?.label ?? stage
}

function getWelcomeProfile(role?: string) {
  const normalized = String(role ?? '').toLowerCase()
  if (['agent', 'broker', 'senior_agent', 'sales', 'sales_manager'].some((item) => normalized.includes(item))) {
    return {
      title: 'Welcome back, Champion! 🏆',
      message: "Let's break some records and close high-value deals today. Your pipeline is live and ready.",
    }
  }
  if (['client', 'buyer', 'customer'].some((item) => normalized.includes(item))) {
    return {
      title: 'Welcome to your Investment Portal.',
      message: "Let's build your future with confidence. Track your investment journey in real time.",
    }
  }
  if (['partner', 'company', 'broker_company'].some((item) => normalized.includes(item))) {
    return {
      title: 'Welcome to FAST INVESTMENT, Partner.',
      message:
        'Together we drive exponential growth. Here is your current pipeline and performance overview.',
    }
  }
  return {
    title: 'Fast Investment Command Center',
    message: 'Real-time strategic insights across every sales motion. Make data-driven decisions.',
  }
}

function daysInStage(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
  return `${days}d`
}

function withinDateFilter(value: string | null, filter: string) {
  if (!value) return false
  const date = new Date(value)
  const now = new Date()
  const diffDays = (date.getTime() - now.getTime()) / 86400000
  if (filter === 'week') return diffDays >= 0 && diffDays <= 7
  if (filter === 'month')
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  if (filter === 'quarter') return diffDays >= 0 && diffDays <= 90
  return true
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('') || 'FI'
  )
}

function formatMoney(value: number) {
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value / 1_000_000)}M EGP`
  }
  if (value >= 1_000) {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value / 1_000)}K EGP`
  }
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} EGP`
}
