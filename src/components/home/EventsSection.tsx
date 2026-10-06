'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import { Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { EventCard } from '@/components/events/event-card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import type { EventSummary } from '@/lib/services/event.service'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
} satisfies Variants

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
} satisfies Variants

export function EventsSection({ events = [] }: { events?: EventSummary[] }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { t, lang } = useLanguage()

  return (
    <section className="bg-background py-24" id="events">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <span className="mb-3 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {t({ en: "Upcoming Events", bn: "আসন্ন ইভেন্টসমূহ" })}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t({ en: "Don't miss what's", bn: "যুক্ত হোন আমাদের" })}{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                {t({ en: "coming up", bn: "আগামী আয়োজনে" })}
              </span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {t({
                en: "Workshops, competitions, and bootcamps to keep you sharp all semester.",
                bn: "ওয়ার্কশপ, প্রোগ্রামিং প্রতিযোগিতা এবং বুটক্যাম্পের মাধ্যমে নিজের দক্ষতা বৃদ্ধি করুন।",
              })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/events" />}
            className="shrink-0 gap-1.5"
          >
            {t({ en: "View All Events", bn: "সকল ইভেন্ট দেখুন" })}
            <ChevronRight className="size-4" />
          </Button>
        </motion.div>

        {/* Event cards */}
        {events.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            className="grid gap-6 md:grid-cols-3"
          >
            {events.map((event) => (
              <motion.div key={event.id} variants={itemVariants}>
                <EventCard event={event} lang={lang} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Calendar className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {t({
                en: "New events will be announced soon!",
                bn: "শীঘ্রই নতুন ইভেন্টের ঘোষণা আসছে!",
              })}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {t({
                en: "Stay connected with DPI Computing Society for upcoming hackathons and workshops.",
                bn: "আসন্ন হ্যাকাথন ও কর্মশালার আপডেটের জন্য ডিপিআই কম্পিউটিং সোসাইটির সাথে যুক্ত থাকুন।",
              })}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
