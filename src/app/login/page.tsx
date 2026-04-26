'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, BadgeCheck, Building2,
  Eye, EyeOff, Lock, Mail, Sparkles, TrendingUp, Users, Zap,
} from 'lucide-react'
import { loginAction } from './actions'
import { stagger, fadeUp, slideInLeft, slideInRight, buttonMotion, float, floatSlow, pulse } from '@/lib/motion'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorState, setErrorState] = useState<{ message: string; details: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorState(null)
    try {
      const result = await loginAction(new FormData(event.currentTarget))
      if (result && !result.success) {
        setErrorState({ message: result.message, details: result.details })
        setLoading(false)
      }
    } catch (err: unknown) {
      const redirect = err as { digest?: string; message?: string }
      if (redirect.digest?.startsWith('NEXT_REDIRECT') || redirect.message === 'NEXT_REDIRECT') throw err
      setErrorState({ message: 'Connection error — please try again', details: redirect.message ?? 'Unknown error' })
      setLoading(false)
    }
  }

  return (
    <div className="fi-login-root min-h-screen overflow-hidden" dir="ltr">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full opacity-30"
          // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ background: 'radial-gradient(circle, #2563eb44 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full opacity-25"
          // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ background: 'radial-gradient(circle, #10b98144 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute left-1/2 top-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-15"
          // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ background: 'radial-gradient(circle, #8b5cf644 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">

        {/* ── LEFT HERO PANEL ─────────────────────────────────── */}
        <motion.section
          variants={slideInLeft}
          initial="hidden"
          animate="show"
          className="fi-login-hero relative flex flex-col justify-between overflow-hidden p-8 text-white lg:w-[58%] lg:p-14"
        >
          {/* Hero grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            // eslint-disable-next-line no-inline-styles/no-inline-styles
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

          {/* Floating icons */}
          <motion.div variants={float} animate="animate" className="absolute right-12 top-24 opacity-20">
            <Building2 className="size-20 text-white" />
          </motion.div>
          {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
          <motion.div variants={floatSlow} animate="animate" className="absolute bottom-32 right-32 opacity-15" style={{ animationDelay: '1.5s' }}>
            <TrendingUp className="size-14 text-emerald-300" />
          </motion.div>
          {/* eslint-disable-next-line no-inline-styles/no-inline-styles */}
          <motion.div variants={float} animate="animate" className="absolute bottom-64 left-8 opacity-15" style={{ animationDelay: '3s' }}>
            <Sparkles className="size-10 text-blue-300" />
          </motion.div>

          {/* Logo */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative z-10">
            <Link href="/marketplace" className="inline-flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl"
                // eslint-disable-next-line no-inline-styles/no-inline-styles
              style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}>
                <Building2 className="size-5 text-white" />
              </span>
              <div>
                <p className="text-base font-black tracking-wide">FAST INVESTMENT</p>
                <p className="text-[11px] font-bold text-white/40">Real Estate Command Platform</p>
              </div>
            </Link>
          </motion.div>

          {/* Hero content */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 mt-auto pb-4">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                <motion.span variants={pulse} animate="animate" className="size-2 rounded-full bg-emerald-400" />
                Live Platform · All Departments Connected
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="mt-6 max-w-xl text-4xl font-black leading-[1.12] lg:text-5xl">
              Your Real Estate
              <span className="block bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
                Command Center.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 max-w-md text-base font-semibold leading-8 text-white/65">
              Manage clients, deals, partners, and inventory from one intelligent workspace — built for Egypt's fastest-growing real estate teams.
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeUp} className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, value: '500+', label: 'Active Deals' },
                { icon: Users, value: '200+', label: 'Partners' },
                { icon: Zap, value: 'Live', label: 'Real-time Sync' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <Icon className="mb-2 size-4 text-emerald-300" />
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-white/50">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* Trust chips */}
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
              {['🔒 SSL Secured', '✓ Enterprise RBAC', '⚡ Realtime Updates'].map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/60">
                  {chip}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom badges */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.5 }}
            className="relative z-10 mt-8 flex gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <BadgeCheck className="size-4 text-emerald-300" />
              <span className="text-[11px] font-black text-white/70">Verified Platform</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <Sparkles className="size-4 text-blue-300" />
              <span className="text-[11px] font-black text-white/70">AI-Powered CRM</span>
            </div>
          </motion.div>
        </motion.section>

        {/* ── RIGHT FORM PANEL ────────────────────────────────── */}
        <motion.section
          variants={slideInRight}
          initial="hidden"
          animate="show"
          className="flex min-h-screen items-center justify-center bg-[#f2f7ff] p-6 lg:min-h-0 lg:w-[42%] lg:p-10"
        >
          <div className="w-full max-w-md">
            {/* Form card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
              className="fi-login-card rounded-3xl p-8"
            >
              <div className="mb-7">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">Secure Access</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">Sign In</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Enter your credentials to access your workspace.
                </p>
              </div>

              {/* Error state */}
              <AnimatePresence>
                {errorState && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
                    role="alert"
                  >
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-red-700">{errorState.message}</p>
                      <p className="mt-1 break-words text-xs font-semibold text-red-400" dir="ltr">{errorState.details}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email */}
                <FloatInput
                  id="login-email"
                  name="email"
                  type="email"
                  label="Email Address"
                  icon={<Mail className="size-4" />}
                  autoComplete="email"
                  required
                  dir="ltr"
                />

                {/* Password */}
                <div className="relative">
                  <FloatInput
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    icon={<Lock className="size-4" />}
                    autoComplete="current-password"
                    required
                    dir="ltr"
                    paddingRight
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs font-black text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  {...buttonMotion}
                  className="fi-cta-btn mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:opacity-60"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="size-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-bold text-slate-400">New to FAST INVESTMENT?</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Register options */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/register?role=client"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600">
                  <Users className="size-3.5" />
                  New Client
                </Link>
                <Link href="/register?role=partner"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-3 text-xs font-black text-amber-700 transition hover:border-amber-400">
                  <BadgeCheck className="size-3.5" />
                  Join as Partner
                </Link>
              </div>
            </motion.div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs font-semibold text-slate-400">
              © 2026 FAST INVESTMENT · All rights reserved
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

/* ─── FloatInput component ─────────────────────────────── */
function FloatInput({
  id, name, type, label, icon, autoComplete, required, dir, paddingRight,
}: {
  id: string; name: string; type: string; label: string; icon: React.ReactNode
  autoComplete?: string; required?: boolean; dir?: string; paddingRight?: boolean
}) {
  return (
    <div className="fi-float-wrap">
      <span className="fi-float-icon">{icon}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        dir={dir}
        placeholder=" "
        className={`fi-float-input ${paddingRight ? 'pr-12' : ''}`}
      />
      <label htmlFor={id} className="fi-float-label">{label}</label>
    </div>
  )
}
