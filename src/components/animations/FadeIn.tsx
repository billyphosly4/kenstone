import {
  m,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

const motionElements = {
  article: m.article,
  div: m.div,
  li: m.li,
  ol: m.ol,
  p: m.p,
} as const

type AnimatedElement = keyof typeof motionElements
type AnimationTrigger = 'mount' | 'parent' | 'scroll'

interface FadeInProps {
  as?: AnimatedElement
  amount?: number
  children: ReactNode
  className?: string
  delay?: number
  delayChildren?: number
  duration?: number
  id?: string
  once?: boolean
  staggerChildren?: number
  style?: CSSProperties
  trigger?: AnimationTrigger
  y?: number
}

export default function FadeIn({
  as = 'div',
  amount = 0.18,
  children,
  className,
  delay = 0,
  delayChildren = 0,
  duration = 0.55,
  id,
  once = true,
  staggerChildren,
  style,
  trigger = 'scroll',
  y = 18,
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion() ?? false
  const MotionElement = motionElements[as]

  const variants: Variants = {
    hidden: {
      opacity: shouldReduceMotion ? 1 : 0,
      y: shouldReduceMotion ? 0 : y,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        ease: 'easeOut',
        delay: shouldReduceMotion ? 0 : delay,
        ...(staggerChildren === undefined
          ? {}
          : {
              staggerChildren: shouldReduceMotion ? 0 : staggerChildren,
              delayChildren: shouldReduceMotion ? 0 : delayChildren,
            }),
      },
    },
  }

  return (
    <MotionElement
      className={className}
      id={id}
      style={style}
      variants={variants}
      initial={trigger === 'parent' ? undefined : 'hidden'}
      animate={trigger === 'mount' ? 'visible' : undefined}
      whileInView={trigger === 'scroll' ? 'visible' : undefined}
      viewport={trigger === 'scroll' ? { once, amount } : undefined}
    >
      {children}
    </MotionElement>
  )
}
