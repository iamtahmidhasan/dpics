'use client'

import { motion, useInView } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useRef } from 'react'

import { Card, CardContent } from '@/components/ui/card'

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Md. Rakib Hasan',
    role: 'Member · Batch 22',
    studentId: 'DPICS22-0034',
    quote:
      'Joining DPICS was the best decision of my polytechnic life. The workshops pushed me from "Hello World" to building full-stack apps in just two semesters.',
    initials: 'RH',
    color: 'bg-emerald-500',
  },
  {
    id: 2,
    name: 'Fatema Akter',
    role: 'Member · Batch 23',
    studentId: 'DPICS23-0011',
    quote:
      'I placed 3rd in the DPI Hackathon 2025 thanks to the competitive programming sessions. This community genuinely invests in your growth.',
    initials: 'FA',
    color: 'bg-violet-500',
  },
  {
    id: 3,
    name: 'Sabbir Ahmed',
    role: 'Member · Batch 22',
    studentId: 'DPICS22-0007',
    quote:
      'The peer mentorship program connected me with seniors who guided my first open-source contribution. The culture here is incredibly supportive.',
    initials: 'SA',
    color: 'bg-blue-500',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export function TestimonialsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative overflow-hidden bg-muted/30 py-24" id="testimonials">
      {/* Subtle gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Member Stories
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hear from our{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              community
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Real stories from real members who transformed their skills through DPICS.
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div key={testimonial.id} variants={itemVariants}>
              <Card className="relative h-full border-border/50 bg-card">
                <CardContent className="flex h-full flex-col gap-4 pt-6">
                  {/* Quote icon */}
                  <Quote className="size-8 text-primary/20" />

                  {/* Quote text */}
                  <p className="flex-1 text-sm leading-relaxed text-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${testimonial.color} text-sm font-bold text-white`}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-primary/70">
                        {testimonial.studentId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
