'use client'

import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const columnStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
}

const columnFade = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 240, damping: 22 } },
}

export default function PipelineLoading() {
  return (
    <main className="sales-command p-4 sm:p-6" dir="ltr">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {/* Hero skeleton */}
        <motion.section variants={fadeUp} className="sales-hero rounded-3xl p-6 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
            <div className="space-y-4">
              <div className="sales-skeleton h-7 w-52 rounded-full bg-white/20" />
              <div className="sales-skeleton h-10 w-3/4 bg-white/20" />
              <div className="sales-skeleton h-5 w-2/3 bg-white/20" />
              <div className="sales-skeleton h-9 w-44 rounded-full bg-white/20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4">
                <div className="sales-skeleton h-3 w-20 bg-white/20" />
                <div className="sales-skeleton mt-4 h-9 w-16 bg-white/20" />
              </div>
              <div className="rounded-2xl border border-white/[0.12] bg-white/[0.08] p-4">
                <div className="sales-skeleton h-3 w-24 bg-white/20" />
                <div className="sales-skeleton mt-4 h-8 w-28 bg-white/20" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Control card skeleton */}
        <motion.section
          variants={fadeUp}
          className="sales-card rounded-3xl border border-[var(--fi-line)] bg-white p-5"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="sales-skeleton h-6 w-32 rounded-full" />
              <div className="sales-skeleton h-8 w-56" />
              <div className="sales-skeleton h-4 w-80" />
            </div>
            <div className="sales-skeleton h-11 w-32 rounded-2xl" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--fi-line)] p-4">
                <div className="sales-skeleton h-3 w-20" />
                <div className="sales-skeleton mt-4 h-8 w-28" />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Kanban columns skeleton */}
        <motion.section variants={columnStagger} className="flex gap-3 overflow-hidden pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              variants={columnFade}
              className="sales-stage-column h-[520px] w-[310px] shrink-0 rounded-3xl border border-[var(--fi-line)] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="sales-skeleton size-2.5 rounded-full" />
                  <div className="sales-skeleton h-5 w-24" />
                </div>
                <div className="sales-skeleton h-5 w-8 rounded-full" />
              </div>
              <div className="sales-skeleton mt-1 h-3 w-28" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: i < 2 ? 3 : 2 }).map((_, j) => (
                  <div key={j} className="sales-skeleton h-[110px] w-full rounded-2xl" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.section>
      </motion.div>
    </main>
  )
}
