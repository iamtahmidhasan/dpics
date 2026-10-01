'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import {
  Code2,
  Trophy,
  Users,
  BookOpen,
  Cpu,
  Globe,
  Zap,
  Target,
} from 'lucide-react'
import { useRef } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

const FEATURES = [
  {
    icon: Code2,
    title: 'Programming Workshops',
    description:
      'Hands-on sessions covering DSA, competitive programming, web development, and modern software engineering practices.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Trophy,
    title: 'Competitions & Hackathons',
    description:
      'Inter-department programming contests and collaborative hackathons to sharpen problem-solving skills under pressure.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Peer Learning Community',
    description:
      'A supportive network of like-minded students who collaborate, share resources, and grow together every semester.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    description:
      'Curated roadmaps, notes, slides, and problem archives from all past sessions — available to every member.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Cpu,
    title: 'Tech Talks & Seminars',
    description:
      'Industry professionals and senior students share cutting-edge insights on AI, cloud computing, and open-source.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Globe,
    title: 'Industry Exposure',
    description:
      'Networking opportunities, career guidance, and project collaborations that bridge academia and real-world tech.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Zap,
    title: 'Fast-Track Bootcamps',
    description:
      'Intensive weekend bootcamps to master specific technologies quickly — from Git fundamentals to full-stack apps.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Target,
    title: 'Project Mentorship',
    description:
      'Guided mentorship programs pairing freshmen with experienced members to build portfolio-worthy projects.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
} satisfies Variants

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
} satisfies Variants

export function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-muted/30 py-24" id="features">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            What We Offer
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              level up
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            From beginner-friendly workshops to advanced competitive programming — our society has
            something for every stage of your journey.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={cardVariants}>
                <Card className="group h-full border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
                  <CardHeader>
                    <div
                      className={`mb-3 flex size-10 items-center justify-center rounded-lg ${feature.bg}`}
                    >
                      <Icon className={`size-5 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
