'use client'

import { useState, useRef } from 'react'
import { motion, useInView, type Variants, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Sparkles,
  ChevronRight,
  Award,
  ArrowRight,
  Building2,
  ExternalLink,
  PlusCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AchievementCard } from '@/components/achievements/achievement-card'
import { useLanguage } from '@/components/language-provider'
import type { AchievementSummary } from '@/lib/services/achievement.service'
import { cn } from 'cn'

type AchievementsSectionProps = {
  featured?: AchievementSummary[]
  latest?: AchievementSummary[]
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

export function AchievementsSection({
  featured = [],
  latest = [],
}: AchievementsSectionProps) {
  const { lang, t } = useLanguage()
  const isBn = lang === 'bn'
  const [activeTab, setActiveTab] = useState<'featured' | 'latest'>(
    featured.length > 0 ? 'featured' : 'latest'
  )

  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })

  const displayItems = activeTab === 'featured' ? featured : latest
  const spotlightItem = displayItems[0]
  const gridItems = displayItems.slice(1, 4)

  if (featured.length === 0 && latest.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      id="achievements"
      className="relative overflow-hidden bg-background py-16 sm:py-20 md:py-24"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-40 dark:opacity-25">
        <div className="size-[500px] rounded-full bg-gradient-to-tr from-amber-500/20 via-primary/20 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 sm:mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Trophy className="size-3.5" />
              <span>{t('Hall of Fame & Milestones', 'কৃতিত্ব ও গৌরবময় সাফল্য')}</span>
            </span>

            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t('Celebrating Member', 'আমাদের সদস্যদের')}{' '}
              <span className="bg-gradient-to-r from-amber-500 via-primary to-emerald-400 bg-clip-text text-transparent">
                {t('Achievements', 'অর্জিত গৌরব')}
              </span>
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(
                'From national hackathons and competitive programming champions to certified industry leaders — explore the triumphs of our community.',
                'জাতীয় হ্যাকাথন বিজয়ী, প্রোগ্রামিং কনটেস্টে শীর্ষস্থান থেকে শুরু করে আন্তর্জাতিক সনদধারী — আমাদের সদস্যদের অনন্য সাফল্যের গল্পগুলো দেখুন।'
              )}
            </p>
          </div>

          {/* Action buttons & Tab controls */}
          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
            {/* View Switcher Tabs */}
            {featured.length > 0 && latest.length > 0 && (
              <div className="inline-flex rounded-lg border border-border/80 bg-muted/50 p-1 text-xs font-medium backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('featured')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all',
                    activeTab === 'featured'
                      ? 'bg-background font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>{t('Featured', 'ফিচার্ড')}</span>
                  <span className="ml-1 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[10px] text-amber-600 dark:text-amber-400">
                    {featured.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('latest')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all',
                    activeTab === 'latest'
                      ? 'bg-background font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Award className="size-3.5 text-primary" />
                  <span>{t('Latest', 'সাম্প্রতিক')}</span>
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">
                    {latest.length}
                  </span>
                </button>
              </div>
            )}

            {/* View All Link */}
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/achievements" />}
              className="group shrink-0 gap-1.5 border-border/80 hover:border-primary/40 hover:bg-primary/5"
            >
              <span>{t('Explore All', 'সবগুলো দেখুন')}</span>
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </motion.div>

        {/* Content Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'show' : 'hidden'}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Spotlight Showcase (Top milestone highlight) */}
            {spotlightItem && (
              <motion.div variants={itemVariants}>
                <div className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5 p-4 shadow-sm transition-all duration-300 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/5 sm:p-6 lg:p-8">
                  <div className="grid gap-6 md:grid-cols-12 md:items-center">
                    {/* Media Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted/60 md:col-span-5 lg:col-span-5">
                      {spotlightItem.coverImage ? (
                        <Image
                          src={spotlightItem.coverImage}
                          alt={
                            isBn && spotlightItem.titleBn
                              ? spotlightItem.titleBn
                              : spotlightItem.title
                          }
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 45vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/10 via-primary/10 to-muted">
                          <Trophy className="size-16 text-amber-500/50" />
                        </div>
                      )}

                      {/* Top badges */}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        {spotlightItem.isFeatured && (
                          <Badge className="bg-amber-500 text-white shadow-sm hover:bg-amber-600">
                            <Sparkles className="mr-1 size-3" />
                            {t('Top Highlight', 'শীর্ষ অর্জন')}
                          </Badge>
                        )}
                        {spotlightItem.category && (
                          <Badge
                            variant="secondary"
                            className="max-w-[160px] truncate bg-background/90 text-xs font-semibold backdrop-blur-xs"
                          >
                            {isBn && spotlightItem.category.nameBn
                              ? spotlightItem.category.nameBn
                              : spotlightItem.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content details */}
                    <div className="flex flex-col justify-between space-y-4 md:col-span-7 lg:col-span-7">
                      <div className="space-y-3">
                        {/* Organization / Awarding Body */}
                        {(spotlightItem.organization ||
                          spotlightItem.organizationBn) && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Building2 className="size-3.5 shrink-0" />
                            <span className="truncate">
                              {isBn && spotlightItem.organizationBn
                                ? spotlightItem.organizationBn
                                : spotlightItem.organization}
                            </span>
                          </div>
                        )}

                        <h3 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl">
                          <Link
                            href={`/achievements/${spotlightItem.slug}`}
                            className="text-foreground transition-colors hover:text-amber-500"
                          >
                            {isBn && spotlightItem.titleBn
                              ? spotlightItem.titleBn
                              : spotlightItem.title}
                          </Link>
                        </h3>

                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                          {isBn && spotlightItem.excerptBn
                            ? spotlightItem.excerptBn
                            : spotlightItem.excerpt ||
                              spotlightItem.title}
                        </p>

                        {/* Tags */}
                        {spotlightItem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {spotlightItem.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="max-w-[130px] truncate rounded-md border border-border/60 bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer & CTA */}
                      <div className="flex flex-col gap-3.5 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Author info */}
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar className="size-8 shrink-0 border border-border">
                            {spotlightItem.author?.avatar && (
                              <AvatarImage
                                src={spotlightItem.author.avatar}
                                alt={spotlightItem.author.name}
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {(spotlightItem.author?.name || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="truncate font-semibold text-foreground">
                              {spotlightItem.author?.name}
                            </p>
                            <p className="truncate text-muted-foreground">
                              {spotlightItem.author?.studentId ||
                                spotlightItem.author?.instructorId ||
                                (spotlightItem.eventDate
                                  ? new Intl.DateTimeFormat(
                                      isBn ? 'bn-BD' : 'en-US',
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                      }
                                    ).format(new Date(spotlightItem.eventDate))
                                  : null)}
                            </p>
                          </div>
                        </div>

                        {/* Link to detail */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {spotlightItem.certificateUrl && (
                            <a
                              href={spotlightItem.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="size-3" />
                              <span>{t('Verify', 'যাচাই')}</span>
                            </a>
                          )}
                          <Button
                            size="sm"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/achievements/${spotlightItem.slug}`}
                              />
                            }
                            className="gap-1.5 bg-amber-500 font-medium text-white hover:bg-amber-600 shrink-0"
                          >
                            <span>{t('Read Story', 'বিস্তারিত পড়ুন')}</span>
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid for secondary items - Balanced 3-column layout */}
            {gridItems.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {gridItems.map((item) => (
                  <motion.div key={item.id} variants={itemVariants} className="h-full">
                    <AchievementCard
                      achievement={item}
                      lang={lang}
                      className="h-full border-border/60 bg-card hover:border-amber-500/40"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom banner inviting members to share their achievements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-center sm:flex-row sm:p-6 sm:text-left"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground sm:text-base">
              {t(
                'Are you a member or mentor with a new achievement?',
                'আপনি কি কোনো নতুন সাফল্য বা সম্মাননা অর্জন করেছেন?'
              )}
            </h4>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t(
                'Share your awards, contest ranks, and certifications to be featured in our official hall of fame.',
                'আপনার জয়, সনদ এবং অর্জন জমা দিন এবং সোসাইটির অফিসিয়াল হল অব ফেমে স্থান করে নিন।'
              )}
            </p>
          </div>

          <div className="flex w-full flex-col sm:w-auto sm:flex-row items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/profile/achievements/add" />}
              className="w-full sm:w-auto gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <PlusCircle className="size-4" />
              <span>{t('Submit Achievement', 'অর্জন জমা দিন')}</span>
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/achievements" />}
              className="w-full sm:w-auto gap-1.5"
            >
              <span>{t('View All', 'সব অর্জন')}</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
