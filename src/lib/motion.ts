import type { Variants, Transition } from 'framer-motion'

/* ─── Spring presets ─────────────────────────────────── */
export const spring: Transition = { type: 'spring', stiffness: 300, damping: 24 }
export const springBouncy: Transition = { type: 'spring', stiffness: 380, damping: 20 }
export const springSmooth: Transition = { type: 'spring', stiffness: 220, damping: 28 }

/* ─── Page / section variants ─────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  show: { opacity: 1, x: 0, transition: spring },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: spring },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.90 },
  show: { opacity: 1, scale: 1, transition: springBouncy },
}

/* ─── Stagger containers ──────────────────────────────── */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

export const staggerSlow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
}

/* ─── Interactive button props ────────────────────────── */
export const buttonMotion = {
  whileHover: { scale: 1.03, transition: springBouncy },
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
}

export const cardMotion = {
  whileHover: { y: -4, scale: 1.015, transition: springSmooth },
  whileTap: { scale: 0.98 },
}

/* ─── Floating / looping ──────────────────────────────── */
export const float: Variants = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const floatSlow: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const pulse: Variants = {
  animate: {
    opacity: [1, 0.35, 1],
    scale: [1, 0.88, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

/* ─── Sheet / drawer ──────────────────────────────────── */
export const sheetContent: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { delay: 0.06, ...spring } },
}

/* ─── Hero word reveal ────────────────────────────────── */
export const heroWord: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...spring, duration: 0.6 } },
}
