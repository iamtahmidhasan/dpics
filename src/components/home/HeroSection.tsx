'use client'

import { motion, type Variants } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
} satisfies Variants

const STATS = [
  { value: '200+', label: 'Active Members' },
  { value: '30+', label: 'Events Hosted' },
  { value: '5+', label: 'Batches Enrolled' },
  { value: '100%', label: 'Passion Driven' },
]

export function HeroSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center text-center">

          {/* Pill label — same as "What We Offer" */}
          <motion.span
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
          >
            DPI Computing Society
          </motion.span>

          {/* Headline */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            Learn, build, and{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              grow together
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base"
          >
            The official tech community of Dhaka Polytechnic Institute — empowering students
            through workshops, competitions, and collaborative projects.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/sign-up" />}
              className="group gap-2"
            >
              Join the Society
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/events" />}
            >
              Explore Events
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 bg-background px-8 py-5"
              >
                <span className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
