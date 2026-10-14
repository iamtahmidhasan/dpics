'use client'

import { motion, type Variants } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Code2,
  GraduationCap,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import LaserFlow from '@/components/LaserFlow'
import type { HeroHighlight, HeroRecentMember, HeroStats } from '@/lib/services/home.service'
import { cn } from '@/lib/utils'

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

// Laser color palette options
const LASER_PALETTES = [
  { name: 'Emerald', hex: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Cyan', hex: '#06b6d4', ring: 'ring-cyan-500' },
  { name: 'Indigo', hex: '#6366f1', ring: 'ring-indigo-500' },
  { name: 'Solar', hex: '#f59e0b', ring: 'ring-amber-500' },
]

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
  // Laser beam target surface reference
  const cardRef = React.useRef<HTMLDivElement>(null)

  // Interactive tab and laser color state
  const [activeTab, setActiveTab] = React.useState<'metrics' | 'highlight' | 'terminal'>('metrics')
  const [laserColor, setLaserColor] = React.useState<string>('#10b981')

  // Balanced laser beam position (0.58) — distributes light harmoniously across both sides
  const FIXED_BEAM_POSITION = 0.58
  const [currentBeam] = React.useState<number>(FIXED_BEAM_POSITION)

  // Map active tab without moving the laser beam
  const handleTabChange = (tab: 'metrics' | 'highlight' | 'terminal') => {
    setActiveTab(tab)
  }

  // Format stats with sensible dynamic fallbacks
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
      badge: 'Verified',
      icon: <Users className="size-4 text-emerald-400" />,
      glowColor: 'from-emerald-500/10 to-transparent',
    },
    {
      value: displayBatches,
      label: 'Batches Enrolled',
      sublabel: batchSublabel,
      badge: 'All Semesters',
      icon: <GraduationCap className="size-4 text-teal-400" />,
      glowColor: 'from-teal-500/10 to-transparent',
    },
    {
      value: displayEvents,
      label: 'Events Hosted',
      sublabel: 'Workshops & hackathons',
      badge: 'Hands-on',
      icon: <Calendar className="size-4 text-cyan-400" />,
      glowColor: 'from-cyan-500/10 to-transparent',
    },
    {
      value: displayContent,
      label: 'Tech Publications',
      sublabel: 'Guides & write-ups',
      badge: 'Open Source',
      icon: <BookOpen className="size-4 text-amber-400" />,
      glowColor: 'from-amber-500/10 to-transparent',
    },
  ]

  const totalMembersCount = activeMembersCount || totalCommunityCount || 200

  return (
    // Explicit 'dark' class and dark styling scoped exclusively to this section
    <section
      className="dark relative overflow-hidden bg-[#07090e] text-white pt-20 pb-24 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-36"
      style={{ backgroundColor: '#07090e', colorScheme: 'dark' }}
    >
      {/* LaserFlow WebGL Background Simulation with deep bottom mask */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, black 35%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.2) 75%, transparent 92%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 35%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.2) 75%, transparent 92%)',
        }}
      >
        <LaserFlow
          surfaceRef={cardRef}
          beamPosition={currentBeam}
          color={laserColor}
          intensity={1.8}
          beamWidth={1.35}
          flare={1.5}
          spread={1.65}
          spill={1.3}
          fog={0.25}
          dust={1.6}
          streaks={1.5}
          dots={1.0}
          pulse={1.4}
          speed={1.4}
          mouseInteraction={true}
          theme="dark"
        />
      </div>

      {/* Cyber Grid & Ambient Radial Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_60%,transparent_100%)] opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl opacity-70"
      />

      {/* Deep bottom fade-up overlay with extended multi-stop depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 sm:h-96 md:h-[460px] bg-gradient-to-t from-[#07090e] from-20% via-[#07090e]/85 via-50% via-[#07090e]/30 via-80% to-transparent z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36 sm:h-52 bg-gradient-to-t from-[#07090e] to-transparent z-10 opacity-80"
      />

      {/* Foreground Hero Content */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col items-center text-center">

          {/* Dynamic Top Badge / Live Announcement Pill */}
          {highlight ? (
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-6"
            >
            </motion.div>
          ) : (
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md shadow-xs">
                <span>Dhaka Polytechnic Institute Computing Society</span>
                {batchesCount > 0 ? (
                  <span className="text-slate-400 hidden sm:inline">· {batchesCount} Active Batches</span>
                ) : null}
              </span>
            </motion.div>
          )}

          {/* Headline - Creative, attractive, minimal sentence, strictly white text */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
          >
            Engineering tomorrow’s software frontier.
          </motion.h1>

          {/* Subtext - Creative, attractive, minimal sentence, strictly white text */}
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-3.5 max-w-lg text-xs font-normal text-white sm:text-sm md:text-base"
          >
            Dhaka Polytechnic Institute’s premier launchpad for software craftsmanship and competitive engineering.
          </motion.p>

          {/* Dynamic Social Proof Pile (Real Member Avatars from Database) */}
          {recentMembers.length > 0 ? (
            <motion.div
              custom={2.5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-7 flex flex-wrap items-center justify-center gap-3.5"
            >
              <div className="flex -space-x-2 overflow-hidden p-0.5">
                {recentMembers.slice(0, 5).map((member) => (
                  <Link
                    key={member.id}
                    href={member.slug ? `/profile/${member.slug}` : '/members'}
                    title={member.name}
                    className="group relative inline-block transition-transform hover:z-20 hover:scale-110"
                  >
                    <Avatar className="size-7 h-7 w-7 shrink-0 rounded-full border border-white/10 ring-2 ring-[#07090e] transition-all group-hover:ring-emerald-400">
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} className="size-full object-cover" />
                      ) : null}
                      <AvatarFallback className="size-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-400">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ))}
              </div>
              <Link
                href="/members"
                className="group inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"
              >
                <span>
                  Joined by{' '}
                  <strong className="font-semibold text-white">
                    {totalMembersCount}+
                  </strong>{' '}
                  student developers
                  {batchesCount > 0 ? (
                    <span className="hidden sm:inline"> across {batchesCount} batches</span>
                  ) : null}
                </span>
                <ArrowRight className="size-3 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              </Link>
            </motion.div>
          ) : null}

          {/* CTA Buttons */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/join" />}
              className="group h-11 px-6 rounded-xl font-semibold gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02] transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Join the Society
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/members" />}
              className="h-11 px-6 rounded-xl font-semibold border-white/15 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md transition-all"
            >
              Explore Members
            </Button>
            <Button
              variant="ghost"
              size="lg"
              nativeButton={false}
              render={<Link href="/events" />}
              className="h-11 px-5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all gap-1.5"
            >
              <Calendar className="size-4 text-emerald-400" />
              Upcoming Events
            </Button>
          </motion.div>

          {/* THE SHOWCASE COMMAND DECK (Surface Target for LaserFlow) */}
          <motion.div
            ref={cardRef}
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            style={{ backgroundColor: '#0c0e14' }}
            className="relative mx-auto mt-12 sm:mt-16 w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0c0e14]/90 shadow-2xl backdrop-blur-2xl transition-all duration-300 p-5 sm:p-7 md:p-8 text-left"
          >
            {/* Top specular glow line matching the laser impact */}
            <div className="pointer-events-none absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />

            {/* Console Window Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              {/* Window Controls & Command Label */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-[#ff5f56]/90" />
                  <span className="size-3 rounded-full bg-[#ffbd2e]/90" />
                  <span className="size-3 rounded-full bg-[#27c93f]/90" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                  <Terminal className="size-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">dpics:</span>
                  <span className="font-semibold text-slate-200">~/command-center</span>
                </div>
              </div>

              {/* Interactive Navigation Tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => handleTabChange('metrics')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all',
                    activeTab === 'metrics'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Activity className="size-3.5" />
                  <span>Metrics</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('highlight')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all',
                    activeTab === 'highlight'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Sparkles className="size-3.5" />
                  <span>Highlight</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('terminal')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all',
                    activeTab === 'terminal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Code2 className="size-3.5" />
                  <span className="hidden sm:inline">Polytechnic</span> CLI
                </button>
              </div>

              {/* Laser Color Palette Switcher & Live Status */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 mr-1">Laser:</span>
                  {LASER_PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      type="button"
                      title={`${palette.name} laser`}
                      onClick={() => setLaserColor(palette.hex)}
                      className={cn(
                        'size-3.5 rounded-full transition-transform hover:scale-125 focus:outline-none',
                        laserColor === palette.hex ? `ring-2 ring-offset-2 ring-offset-[#0c0e14] ${palette.ring} scale-110` : 'opacity-70'
                      )}
                      style={{ backgroundColor: palette.hex }}
                    />
                  ))}
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                  </span>
                  <span>Systems Online</span>
                </div>
              </div>
            </div>

            {/* TAB CONTENT 1: Metrics & Dynamic KPIs */}
            {activeTab === 'metrics' && (
              <div className="pt-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
                  {statItems.map((stat) => (
                    <div
                      key={stat.label}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left shadow-2xs backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-white/[0.06] hover:shadow-md hover:-translate-y-0.5 sm:p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 transition-colors group-hover:bg-emerald-500/25">
                          {stat.icon}
                        </div>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {stat.badge}
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                          {stat.value}
                        </span>
                        <div className="mt-1 text-xs font-semibold text-slate-200 sm:text-sm">
                          {stat.label}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {stat.sublabel}
                        </p>
                      </div>

                      {/* Ambient hover glow inside card */}
                      <div
                        className={cn(
                          'pointer-events-none absolute -right-6 -bottom-6 size-20 rounded-full blur-xl transition-opacity opacity-0 group-hover:opacity-100 bg-gradient-to-br',
                          stat.glowColor
                        )}
                      />
                    </div>
                  ))}
                </div>

                {/* Footer Strip inside the Command Deck */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span>
                      Official departmental clubs: Computer, Electrical, Electronics, Telecommunication & Civil.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/achievements"
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-white"
                    >
                      <span>Achievements</span>
                      <ChevronRight className="size-3" />
                    </Link>
                    <span className="text-slate-600">•</span>
                    <Link
                      href="/members"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 transition-colors hover:underline"
                    >
                      <span>Member Directory</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Featured Highlight */}
            {activeTab === 'highlight' && (
              <div className="pt-6">
                {highlight ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-left">
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                        <Sparkles className="size-3.5" />
                        {highlight.type === 'EVENT' ? 'Upcoming Society Event' : 'Featured Story'}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {highlight.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300">
                        Dhaka Polytechnic Institute Campus Auditorium & Online Virtual Stream. Open to all registered students.
                      </p>
                    </div>

                    <Button
                      size="lg"
                      nativeButton={false}
                      render={<Link href={highlight.href} />}
                      className="shrink-0 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <span>View Details</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                        <Zap className="size-3.5" />
                        Next Semester Hackathons & Workshops
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        Competitive Programming & Full-Stack Engineering Sprints
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300">
                        Weekly hands-on labs, problem solving in C/C++/Python, web application architecture, and team hackathon incubations.
                      </p>
                    </div>

                    <Button
                      size="lg"
                      nativeButton={false}
                      render={<Link href="/events" />}
                      className="shrink-0 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <span>View Schedule</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Polytechnic Terminal CLI */}
            {activeTab === 'terminal' && (
              <div className="pt-6">
                <div className="rounded-2xl border border-white/10 bg-[#06080d] p-5 font-mono text-xs sm:text-sm text-left text-emerald-400/90 shadow-inner overflow-x-auto">
                  <div className="space-y-3">
                    <div className="text-slate-500">
                      # Welcome to Dhaka Polytechnic Institute Computing Society CLI
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">$</span>
                      <span className="text-white">dpics system --inspect</span>
                    </div>
                    <div className="pl-4 text-slate-400 space-y-1">
                      <div>Organization : Dhaka Polytechnic Institute Computing Society (DPICS)</div>
                      <div>Members      : {totalMembersCount}+ Registered Students across {displayBatches} Batches</div>
                      <div>Status       : Accepting membership applications for current semester</div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-emerald-400 font-bold">$</span>
                      <span className="text-white">dpics join --batch=current</span>
                    </div>
                    <div className="pl-4 text-emerald-300">
                      ✔ Environment initialized. Ready to collaborate, learn and build.
                    </div>

                    <div className="pt-3">
                      <Link
                        href="/join"
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                      >
                        <span>Execute: Join Society</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>

        </div>
      </div>
    </section>
  )
}
