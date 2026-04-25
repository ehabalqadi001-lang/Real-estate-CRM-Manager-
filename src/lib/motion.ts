import type { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 25 } },
}

export const cardHover = {
  rest:  { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.015, transition: { type: 'spring', stiffness: 400, damping: 20 } },
}

export const buttonTap = {
  whileHover: { scale: 1.03 },
  whileTap:   { scale: 0.96 },
}

export const floatingLoop: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

// Aliases and additional variants for Login/Register pages
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
}

export const float = floatingLoop

export const floatSlow: Variants = {
  animate: {
    y: [0, -15, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const pulse: Variants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [0.8, 1, 0.8],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const stagger = staggerContainer
export const buttonMotion = buttonTap
export const cardMotion = cardHover