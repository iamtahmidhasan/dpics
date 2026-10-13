'use client'

import { motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { HeroHighlight, HeroRecentMember, HeroStats } from '@/lib/services/home.service'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
} satisfies Variants

function getInitials(name: string): string {
  if (!name) return 'DP'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface HeroSectionProps {
  stats?: HeroStats | null
  recentMembers?: HeroRecentMember[]
  highlight?: HeroHighlight | null
}

export function HeroSection({
  stats,
  recentMembers = [],
  highlight,
}: HeroSectionProps) {
  // Extract and format dynamic stats with graceful fallbacks
  const activeMembersCount = stats?.activeMembers ?? 0
  const totalCommunityCount = stats?.totalCommunity ?? 0
  const batchesCount = stats?.batchesCount ?? 0
  const eventsCount = stats?.eventsCount ?? 0
  const postsCount = stats?.postsCount ?? 0
  const achievementsCount = stats?.achievementsCount ?? 0

  const displayMembers =
    activeMembersCount > 0
      ? `${activeMembersCount}+`
      : totalCommunityCount > 0
        ? `${totalCommunityCount}+`
        : '200+'

  const displayBatches = batchesCount > 0 ? `${batchesCount}+` : '5+'

  const displayEvents = eventsCount > 0 ? `${eventsCount}+` : '30+'

  const displayContent =
    postsCount > 0
      ? `${postsCount}+`
      : achievementsCount > 0
        ? `${achievementsCount}+`
        : '15+'

  const batchSublabel =
    stats?.batches && stats.batches.length > 0
      ? `Sessions ${stats.batches.slice(0, 2).join(', ')}...`
      : 'Polytechnic batches'

  const statItems = [
    {
      value: displayMembers,
      label: 'Active Members',
      sublabel: totalCommunityCount > 0 ? `${totalCommunityCount} registered` : 'Verified students',
      icon: <Users className="size-4 text-primary" />,
    },
    {
      value: displayBatches,
      label: 'Batches Enrolled',
      sublabel: batchSublabel,
      icon: <GraduationCap className="size-4 text-emerald-500" />,
    },
    {
      value: displayEvents,
      label: 'Events Hosted',
      sublabel: 'Workshops & seminars',
      icon: <Calendar className="size-4 text-primary" />,
    },
    {
      value: displayContent,
      label: 'Tech Publications',
      sublabel: 'Guides & write-ups',
      icon: <BookOpen className="size-4 text-amber-500" />,
    },
  ]

  const totalMembersCount = activeMembersCount || totalCommunityCount || 25

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-28 lg:py-32">
      {/* Background ambient radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/20 to-emerald-400/20 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col items-center text-center">

          {/* Dynamic Top Badge / Pill — Live from DB or default */}
          {highlight ? (
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-6"
            >
              <Link
                href={highlight.href}
                className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-2 text-xs font-medium text-foreground shadow-xs backdrop-blur-md transition-all hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                  {highlight.type === 'EVENT' ? 'Upcoming Event' : 'Latest Story'}
                </span>
                <span className="max-w-[210px] truncate font-medium text-muted-foreground group-hover:text-foreground sm:max-w-xs">
                  {highlight.title}
                </span>
                <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </motion.div>
          ) : (
            <motion.span
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm"
            >
              <Sparkles className="size-3" />
              DPI Computing Society
              {batchesCount > 0 ? (
                <span className="text-muted-foreground">· {batchesCount} Batches Active</span>
              ) : null}
            </motion.span>
          )}

          {/* Headline */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
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
            className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground sm:text-base md:text-lg"
          >
            The official tech community of Dhaka Polytechnic Institute — empowering students
            through workshops, competitions, and collaborative projects.
          </motion.p>

          {/* Dynamic Social Proof Pile (Real Member Avatars from Database) */}
          {recentMembers.length > 0 ? (
            <motion.div
              custom={2.5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
            >
              <div className="flex -space-x-2 overflow-hidden p-0.5">
                {recentMembers.slice(0, 5).map((member) => (
                  <Link
                    key={member.id}
                    href={member.slug ? `/profile/${member.slug}` : '/members'}
                    title={member.name}
                    className="group relative inline-block transition-transform hover:z-20 hover:scale-110"
                  >
                    <Avatar className="size-7 h-7 w-7 shrink-0 rounded-full border border-border/80 ring-2 ring-background transition-all group-hover:ring-primary">
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} className="size-full object-cover" />
                      ) : null}
                      <AvatarFallback className="size-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ))}
              </div>
              <Link
                href="/members"
                className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>
                  Joined by{' '}
                  <strong className="font-semibold text-foreground">
                    {totalMembersCount}+
                  </strong>{' '}
                  student developers
                  {batchesCount > 0 ? (
                    <span className="hidden sm:inline"> across {batchesCount} batches</span>
                  ) : null}
                </span>
                <ArrowRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </motion.div>
          ) : null}

          {/* CTA buttons */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/join" />}
              className="group gap-2 shadow-sm"
            >
              Join the Society
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/members" />}
            >
              Explore Members
            </Button>
          </motion.div>

          {/* Dynamic Stats Grid — Computed from Database */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 sm:mt-20 md:mt-24 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5"
          >
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/60 p-5 text-center shadow-2xs backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-xs hover:-translate-y-0.5 sm:p-6"
              >
                <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                  {stat.icon}
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-medium text-foreground/90 sm:text-sm">
                  {stat.label}
                </span>
                <span className="mt-0.5 max-w-[150px] truncate text-[11px] text-muted-foreground">
                  {stat.sublabel}
                </span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
