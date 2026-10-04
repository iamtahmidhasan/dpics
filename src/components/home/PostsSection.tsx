'use client'

import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import {
  BookOpen,
  ChevronRight,
  Clock3,
  CalendarDays,
  PenSquare,
  Sparkles,
  ArrowRight,
  ImageOff,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/components/language-provider'
import type { PostSummary } from '@/lib/services/post.service'
import { cn } from 'cn'

type PostsSectionProps = {
  posts?: PostSummary[]
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

export function PostsSection({ posts = [] }: PostsSectionProps) {
  const { lang, t } = useLanguage()
  const isBn = lang === 'bn'

  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })

  if (posts.length === 0) {
    return null
  }

  // Display top 3 or up to 6 articles in a balanced 3-column grid
  const displayPosts = posts.slice(0, 3)

  return (
    <section
      ref={sectionRef}
      id="blog"
      className="relative overflow-hidden bg-muted/25 py-16 sm:py-20 md:py-24 border-y border-border/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 sm:mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <BookOpen className="size-3.5" />
              <span>{t('Knowledge & Insights', 'জ্ঞান ও প্রযুক্তি ভাবনা')}</span>
            </span>

            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t('Latest from Our', 'আমাদের সাম্প্রতিক')}{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                {t('Tech Blog', 'ব্লগ ও নিবন্ধ')}
              </span>
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t(
                'Explore engineering tutorials, contest strategies, open-source discoveries, and student tech experiences.',
                'সফটওয়্যার ইঞ্জিনিয়ারিং টিউটোরিয়াল, কনটেস্ট স্ট্র্যাটেজি, ওপেন সোর্স উদ্ভাবন এবং সদস্যদের বাস্তবিক অভিজ্ঞতা পড়ুন।'
              )}
            </p>
          </div>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/posts" />}
            className="group shrink-0 gap-1.5 border-border/80 hover:border-primary/40 hover:bg-primary/5"
          >
            <span>{t('Explore All Articles', 'সবগুলো নিবন্ধ দেখুন')}</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {displayPosts.map((post) => {
            const timestamp = post.publishedAt ?? post.createdAt
            const dateLabel = new Intl.DateTimeFormat(isBn ? 'bn-BD' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }).format(new Date(timestamp))

            const displayTitle = isBn && post.titleBn ? post.titleBn : post.title
            const displayExcerpt = isBn && post.excerptBn ? post.excerptBn : post.excerpt
            const categoryName = post.category
              ? isBn && post.category.nameBn
                ? post.category.nameBn
                : post.category.name
              : null
            const authorInitials = (post.author?.name || '?').trim().charAt(0).toUpperCase()

            return (
              <motion.div key={post.id} variants={itemVariants} className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
                  {/* Media / Thumbnail */}
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted/60">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={displayTitle}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted/80 text-muted-foreground/50">
                        <ImageOff className="size-8" />
                      </div>
                    )}

                    {/* Top Overlay Badges */}
                    <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-1.5">
                      <div className="flex min-w-0 max-w-[80%] items-center gap-1.5 overflow-hidden">
                        {post.isFeatured && (
                          <Badge className="shrink-0 bg-primary text-primary-foreground text-[0.625rem] shadow-sm">
                            <Sparkles className="mr-0.5 size-2.5" />
                            {t('Featured', 'ফিচার্ড')}
                          </Badge>
                        )}
                        {categoryName && (
                          <Badge
                            variant="secondary"
                            className="max-w-[130px] truncate bg-background/90 text-[0.625rem] font-medium shadow-xs backdrop-blur-xs"
                          >
                            {categoryName}
                          </Badge>
                        )}
                      </div>

                      {/* Reading Time Pill */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground backdrop-blur-xs shadow-xs">
                        <Clock3 className="size-2.5 shrink-0 text-primary" />
                        <span>{t(`${post.readingMinutes} min`, `${post.readingMinutes} মি.`)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                      <Link href={`/posts/${post.slug}`}>
                        {displayTitle}
                      </Link>
                    </h3>

                    {displayExcerpt && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {displayExcerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="max-w-[120px] truncate rounded-md bg-muted/80 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta Footer Pinned to Bottom */}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-3.5 text-[0.6875rem] text-muted-foreground">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar className="size-6 shrink-0 border">
                          {post.author.avatar && (
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          )}
                          <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium leading-tight text-foreground">
                            {post.author.name}
                          </p>
                          {post.author.studentId && (
                            <p className="truncate font-mono text-[10px] text-muted-foreground mt-0.5">
                              {post.author.studentId}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                        <CalendarDays className="size-3 shrink-0" />
                        <time dateTime={timestamp}>{dateLabel}</time>
                      </div>
                    </div>
                  </div>
                </article>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom invitation banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-dashed border-border/80 bg-background/50 p-4 text-center sm:flex-row sm:p-6 sm:text-left"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground sm:text-base">
              {t(
                'Have a technical guide, discovery, or project to share?',
                'আপনার কি কোনো প্রযুক্তিগত টিউটোরিয়াল বা প্রজেক্ট শেয়ার করার আছে?'
              )}
            </h4>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t(
                'Contribute articles to the DPI Computing Society blog and help fellow members learn.',
                'সোসাইটি ব্লগে আপনার লেখা প্রকাশ করুন এবং সহপাঠীদের শেখায় সহায়তা করুন।'
              )}
            </p>
          </div>

          <div className="flex w-full flex-col sm:w-auto sm:flex-row items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/profile/write" />}
              className="w-full sm:w-auto gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <PenSquare className="size-4" />
              <span>{t('Write an Article', 'নিবন্ধ লিখুন')}</span>
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/posts" />}
              className="w-full sm:w-auto gap-1.5"
            >
              <span>{t('Browse All Posts', 'সব ব্লগ দেখুন')}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
