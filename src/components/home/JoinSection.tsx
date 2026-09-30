'use client'

import { motion, useInView } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'

const STEPS = [
  { step: '01', title: 'Create Account', desc: 'Sign up with your student email in under 2 minutes.' },
  { step: '02', title: 'Complete Profile', desc: 'Add your batch info, interests, and upload a photo.' },
  { step: '03', title: 'Pay Registration Fee', desc: 'Secure your spot with a one-time nominal fee via bKash or Nagad.' },
  { step: '04', title: 'Get Your Member ID', desc: 'Receive your auto-generated DPICS student ID and join the community!' },
]

export function JoinSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative overflow-hidden bg-background py-24" id="join">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-emerald-400/6 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — Steps */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mb-3 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              How to Join
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Become a member{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                in minutes
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Our streamlined onboarding gets you from sign-up to full member status quickly,
              so you can focus on what matters — learning and building.
            </p>

            {/* Steps */}
            <div className="mt-10 flex flex-col gap-6">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — CTA card */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 dark:shadow-black/20"
          >
            {/* Card top gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-400 to-primary" />

            <div className="flex flex-col gap-6 p-8">
              <div>
                <h3 className="text-xl font-bold text-foreground">Ready to join?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  DPICS membership gives you access to all workshops, events, resources, and our
                  private learning community. Limited spots per batch.
                </p>
              </div>

              {/* Perks */}
              <ul className="flex flex-col gap-3">
                {[
                  'Access to all workshops & bootcamps',
                  'Exclusive learning resources & notes',
                  'Participate in inter-department competitions',
                  'Official DPICS Student ID',
                  'Mentorship from senior members',
                  'Certificate of active participation',
                ].map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/sign-up" />}
                  className="group flex-1 gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20"
                >
                  Sign Up Now
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/about#membership" />}
                  className="rounded-xl"
                >
                  Learn More
                </Button>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Already a member?{' '}
                <Link href="/sign-in" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
