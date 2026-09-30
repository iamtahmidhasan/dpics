'use client'

import { motion, useInView } from 'framer-motion'
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

const EVENTS = [
  {
    id: 1,
    title: 'Intro to Competitive Programming',
    date: 'Oct 15, 2026',
    time: '3:00 PM',
    location: 'CS Lab – Room 301',
    seats: 40,
    enrolled: 38,
    status: 'upcoming',
    tag: 'Workshop',
    tagVariant: 'success' as const,
    description:
      'A beginner-friendly session on competitive programming fundamentals, Codeforces setup, and solving your first rated problems.',
  },
  {
    id: 2,
    title: 'DPI CS Hackathon 2026',
    date: 'Nov 1–2, 2026',
    time: 'All Day',
    location: 'Main Auditorium',
    seats: 80,
    enrolled: 60,
    status: 'upcoming',
    tag: 'Hackathon',
    tagVariant: 'warning' as const,
    description:
      '24-hour hackathon where teams of 3–5 compete to build innovative solutions to real-world problems.',
  },
  {
    id: 3,
    title: 'Web Dev Bootcamp – React & Next.js',
    date: 'Nov 10–11, 2026',
    time: '10:00 AM',
    location: 'CS Lab – Room 302',
    seats: 30,
    enrolled: 30,
    status: 'full',
    tag: 'Bootcamp',
    tagVariant: 'default' as const,
    description:
      'An intensive 2-day weekend bootcamp covering React fundamentals, component design, and building full-stack apps with Next.js.',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export function EventsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

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
              Upcoming Events
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Don&apos;t miss what&apos;s{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                coming up
              </span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Workshops, competitions, and bootcamps to keep you sharp all semester.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/events" />}
            className="shrink-0 gap-1.5"
          >
            View All Events
            <ChevronRight className="size-4" />
          </Button>
        </motion.div>

        {/* Event cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid gap-4 md:grid-cols-3"
        >
          {EVENTS.map((event) => (
            <motion.div key={event.id} variants={itemVariants}>
              <Card className="group h-full cursor-pointer border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={event.tagVariant} className="rounded-full px-2.5 py-0.5">
                      {event.tag}
                    </Badge>
                    {event.status === 'full' && (
                      <Badge variant="destructive" className="rounded-full px-2.5 py-0.5">
                        Full
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-base font-semibold leading-snug text-foreground">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 shrink-0 text-primary" />
                    <span>
                      {event.date} · {event.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="size-3.5 shrink-0 text-primary" />
                      <span>
                        {event.enrolled}/{event.seats} enrolled
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(event.enrolled / event.seats) * 100}%` }}
                      />
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
