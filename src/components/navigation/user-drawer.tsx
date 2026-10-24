"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  X,
  User,
  LayoutDashboard,
  Trophy,
  PenSquare,
  BookOpen,
  Shield,
  GraduationCap,
  Award,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PlusCircle,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  PlayCircle,
  Loader2,
  QrCode,
} from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useLanguage } from "@/components/language-provider"
import { signOut, useSession } from "@/lib/auth-client"
import { isAdmin as hasAdminRole, isSuperAdmin as hasSuperAdminRole } from "@/lib/roles"
import { resolveUserImage } from "@/lib/user-image"
import { Role } from "@/generated/prisma/enums"
import { cn } from "cn"

type EnrolledCourseItem = {
  id: string
  status: "ACTIVE" | "PENDING" | "REJECTED"
  amountPaid: number
  enrolledAt: string
  course: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
    isFree: boolean
    level?: string
    sections?: {
      lessons?: { id: string }[]
    }[]
  }
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  )
}

const SOCIAL_PROFILES = [
  // {
  //   name: "LinkedIn",
  //   title: { en: "LinkedIn Network", bn: "লিঙ্কডইন নেটওয়ার্ক" },
  //   desc: {
  //     en: "Connect with alumni, engineers & mentors",
  //     bn: "অ্যালামনাই ও ইঞ্জিনিয়ারদের সাথে যুক্ত হোন",
  //   },
  //   href: "https://www.linkedin.com/company/dpi-computing-society",
  //   icon: LinkedInIcon,
  //   bgClass: "bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#0A66C2]/20",
  //   borderClass: "hover:border-[#0A66C2]/40",
  // },
  {
    name: "Facebook",
    title: { en: "Facebook Community", bn: "ফেসবুক কমিউনিটি" },
    desc: {
      en: "Official discussions, event photos & polls",
      bn: "গ্রুপ আলোচনা, ইভেন্ট আপডেট ও ছবি",
    },
    href: "https://www.facebook.com/groups/dpics.2026",
    icon: FacebookIcon,
    bgClass: "bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/20",
    borderClass: "hover:border-[#1877F2]/40",
  },
  {
    name: "Facebook Page",
    title: { en: "Facebook Page", bn: "ফেসবুক পেজ" },
    desc: {
      en: "Official discussions, event photos & polls",
      bn: "গ্রুপ আলোচনা, ইভেন্ট আপডেট ও ছবি",
    },
    href: "https://www.facebook.com/profile.php?id=61594926394020",
    icon: FacebookIcon,
    bgClass: "bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/20",
    borderClass: "hover:border-[#1877F2]/40",
  },
  // {
  //   name: "Twitter / X",
  //   title: { en: "Twitter / X Feed", bn: "টুইটার / এক্স" },
  //   desc: {
  //     en: "Tech news, sprint results & announcements",
  //     bn: "প্রযুক্তি আপডেট ও সাম্প্রতিক খবর",
  //   },
  //   href: "https://twitter.com/dpics_official",
  //   icon: TwitterIcon,
  //   bgClass: "bg-foreground/10 text-foreground",
  //   borderClass: "hover:border-foreground/30",
  // },
  // {
  //   name: "GitHub",
  //   title: { en: "GitHub Repositories", bn: "গিটহাব ওপেন সোর্স" },
  //   desc: {
  //     en: "Open source projects & student codes",
  //     bn: "ওপেন সোর্স কোড ও টিম প্রজেক্ট",
  //   },
  //   href: "https://github.com/iamtahmidhasan/dpics",
  //   icon: GitHubIcon,
  //   bgClass: "bg-[#24292F]/10 text-foreground dark:bg-white/10",
  //   borderClass: "hover:border-primary/40",
  // },
]

type UserDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDrawer({ open, onOpenChange }: UserDrawerProps) {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const isBn = lang === "bn"
  const session = useSession()
  const [signingOut, setSigningOut] = useState(false)
  const [enrollments, setEnrollments] = useState<EnrolledCourseItem[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [hasFetchedCourses, setHasFetchedCourses] = useState(false)

  const user = session.data?.user
  const isAdmin = hasAdminRole(user)
  const isSuperAdmin = hasSuperAdminRole(user)
  const isMember = user?.roles?.includes(Role.MEMBER)
  const isInstructor = user?.roles?.includes(Role.INSTRUCTOR)

  // Fetch enrolled courses when drawer is opened
  useEffect(() => {
    if (open && user && !hasFetchedCourses) {
      let isMounted = true
      queueMicrotask(() => {
        if (isMounted) setLoadingCourses(true)
      })

      fetch("/api/my/courses")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load courses")
          return res.json()
        })
        .then((data) => {
          if (isMounted) {
            setEnrollments(data?.enrollments || [])
            setHasFetchedCourses(true)
          }
        })
        .catch((err) => {
          console.error("Error loading enrolled courses:", err)
        })
        .finally(() => {
          if (isMounted) {
            setLoadingCourses(false)
          }
        })

      return () => {
        isMounted = false
      }
    }
  }, [open, user, hasFetchedCourses])

  const initials = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase()
  const avatar = user
    ? resolveUserImage(
        user.image as unknown as string[] | undefined,
        user.selactedImg ?? null
      ).avatar
    : null

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      onOpenChange(false)
      router.push("/")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const navigateTo = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[84vh] rounded-t-3xl border-t border-border bg-background/95 backdrop-blur-xl">
        {/* Header bar with Close button */}
        <div className="relative flex items-center justify-between px-5 pt-3 pb-2 border-b border-border/50">
          <DrawerHeader className="p-0 text-left">
            <DrawerTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
              {user
                ? t("Account & Shortcuts", "অ্যাকাউন্ট ও নেভিগেশন")
                : t("Welcome to DPICS", "ডিপিআই সিএস-এ স্বাগতম")}
            </DrawerTitle>
          </DrawerHeader>

          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-6">
          {user ? (
            <>
              {/* User Profile Identity Hero */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/25 p-4 shadow-xs bg-card">
                <div className="flex items-center gap-3.5">
                  <div className="relative size-14 shrink-0 rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background overflow-hidden bg-muted">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={user.name || user.email}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-primary text-base font-bold text-primary-foreground">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading text-base font-bold leading-tight truncate text-foreground">
                        {user.name || t("Community Member", "কমিউনিটি সদস্য")}
                      </h3>
                      {isSuperAdmin ? (
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0 font-semibold">
                          <Shield className="size-2.5 mr-0.5" />
                          Super Admin
                        </Badge>
                      ) : isAdmin ? (
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0 font-semibold">
                          <Shield className="size-2.5 mr-0.5" />
                          Admin
                        </Badge>
                      ) : isInstructor ? (
                        <Badge className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] px-1.5 py-0 font-semibold">
                          <GraduationCap className="size-2.5 mr-0.5" />
                          Instructor
                        </Badge>
                      ) : isMember ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0 font-semibold">
                          <Award className="size-2.5 mr-0.5" />
                          Member
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          User
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>

                    <div className="pt-1 flex items-center gap-2">
                      <Link
                        href="/profile"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        <UserCheck className="size-3" />
                        <span>{t("Manage Profile", "প্রোফাইল পরিচালনা")}</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrolled Courses Card Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <GraduationCap className="size-3.5" />
                    </div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Enrolled Courses", "ভর্তি হওয়া কোর্সসমূহ")}
                    </h4>
                  </div>

                  <Link
                    href="/profile/enrolled"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <span>{t("View All", "সবগুলো")}</span>
                    {enrollments.length > 0 && (
                      <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                        {enrollments.length}
                      </span>
                    )}
                    <ChevronRight className="size-3" />
                  </Link>
                </div>

                {loadingCourses && !hasFetchedCourses ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 p-4 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>{t("Loading your courses...", "কোর্স লোড হচ্ছে...")}</span>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="relative overflow-hidden rounded-xl border border-dashed border-border/80 bg-gradient-to-br from-card/90 via-muted/20 to-card/50 p-3.5 text-center">
                    <div className="mx-auto mb-1.5 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookOpen className="size-4" />
                    </div>
                    <h5 className="text-xs font-semibold text-foreground">
                      {t("No courses enrolled yet", "এখনও কোনো কোর্সে যুক্ত হননি")}
                    </h5>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                      {t(
                        "Upskill with hands-on bootcamps and workshops.",
                        "ওয়ার্কশপ ও বুটক্যাম্পের মাধ্যমে আপনার প্রযুক্তিগত দক্ষতা বৃদ্ধি করুন।"
                      )}
                    </p>
                    <div className="mt-2.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateTo("/courses")}
                        className="h-7 gap-1.5 text-xs font-semibold hover:border-primary/50 hover:bg-primary/5"
                      >
                        <GraduationCap className="size-3.5 text-primary" />
                        <span>{t("Browse Courses", "কোর্স ব্রাউজ করুন")}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {enrollments.slice(0, 3).map((en) => {
                      const course = en.course
                      const isActive = en.status === "ACTIVE"
                      const isPending = en.status === "PENDING"
                      const totalLessons =
                        course.sections?.reduce(
                          (acc, s) => acc + (s.lessons?.length || 0),
                          0
                        ) || 0
                      const destination = isActive
                        ? `/courses/${course.slug}/learn`
                        : `/courses/${course.slug}`

                      return (
                        <div
                          key={en.id}
                          className="group relative overflow-hidden rounded-xl border border-border/75 bg-card p-3 transition-all hover:border-primary/50 hover:shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            {/* Course Thumbnail or Icon */}
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/60">
                              {course.thumbnail ? (
                                <Image
                                  src={course.thumbnail}
                                  alt={course.title}
                                  fill
                                  unoptimized
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                                  <BookOpen className="size-5" />
                                </div>
                              )}
                              {isActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayCircle className="size-5 text-white drop-shadow-md" />
                                </div>
                              )}
                            </div>

                            {/* Course Details */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                {isActive ? (
                                  <Badge className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 text-[10px] px-1.5 py-0 font-medium gap-0.5">
                                    <CheckCircle2 className="size-2.5" />
                                    <span>{t("Active", "চলমান")}</span>
                                  </Badge>
                                ) : isPending ? (
                                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0 font-medium gap-0.5">
                                    <Clock className="size-2.5" />
                                    <span>{t("Pending", "পেন্ডিং")}</span>
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    {t("Rejected", "প্রত্যাখ্যাত")}
                                  </Badge>
                                )}

                                {totalLessons > 0 && (
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {totalLessons} {t("lessons", "টি পাঠ")}
                                  </span>
                                )}
                              </div>

                              <Link
                                href={destination}
                                onClick={() => onOpenChange(false)}
                                className="font-heading text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors block"
                              >
                                {course.title}
                              </Link>

                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {course.isFree ? t("Free", "ফ্রি") : `৳ ${en.amountPaid}`}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => navigateTo(destination)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                                >
                                  <span>
                                    {isActive
                                      ? t("Continue", "চালিয়ে যান")
                                      : t("Details", "বিস্তারিত")}
                                  </span>
                                  <ChevronRight className="size-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {enrollments.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateTo("/profile/enrolled")}
                        className="w-full text-xs font-semibold text-primary hover:bg-primary/5 h-8"
                      >
                        <span>
                          {t(
                            `View all ${enrollments.length} enrolled courses`,
                            `সকল ${enrollments.length}টি কোর্স দেখুন`
                          )}
                        </span>
                        <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Important Action Buttons Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("Essential Shortcuts", "গুরুত্বপূর্ণ শর্টকাট")}
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigateTo("/dashboard")}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LayoutDashboard className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">
                      {t("Dashboard", "ড্যাশবোর্ড")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Overview & stats", "পরিসংখ্যান ও তথ্য")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/profile/achievements")}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-sm"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Trophy className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">
                      {t("My Achievements", "আমার অর্জনসমূহ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Awards & records", "সম্মাননা ও রেকর্ড")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/profile/write")}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-sm"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <PenSquare className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">
                      {t("Write Article", "নিবন্ধ লিখুন")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Publish tech post", "পোস্ট প্রকাশ করুন")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/profile/achievements/add")}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/5 hover:shadow-sm"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <PlusCircle className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">
                      {t("Add Achievement", "অর্জন যোগ করুন")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Submit milestone", "নতুন সম্মাননা জমা")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/profile/posts")}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-sm"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <FileText className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">
                      {t("My Articles", "আমার পোস্ট")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Drafts & published", "খসড়া ও প্রকাশিত")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo("/courses")}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-card p-3 text-left transition-all hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:shadow-sm"
                  >
                    <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <BookOpen className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">
                      {t("Explore Courses", "কোর্স সমূহ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("Workshops & camps", "লার্নিং মেটেরিয়াল")}
                    </span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateTo("/admin")}
                        className="flex flex-col items-start gap-1 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-left transition-all hover:border-rose-500/60 hover:bg-rose-500/10 hover:shadow-sm"
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Shield className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                          {t("Admin Panel", "অ্যাডমিন প্যানেল")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {t("Management portal", "ব্যবস্থাপনা পোর্টাল")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo("/scanner")}
                        className="flex flex-col items-start gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-left transition-all hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-sm"
                      >
                        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <QrCode className="size-4" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          {t("Ticket Scanner", "টিকেট স্ক্যানার")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {t("Live QR check-in", "লাইভ কিউআর চেক-ইন")}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Logged Out Header */
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 text-center space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold text-foreground">
                  {t("Join DPI Computing Society", "ডিপিআই কম্পিউটিং সোসাইটিতে যোগ দিন")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Sign in to track courses, submit achievements, write articles, and connect with peers.",
                    "কোর্স অ্যাক্সেস, অর্জন জমা এবং কমিউনিটিতে যোগ দিতে সাইন ইন করুন।"
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => navigateTo("/join")}
                  className="w-full gap-2"
                >
                  <User className="size-4" />
                  <span>{t("Sign In / Register", "সাইন ইন / নিবন্ধন")}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigateTo("/about")}
                  className="w-full"
                >
                  <span>{t("About the Society", "সোসাইটি সম্পর্কে")}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Social Profiles & Community Presence Section (LinkedIn, Facebook, Twitter, GitHub) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-500" />
                <span>{t("Social & Community Links", "সোশ্যাল ও কমিউনিটি লিংক")}</span>
              </h4>
            </div>

            <div className="grid gap-2">
              {SOCIAL_PROFILES.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 transition-all duration-200 hover:shadow-xs",
                      social.borderClass
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          social.bgClass
                        )}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {isBn ? social.title.bn : social.title.en}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {isBn ? social.desc.bn : social.desc.en}
                        </p>
                      </div>
                    </div>

                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* App Preferences & Controls */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {t("Appearance & Language", "ভাষা ও থিম")}
              </span>
              <div className="flex items-center gap-1.5">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>

            {user && (
              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full justify-center gap-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-3.5" />
                  <span>{t("Sign out from account", "অ্যাকাউন্ট থেকে সাইন আউট")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
