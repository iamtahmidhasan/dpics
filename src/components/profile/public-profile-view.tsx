"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Building2,
  Check,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { departmentLabel, semesterLabel, shiftLabel } from "@/lib/profile-labels"
import type { PublicProfile } from "@/lib/services/public-profile.service"
import { cn } from "cn"

interface PublicProfileViewProps {
  profile: PublicProfile
  defaultTab?: "activities" | "teaching" | "articles" | "learning" | "about"
}

type ProfileTab = "activities" | "teaching" | "articles" | "learning" | "about"

export function PublicProfileView({ profile, defaultTab }: PublicProfileViewProps) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [activeTab, setActiveTab] = React.useState<ProfileTab>(() => {
    if (defaultTab) return defaultTab
    if (profile.isInstructor && profile.instructedCourses.length > 0) return "teaching"
    if (profile.posts.length > 0) return "articles"
    return "activities"
  })

  const [copied, setCopied] = React.useState(false)

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const initials = profile.name.trim().charAt(0).toUpperCase()

  const tabs: Array<{ id: ProfileTab; label: { en: string; bn: string }; icon: any; count?: number }> = [
    {
      id: "activities",
      label: { en: "Timeline", bn: "সময়রেখা" },
      icon: Clock,
      count: profile.activities.length,
    },
  ]

  if (profile.isInstructor || profile.instructedCourses.length > 0) {
    tabs.push({
      id: "teaching",
      label: { en: "Courses", bn: "কোর্সসমূহ" },
      icon: GraduationCap,
      count: profile.instructedCourses.length,
    })
  }

  if (profile.posts.length > 0) {
    tabs.push({
      id: "articles",
      label: { en: "Articles", bn: "নিবন্ধ" },
      icon: FileText,
      count: profile.posts.length,
    })
  }

  if (profile.isMember || profile.enrolledCourses.length > 0) {
    tabs.push({
      id: "learning",
      label: { en: "Learning", bn: "শিক্ষা" },
      icon: BookOpen,
      count: profile.enrolledCourses.length,
    })
  }

  tabs.push({
    id: "about",
    label: { en: "About", bn: "পরিচিতি" },
    icon: Award,
  })

  const memberJoinedFormatted = profile.member?.joinedAt
    ? new Date(profile.member.joinedAt).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* 1. Header Profile Banner & Card */}
      <Card size="sm" className="overflow-hidden border-border bg-card shadow-xs">
        {/* Decorative Top Accent Bar */}
        <div className="h-24 sm:h-32 md:h-36 w-full bg-linear-to-r from-primary/20 via-primary/10 to-primary/5 relative overflow-hidden border-b border-border/60">
          <div className="absolute -right-10 -bottom-10 size-36 sm:size-48 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute left-10 top-0 size-28 sm:size-40 rounded-full bg-emerald-500/10 blur-xl" />
        </div>

        <CardContent className="px-3.5 sm:px-6 pb-5 sm:pb-6 pt-0">
          {/* Top row with Avatar on the left and Actions on the right */}
          <div className="flex items-start justify-between gap-3 -mt-12 sm:-mt-16 md:-mt-20 mb-3 sm:mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="size-20 sm:size-24 md:size-28 rounded-2xl border-4 border-card shadow-md bg-muted">
                {profile.avatar ? (
                  <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {profile.isMember && (
                <div
                  className="absolute -bottom-1 -right-1 flex size-5.5 sm:size-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs"
                  title={t("Verified Active Member", "যাচাইকৃত সক্রিয় সদস্য")}
                >
                  <CheckCircle2 className="size-3.5 sm:size-4" />
                </div>
              )}
            </div>

            {/* Actions: Share Profile */}
            <div className="flex items-center gap-2 pt-2 sm:pt-4 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs h-8 sm:h-9 gap-1.5 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    <span>{t("Link Copied!", "লিংক কপি হয়েছে")}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5" />
                    <span>{t("Share Profile", "শেয়ার করুন")}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Profile Identity Details */}
          <div className="space-y-1.5 mb-3.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="font-heading text-lg sm:text-2xl md:text-3xl font-bold text-foreground break-words">
                {profile.name}
              </h1>

              {profile.isInstructor && (
                <Badge variant="default" className="text-[10px] gap-1 px-1.5 sm:px-2 py-0.5 shrink-0">
                  <GraduationCap className="size-2.5 sm:size-3" />
                  <span>{t("Instructor", "শিক্ষক")}</span>
                </Badge>
              )}

              {profile.isMember && (
                <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 shrink-0">
                  <ShieldCheck className="size-2.5 sm:size-3" />
                  <span>{t("Member", "সদস্য")}</span>
                </Badge>
              )}

              {profile.isAdmin && (
                <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                  <Sparkles className="size-2.5 text-amber-500" />
                  <span>{t("Admin", "প্রশাসক")}</span>
                </Badge>
              )}
            </div>

            {profile.member && (
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 sm:gap-1.5">
                <span className="font-medium text-foreground">
                  {departmentLabel(t)(profile.member.department)}
                </span>
                <span>•</span>
                <span className="font-mono">{t("Session", "সেশন")} {profile.member.session}</span>
                <span>•</span>
                <span>{semesterLabel(t)(profile.member.semester)}</span>
              </p>
            )}

            {profile.instructor?.expertise && (
              <p className="text-xs sm:text-sm text-primary font-medium">
                {profile.instructor.expertise}
              </p>
            )}
          </div>

          {/* Bio Preview if available */}
          {profile.instructor?.bio && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl mb-3.5 leading-relaxed">
              {profile.instructor.bio}
            </p>
          )}

          {/* Key Identity & Academic Chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3 border-t border-border/60 text-xs">
            {profile.member?.studentId && (
              <div className="flex items-center gap-1.5 rounded-md bg-muted/40 border border-border px-2 py-0.5 text-muted-foreground text-[10px] sm:text-[11px] font-mono">
                <span className="text-muted-foreground/70 uppercase font-sans font-semibold text-[9px] sm:text-[10px]">
                  {t("ID:", "আইডি:")}
                </span>
                <span className="font-bold text-foreground">{profile.member.studentId}</span>
              </div>
            )}

            {profile.instructor?.instructorId && (
              <div className="flex items-center gap-1.5 rounded-md bg-muted/40 border border-border px-2 py-0.5 text-muted-foreground text-[10px] sm:text-[11px] font-mono">
                <span className="text-muted-foreground/70 uppercase font-sans font-semibold text-[9px] sm:text-[10px]">
                  {t("Instructor ID:", "ইনস্ট্রাক্টর আইডি:")}
                </span>
                <span className="font-bold text-foreground">{profile.instructor.instructorId}</span>
              </div>
            )}

            {profile.member?.shift && (
              <div className="flex items-center gap-1.5 rounded-md bg-muted/30 border border-border px-2 py-0.5 text-muted-foreground text-[10px] sm:text-[11px]">
                <Building2 className="size-2.5 sm:size-3 text-muted-foreground shrink-0" />
                <span>{shiftLabel(t)(profile.member.shift)} {t("Shift", "শিফট")}</span>
              </div>
            )}

            {memberJoinedFormatted && (
              <div className="flex items-center gap-1.5 rounded-md bg-muted/30 border border-border px-2 py-0.5 text-muted-foreground text-[10px] sm:text-[11px]">
                <Calendar className="size-2.5 sm:size-3 text-muted-foreground shrink-0" />
                <span>{t("Joined", "যুক্ত হয়েছেন")} {memberJoinedFormatted}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Key Stats Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase font-mono tracking-wider">{t("Articles", "নিবন্ধ")}</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-lg sm:text-2xl font-bold text-foreground">
              {profile.stats.postsCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("Published insights", "প্রকাশিত লেখা")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase font-mono tracking-wider">{t("Teaching", "পাঠদান")}</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-lg sm:text-2xl font-bold text-foreground">
              {profile.stats.coursesInstructedCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("Courses instructed", "কোর্সে পাঠদান")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase font-mono tracking-wider">{t("Completed", "সম্পন্ন")}</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-lg sm:text-2xl font-bold text-foreground">
              {profile.stats.coursesCompletedCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("Finished courses", "কোর্স সম্পন্ন")}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase font-mono tracking-wider">{t("Committee", "কমিটি")}</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="size-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading text-lg sm:text-2xl font-bold text-foreground">
              {profile.stats.committeeRolesCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("Leadership roles", "দায়িত্বপ্রাপ্ত পদ")}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navbar Activity Tabs */}
      <nav aria-label={t("Profile activities", "প্রোফাইল কার্যক্রম")} className="border-b border-border w-full">
        <ul className="-mb-px flex gap-1 sm:gap-2 overflow-x-auto pb-0.5 scroll-smooth overscroll-x-contain touch-pan-x">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "border-b-2 px-3 py-2 sm:py-2.5 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
                    isActive
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5 sm:size-4 shrink-0" />
                  <span>{t(tab.label)}</span>
                  {tab.count !== undefined ? (
                    <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 4. Tab Content Panels */}
      <div className="space-y-4">
        {/* TAB 1: Activity Timeline */}
        {activeTab === "activities" && (
          <Card size="sm">
            <CardHeader className="p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base">{t("Activity Timeline & Milestones", "কার্যক্রমের সময়রেখা ও মাইলফলক")}</CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Chronological history of contributions, articles, courses, and committee participation.",
                  "কমিউনিটিতে অবদান, প্রকাশিত নিবন্ধ, কোর্স এবং সাংগঠনিক দায়িত্বের ইতিহাস।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              {profile.activities.length > 0 ? (
                <div className="relative pl-6 sm:pl-8 space-y-4 sm:space-y-5">
                  {/* Continuous Timeline Line */}
                  <div className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-0.5 bg-border -translate-x-1/2" />

                  {profile.activities.map((act) => {
                    let Icon = Clock
                    let badgeColor = "bg-primary text-white"

                    if (act.type === "POST") {
                      Icon = FileText
                      badgeColor = "bg-sky-500 text-white"
                    } else if (act.type === "COURSE_TEACHING") {
                      Icon = GraduationCap
                      badgeColor = "bg-emerald-500 text-white"
                    } else if (act.type === "COURSE_COMPLETED") {
                      Icon = Award
                      badgeColor = "bg-amber-500 text-white"
                    } else if (act.type === "COMMITTEE") {
                      Icon = Users
                      badgeColor = "bg-purple-500 text-white"
                    }

                    const dateFormatted = new Date(act.timestamp).toLocaleDateString(
                      isBn ? "bn-BD" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )

                    return (
                      <div key={act.id} className="relative group">
                        {/* Dot indicator exactly centered on line */}
                        <div
                          className={cn(
                            "absolute -left-6 sm:-left-8 top-1.5 flex size-4 sm:size-4.5 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-card shadow-xs",
                            badgeColor
                          )}
                          style={{ left: 0 }}
                        >
                          <Icon className="size-2 sm:size-2.5" />
                        </div>

                        <div className="rounded-lg border border-border p-3 sm:p-3.5 bg-card/60 hover:bg-card transition-colors space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-foreground break-words">
                              {(isBn && act.titleBn) ? act.titleBn : act.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                              {dateFormatted}
                            </span>
                          </div>

                          {act.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {act.description}
                            </p>
                          )}

                          {act.link && (
                            <div className="pt-1">
                              <Link
                                href={act.link}
                                className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <span>{t("View details", "বিস্তারিত দেখুন")}</span>
                                <ExternalLink className="size-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {t("No public activities recorded yet.", "এখনো কোনো কার্যক্রম রেকর্ড করা হয়নি।")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: Courses & Teaching (Instructors) */}
        {activeTab === "teaching" && (
          <Card size="sm">
            <CardHeader className="p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base">{t("Instructed Courses", "পাঠদানকৃত কোর্সসমূহ")}</CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Curated courses and video lectures conducted by this instructor.",
                  "এই ইনস্ট্রাক্টরের পরিচালিত সকল অনলাইন কোর্স ও লেকচার।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              {profile.instructedCourses.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.instructedCourses.map((c) => (
                    <div
                      key={c.id}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-colors"
                    >
                      <div className="relative aspect-video w-full bg-muted overflow-hidden">
                        {c.thumbnail ? (
                          <Image
                            src={c.thumbnail}
                            alt={c.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <GraduationCap className="size-8 opacity-40" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur-xs font-mono">
                            {c.level}
                          </Badge>
                          {c.isFree ? (
                            <Badge variant="success" className="text-[10px]">
                              {t("Free", "ফ্রি")}
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-[10px]">
                              {t("Premium", "প্রিমিয়াম")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-3 sm:p-3.5 space-y-2">
                        <h4 className="font-heading text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {(isBn && c.titleBn) ? c.titleBn : c.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                          <span>{c.totalLessons} {t("lessons", "টি পাঠ")}</span>
                          <span>{c.studentsCount} {t("students", "শিক্ষার্থী")}</span>
                        </div>

                        <div className="pt-1 mt-auto">
                          <Link
                            href={`/courses/${c.slug}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs h-7")}
                          >
                            {t("View Course", "কোর্স দেখুন")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {t("No courses instructed yet.", "কোনো কোর্স যুক্ত নেই।")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Articles & Posts */}
        {activeTab === "articles" && (
          <Card size="sm">
            <CardHeader className="p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base">{t("Published Articles & Writing", "প্রকাশিত টেকনিক্যাল নিবন্ধ")}</CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Articles, technical tutorials, and learning documentation written by this member.",
                  "কমিউনিটিতে প্রকাশিত টেকনিক্যাল ব্লগ, টিউটোরিয়াল ও সহায়ক গাইড।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              {profile.posts.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.posts.map((p) => {
                    const postDate = new Date(p.publishedAt).toLocaleDateString(
                      isBn ? "bn-BD" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )

                    return (
                      <Link
                        key={p.id}
                        href={`/posts/${p.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-xs hover:border-primary/50 transition-colors space-y-2"
                      >
                        {p.coverImage && (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={p.coverImage}
                              alt={p.title}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            {p.categoryName ? (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                {p.categoryName}
                              </Badge>
                            ) : <span />}
                            <span>{p.readingMinutes} {t("min read", "মিনিট")}</span>
                          </div>

                          <h4 className="font-heading text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {(isBn && p.titleBn) ? p.titleBn : p.title}
                          </h4>

                          {p.excerpt && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {(isBn && p.excerptBn) ? p.excerptBn : p.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 mt-auto border-t border-border/50 text-[10px] text-muted-foreground flex items-center justify-between">
                          <span>{postDate}</span>
                          <span className="font-medium text-primary group-hover:underline inline-flex items-center gap-0.5">
                            {t("Read", "পড়ুন")} &rarr;
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {t("No articles published yet.", "এখনো কোনো নিবন্ধ প্রকাশ করা হয়নি।")}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Learning Journey (Enrolled & Completed) */}
        {activeTab === "learning" && (
          <Card size="sm">
            <CardHeader className="p-3.5 sm:p-5">
              <CardTitle className="text-sm sm:text-base">{t("Enrolled & Completed Courses", "শেখার কার্যক্রম ও অগ্রগতি")}</CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Interactive courses and certifications pursued within DPI Computing Society.",
                  "সোসাইটিতে সম্পন্ন ও চলমান কোর্সসমূহের তালিকা।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              {profile.enrolledCourses.length > 0 ? (
                <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.enrolledCourses.map((e) => {
                    const percent = e.totalLessonsCount > 0
                      ? Math.round((e.completedLessonsCount / e.totalLessonsCount) * 100)
                      : 0

                    const enrolledDateFormatted = e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : null

                    const courseTitle = (isBn && e.courseTitleBn) ? e.courseTitleBn : e.courseTitle

                    return (
                      <div
                        key={e.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all hover:shadow-sm"
                      >
                        {/* Course Thumbnail or Styled Banner */}
                        <div className="relative aspect-video w-full bg-muted overflow-hidden">
                          {e.courseThumbnail ? (
                            <Image
                              src={e.courseThumbnail}
                              alt={courseTitle}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 via-primary/5 to-muted">
                              <BookOpen className="size-8 text-primary/40" />
                            </div>
                          )}

                          {/* Level badge */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            {e.level && (
                              <Badge variant="outline" className="text-[10px] bg-background/85 backdrop-blur-xs font-mono">
                                {e.level}
                              </Badge>
                            )}
                          </div>

                          {/* Completed / Progress badge */}
                          <div className="absolute top-2 right-2">
                            {e.isCompleted ? (
                              <Badge variant="success" className="text-[10px] gap-1 shadow-xs bg-emerald-500 text-white">
                                <CheckCircle2 className="size-3" />
                                <span>{t("Completed", "সম্পন্ন")}</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-mono shadow-xs bg-background/85 backdrop-blur-xs font-semibold">
                                {percent}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-1 flex-col p-3.5 sm:p-4 space-y-3">
                          <div className="space-y-1">
                            <h4 className="font-heading text-xs sm:text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                              {courseTitle}
                            </h4>
                            {enrolledDateFormatted && (
                              <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Calendar className="size-3 text-muted-foreground/70 shrink-0" />
                                <span>{t("Enrolled", "যুক্ত")} {enrolledDateFormatted}</span>
                              </p>
                            )}
                          </div>

                          {/* Progress Bar & Milestone */}
                          <div className="space-y-1.5 mt-auto pt-2">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {e.completedLessonsCount} / {e.totalLessonsCount} {t("lessons", "টি পাঠ")}
                              </span>
                              <span className="font-mono text-[10px] font-semibold text-foreground">
                                {percent}% {t("completed", "সম্পন্ন")}
                              </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full transition-all duration-500 rounded-full",
                                  e.isCompleted ? "bg-emerald-500" : "bg-primary"
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 border-t border-border/50">
                            <Link
                              href={`/courses/${e.courseSlug}`}
                              className={cn(
                                buttonVariants({
                                  variant: e.isCompleted ? "outline" : "default",
                                  size: "sm",
                                }),
                                "w-full text-xs h-8 gap-1.5 font-medium shadow-xs"
                              )}
                            >
                              {e.isCompleted ? (
                                <>
                                  <Award className="size-3.5 text-amber-500" />
                                  <span>{t("Review Course", "কোর্স দেখুন")}</span>
                                </>
                              ) : (
                                <>
                                  <BookOpen className="size-3.5" />
                                  <span>{t("Continue Learning", "পড়া চালিয়ে যান")}</span>
                                </>
                              )}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center space-y-3">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <BookOpen className="size-6 opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {t("No enrolled courses yet", "এখনো কোনো কোর্সে যুক্ত হননি")}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {t(
                        "Courses and learning tracks you enroll in will appear here with progress tracking.",
                        "যেসব কোর্সে আপনি যুক্ত হবেন তা এখানে অগ্রগতি সহ প্রদর্শিত হবে।"
                      )}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/courses"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-8 gap-1.5")}
                    >
                      <GraduationCap className="size-3.5 text-primary" />
                      <span>{t("Browse Courses", "কোর্সসমূহ দেখুন")}</span>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 5: About & Credentials */}
        {activeTab === "about" && (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {/* Instructor Credentials Card */}
            {profile.isInstructor && profile.instructor && (
              <Card size="sm">
                <CardHeader className="p-3.5 sm:p-5">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <GraduationCap className="size-4 text-primary shrink-0" />
                    <span>{t("Instructor Profile & Credentials", "ইনস্ট্রাক্টর পরিচিতি ও যোগ্যতা")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 sm:p-5 pt-0 space-y-2.5 text-xs">
                  {profile.instructor.instructorId && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                      <span className="text-muted-foreground text-[11px]">{t("Instructor ID", "ইনস্ট্রাক্টর আইডি")}</span>
                      <span className="font-mono font-bold text-foreground sm:text-right">
                        #{profile.instructor.instructorId}
                      </span>
                    </div>
                  )}

                  {profile.instructor.expertise && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                      <span className="text-muted-foreground text-[11px]">{t("Expertise", "দক্ষতা ও ক্ষেত্র")}</span>
                      <span className="font-medium text-foreground sm:text-right">
                        {profile.instructor.expertise}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                    <span className="text-muted-foreground text-[11px]">{t("Courses Conducted", "পরিচালিত কোর্স")}</span>
                    <span className="font-medium text-foreground sm:text-right">
                      {profile.instructedCourses.length} {t("Courses", "টি কোর্স")}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                    <span className="text-muted-foreground text-[11px]">{t("Instructor Status", "ইনস্ট্রাক্টর স্ট্যাটাস")}</span>
                    <span className="sm:text-right">
                      <Badge variant="success" className="text-[10px]">
                        {t("Verified Instructor", "যাচাইকৃত ইনস্ট্রাক্টর")}
                      </Badge>
                    </span>
                  </div>

                  {profile.instructor.bio && (
                    <div className="pt-1.5 space-y-1">
                      <span className="text-muted-foreground text-[11px] block">{t("Professional Bio", "পেশাদার বিবরণ")}</span>
                      <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/60">
                        {profile.instructor.bio}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Academic Information Card */}
            {profile.member && (
              <Card size="sm">
                <CardHeader className="p-3.5 sm:p-5">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Building2 className="size-4 text-primary shrink-0" />
                    <span>{t("Academic Information", "একাডেমিক তথ্য")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 sm:p-5 pt-0 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                    <span className="text-muted-foreground text-[11px]">{t("Department", "বিভাগ")}</span>
                    <span className="font-medium text-foreground sm:text-right">
                      {departmentLabel(t)(profile.member.department)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                    <span className="text-muted-foreground text-[11px]">{t("Session", "সেশন")}</span>
                    <span className="font-mono font-medium text-foreground sm:text-right">{profile.member.session}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                    <span className="text-muted-foreground text-[11px]">{t("Semester", "সেমিস্টার")}</span>
                    <span className="font-medium text-foreground sm:text-right">
                      {semesterLabel(t)(profile.member.semester)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-border/50 gap-0.5">
                    <span className="text-muted-foreground text-[11px]">{t("Shift", "শিফট")}</span>
                    <span className="font-medium text-foreground sm:text-right">
                      {shiftLabel(t)(profile.member.shift)} {t("Shift", "শিফট")}
                    </span>
                  </div>

                  {profile.member.studentId && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1.5 gap-0.5">
                      <span className="text-muted-foreground text-[11px]">{t("Student ID", "রোল / স্টুডেন্ট আইডি")}</span>
                      <span className="font-mono font-bold text-foreground sm:text-right">{profile.member.studentId}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Committee Designations Card */}
            <Card size="sm">
              <CardHeader className="p-3.5 sm:p-5">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Users className="size-4 text-primary shrink-0" />
                  <span>{t("Committee Leadership & Roles", "সাংগঠনিক দায়িত্ব ও পদ")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-5 pt-0 space-y-2.5">
                {profile.committeeRoles.length > 0 ? (
                  profile.committeeRoles.map((cr) => (
                    <div
                      key={cr.id}
                      className="rounded-lg border border-border p-3 bg-muted/20 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="font-semibold text-foreground">{cr.roleName}</span>
                        {cr.isActive ? (
                          <Badge variant="success" className="text-[9px] py-0 px-1">
                            {t("Active Term", "চলমান")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 px-1">
                            {t("Completed", "সম্পন্ন")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {cr.committeeName}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {t("No specific committee roles assigned.", "কোনো নির্দিষ্ট দায়িত্ব তালিকাভুক্ত নেই।")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
