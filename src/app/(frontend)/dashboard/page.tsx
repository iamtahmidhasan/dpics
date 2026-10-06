import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  PlayCircle,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  UserCheck,
  Users,
  Video,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DashboardSignOutButton } from "@/components/dashboard/dashboard-sign-out"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { requireUser, isAdmin } from "@/lib/session"
import { resolveUserImage } from "@/lib/user-image"
import {
  departmentLabel,
  semesterLabel,
  shiftLabel,
  verificationStatusLabel,
} from "@/lib/profile-labels"
import { EventRegistrationStatus, Role, VerificationStatus } from "@/generated/prisma/enums"
import { NOINDEX } from "@/lib/seo"
import { cn } from "cn"

export const metadata: Metadata = {
  title: "Dashboard Overview",
  description: "Member and student overview dashboard for DPI Computing Society.",
  robots: NOINDEX,
}

export default async function DashboardOverviewPage() {
  const session = await requireUser()
  const lang = await getLang()
  const t = makeT(lang)
  const isBn = lang === "bn"

  // Fetch full user record including enrollments, event registrations, and counts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      member: true,
      instructor: true,
      courseEnrollments: {
        include: {
          course: {
            include: {
              sections: {
                include: {
                  lessons: { select: { id: true } },
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        take: 3,
      },
      eventRegistrations: {
        include: {
          event: true,
        },
        orderBy: { registeredAt: "desc" },
        take: 3,
      },
      _count: {
        select: {
          posts: true,
          achievements: true,
          courseEnrollments: true,
          eventRegistrations: true,
        },
      },
    },
  })

  if (!user) {
    redirect("/join")
  }

  const { avatar } = resolveUserImage(user.image, user.selactedImg)
  const isUserAdmin = isAdmin(user)
  const isVerifiedMember = user.member?.verificationStatus === VerificationStatus.VERIFIED

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-8">
      {/* 1. Header Profile & Welcome Banner Card */}
      <Card className="relative overflow-hidden bg-card">

        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* User Avatar & Info */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <Avatar className="size-16 sm:size-20 rounded-2xl border-2 border-primary/30 shadow-md shrink-0">
                <AvatarImage src={avatar || undefined} alt={user.name} />
                <AvatarFallback className="rounded-2xl text-xl sm:text-2xl font-black bg-primary/10 text-primary">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                    {t("Welcome,", "স্বাগতম,")} {user.name}!
                  </h1>

                  {/* Verification Badge */}
                  {user.member && (
                    <Badge
                      variant={isVerifiedMember ? "success" : "warning"}
                      className="text-[10px] font-semibold gap-1"
                    >
                      {isVerifiedMember ? (
                        <>
                          <CheckCircle2 className="size-3" />
                          <span>{t("Verified Member", "যাচাইকৃত সদস্য")}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="size-3" />
                          <span>{t("Verification Pending", "অপেক্ষমান")}</span>
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground truncate">{user.email}</p>

                {/* Roles & Identifiers */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {user.roles.map((r) => (
                    <Badge
                      key={r}
                      variant={r === Role.ADMIN ? "default" : "secondary"}
                      className="text-[10px] px-2 py-0"
                    >
                      {r}
                    </Badge>
                  ))}

                  {user.member?.studentId && (
                    <span className="font-mono text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      ID: {user.member.studentId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Overview Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Metric 1: Courses */}
        <Card className="border-border/70 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Courses", "কোর্সসমূহ")}
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {user._count.courseEnrollments}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("Enrolled courses", "এনরোল করা কোর্স")}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link
              href="/profile/enrolled"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("Go to Classroom", "ক্লাসরুমে যান")}</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* Metric 2: Events */}
        <Card className="border-border/70 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Event Passes", "ইভেন্ট পাস")}
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Ticket className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {user._count.eventRegistrations}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("Registered events", "নিবন্ধিত ইভেন্ট")}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link
              href="/events"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("Browse Events", "ইভেন্ট দেখুন")}</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* Metric 3: Community Posts */}
        <Card className="border-border/70 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Articles", "নিবন্ধসমূহ")}
            </CardTitle>
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
              <FileText className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {user._count.posts}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("Community posts written", "প্রকাশিত টেক নিবন্ধ")}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link
              href="/profile/posts"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("Manage Articles", "নিবন্ধসমূহ")}</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* Metric 4: Achievements */}
        <Card className="border-border/70 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Achievements", "অর্জনসমূহ")}
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Trophy className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {user._count.achievements}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("Recognitions & awards", "পুরস্কার ও মাইলফলক")}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link
              href="/profile/achievements"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("View Trophies", "অর্জনসমূহ")}</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Enrolled Courses & Event Passes (2 Cols) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Active Courses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {t("My Learning & Courses", "আমার পাঠ্যক্রম ও কোর্স")}
                </h2>
              </div>

              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/courses" />}
                className="text-xs gap-1"
              >
                <span>{t("Explore Courses", "সকল কোর্স")}</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>

            {user.courseEnrollments.length === 0 ? (
              <Card className="border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <BookOpen className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-sm text-foreground">
                  {t("No courses enrolled yet", "এখনও কোনো কোর্সে যুক্ত হননি")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  {t(
                    "Enroll in interactive workshops, programming tracks, and web development courses.",
                    "ইন্টারেক্টিভ কর্মশালা, প্রোগ্রামিং ট্র্যাক এবং ওয়েব ডেভেলপমেন্ট কোর্সে অংশ নিন।"
                  )}
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/courses" />}
                    className="text-xs font-semibold"
                  >
                    {t("Explore Course Catalog", "কোর্স ক্যাটালগ দেখুন")}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {user.courseEnrollments.map((en) => {
                  const course = en.course
                  const isActive = en.status === "ACTIVE"
                  const isPending = en.status === "PENDING"
                  const totalLessons = course.sections.reduce(
                    (acc, s) => acc + s.lessons.length,
                    0
                  )

                  return (
                    <Card
                      key={en.id}
                      className="flex flex-col justify-between border-border/70 hover:border-primary/50 transition-all hover:shadow-xs"
                    >
                      <CardHeader className="space-y-2 pb-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={isActive ? "success" : isPending ? "warning" : "destructive"}
                            className="text-[10px]"
                          >
                            {isActive
                              ? t("Enrolled", "এনরোলড")
                              : isPending
                              ? t("Pending Approval", "অপেক্ষমান")
                              : en.status}
                          </Badge>

                          <span className="text-[11px] text-muted-foreground">
                            {totalLessons} {t("lessons", "টি পাঠ")}
                          </span>
                        </div>

                        <CardTitle className="line-clamp-1 text-sm font-bold text-foreground">
                          {isBn && course.titleBn ? course.titleBn : course.title}
                        </CardTitle>
                      </CardHeader>

                      <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          {course.isFree ? t("Free", "ফ্রি") : `৳ ${en.amountPaid}`}
                        </span>

                        {isActive ? (
                          <Button
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/courses/${course.slug}/learn`} />}
                            className="h-8 text-xs font-medium gap-1.5"
                          >
                            <PlayCircle className="size-3.5" />
                            <span>{t("Classroom", "ক্লাসরুম")}</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/courses/${course.slug}`} />}
                            className="h-8 text-xs font-medium"
                          >
                            <span>{t("View Details", "বিস্তারিত")}</span>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Registered Events Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="size-5 text-primary" />
                <h2 className="font-heading text-lg font-bold text-foreground">
                  {t("My Registered Events & Passes", "আমার নিবন্ধিত ইভেন্ট ও প্রবেশ পাস")}
                </h2>
              </div>

              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/events" />}
                className="text-xs gap-1"
              >
                <span>{t("All Events", "সকল ইভেন্ট")}</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>

            {user.eventRegistrations.length === 0 ? (
              <Card className="border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <Calendar className="mx-auto size-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-sm text-foreground">
                  {t("No event registrations yet", "কোনো ইভেন্টে এখনও নিবন্ধন করেননি")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  {t(
                    "Join upcoming hackathons, programming bootcamps, and technical seminars.",
                    "আসন্ন হ্যাকাথন, প্রোগ্রামিং বুটক্যাম্প এবং সেমিনারে অংশ নিতে নিবন্ধন করুন।"
                  )}
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/events" />}
                    className="text-xs font-semibold"
                  >
                    {t("Explore Upcoming Events", "আসন্ন ইভেন্ট দেখুন")}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {user.eventRegistrations.map((reg) => {
                  const event = reg.event
                  const isConfirmed = reg.status === EventRegistrationStatus.CONFIRMED
                  const isAttended = reg.status === EventRegistrationStatus.ATTENDED

                  const eventDate = new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(event.startDate))

                  return (
                    <Card
                      key={reg.id}
                      className="flex flex-col justify-between border-border/70 hover:border-primary/50 transition-all hover:shadow-xs"
                    >
                      <CardHeader className="space-y-2 pb-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              isConfirmed || isAttended
                                ? "success"
                                : reg.status === EventRegistrationStatus.PENDING
                                ? "warning"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {reg.status}
                          </Badge>

                          <span className="font-mono text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                            {reg.ticketCode}
                          </span>
                        </div>

                        <CardTitle className="line-clamp-1 text-sm font-bold text-foreground">
                          {isBn && event.titleBn ? event.titleBn : event.title}
                        </CardTitle>

                        <div className="space-y-1 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3 text-primary shrink-0" />
                            <span>{eventDate}</span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3 text-primary shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {event.isFree ? t("Free", "ফ্রি") : `৳ ${reg.amountPaid}`}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={<Link href={`/events/ticket/${reg.ticketCode}`} target="_blank" />}
                          className="h-8 text-xs font-medium gap-1"
                        >
                          <ExternalLink className="size-3" />
                          <span>{t("View Pass", "পাস দেখুন")}</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Membership & Quick Actions (1 Col) */}
        <div className="space-y-6">
          {/* Membership Profile Card */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <CardTitle className="text-sm font-bold">
                  {t("Society Membership", "সোসাইটি সদস্যপদ")}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t("Official record & academic profile", "অফিসিয়াল তথ্য ও একাডেমিক প্রোফাইল")}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5 text-xs">
              {user.member ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("Status", "স্ট্যাটাস")}:</span>
                    <Badge
                      variant={isVerifiedMember ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {verificationStatusLabel(t)(user.member.verificationStatus)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("Member / Roll ID", "রোল / আইডি")}:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {user.member.studentId || user.member.boardOrClassRoll || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-0.5">{t("Department", "বিভাগ")}:</span>
                    <span className="font-medium text-foreground text-[11px]">
                      {departmentLabel(t)(user.member.department)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("Semester & Shift", "সেমিস্টার ও শিফট")}:</span>
                    <span className="font-medium text-foreground">
                      {semesterLabel(t)(user.member.semester)} · {shiftLabel(t)(user.member.shift)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("Session", "সেশন")}:</span>
                    <span className="font-medium text-foreground">{user.member.session}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">{t("Membership Fee", "সদস্য ফি")}:</span>
                    <span
                      className={cn(
                        "font-semibold text-xs",
                        user.member.hasPaidMembershipFee ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {user.member.hasPaidMembershipFee
                        ? t("Completed", "পরিশোধিত")
                        : t("Unpaid / Pending", "অপরিশোধিত")}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "You have an active user account. Join as a registered society member to access student benefits.",
                      "সোসাইটির পূর্ণাঙ্গ সদস্যপদ পেতে রেজিস্ট্রেশন সম্পন্ন করুন।"
                    )}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/profile/member" />}
                    className="text-xs"
                  >
                    {t("Complete Member Profile", "সদস্য ফর্ম পূরণ করুন")}
                  </Button>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/profile" />}
                className="w-full text-xs text-primary font-medium"
              >
                <span>{t("View Full Profile Details", "সম্পূর্ণ প্রোফাইল দেখুন")}</span>
                <ArrowRight className="size-3 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Actions Shortcuts Card */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                <CardTitle className="text-sm font-bold">
                  {t("Quick Shortcuts", "দ্রুত লিংক")}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-1 p-2">
              <Link
                href="/events"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>{t("Upcoming Hackathons & Seminars", "আসন্ন ইভেন্ট ও হ্যাকাথন")}</span>
                </div>
                <ArrowRight className="size-3 text-muted-foreground" />
              </Link>

              <Link
                href="/courses"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="size-3.5 text-emerald-500" />
                  <span>{t("Browse Courses & Tracks", "অনলাইন কোর্স ক্যাটালগ")}</span>
                </div>
                <ArrowRight className="size-3 text-muted-foreground" />
              </Link>

              <Link
                href="/profile/write"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="size-3.5 text-sky-500" />
                  <span>{t("Write a Tech Article", "নতুন ব্লগ বা আর্টিকেল লিখুন")}</span>
                </div>
                <ArrowRight className="size-3 text-muted-foreground" />
              </Link>

              <Link
                href="/profile/achievements/add"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="size-3.5 text-amber-500" />
                  <span>{t("Submit Contest Award", "অর্জন বা পুরস্কার জমা দিন")}</span>
                </div>
                <ArrowRight className="size-3 text-muted-foreground" />
              </Link>

              <Link
                href="/members"
                className="flex items-center justify-between rounded-lg p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="size-3.5 text-purple-500" />
                  <span>{t("Society Member Directory", "সদস্যবৃন্দের ডিরেক্টরি")}</span>
                </div>
                <ArrowRight className="size-3 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
