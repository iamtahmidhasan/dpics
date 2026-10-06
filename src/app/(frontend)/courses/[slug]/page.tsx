import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  FileCode,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  Lock,
  MessageSquare,
  Play,
  PlayCircle,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CourseCard } from "@/components/courses/course-card"
import { CourseCurriculum } from "@/components/courses/course-curriculum"
import { CourseEnrollCta } from "@/components/courses/course-enroll-cta"
import { CoursePreviewTrigger } from "@/components/courses/course-preview-trigger"
import { MarkdownContent } from "@/components/posts/markdown-content"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { isAdmin as checkAdmin } from "@/lib/roles"
import { CourseService } from "@/lib/services/course.service"
import { getSettings } from "@/lib/services/settings.service"
import { getSession } from "@/lib/session"
import { absoluteUrl, breadcrumbJsonLd, NOINDEX } from "@/lib/seo"
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_HEIGHT, DEFAULT_OG_IMAGE_WIDTH, SITE_NAME, SITE_URL } from "@/lib/site"
import { cn } from "cn"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const [{ slug }, lang] = await Promise.all([params, getLang()])
  const course = await CourseService.getCourseBySlug(slug)

  if (!course) {
    return { title: "Course Not Found", robots: NOINDEX }
  }

  const isBn = lang === "bn"
  const title = (isBn && course.titleBn) ? course.titleBn : course.title
  const excerpt = (isBn && course.excerptBn) ? course.excerptBn : (course.excerpt || `Learn ${course.title} with DPI Computing Society`)
  const socialTitle = `${title} | DPICS Academy`
  const url = absoluteUrl(`/courses/${slug}`)
  const image = course.thumbnail ?? undefined

  return {
    // `absolute` keeps the root template from appending the site name again.
    title: { absolute: socialTitle },
    description: excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description: excerpt,
      url,
      images: image
        ? [{ url: image, alt: title }]
        : [
            {
              url: DEFAULT_OG_IMAGE,
              width: DEFAULT_OG_IMAGE_WIDTH,
              height: DEFAULT_OG_IMAGE_HEIGHT,
              alt: socialTitle,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: excerpt,
      images: [image ?? DEFAULT_OG_IMAGE],
    },
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [lang, session, settings] = await Promise.all([
    getLang(),
    getSession(),
    getSettings(),
  ])
  const t = makeT(lang)
  const currentUserId = session?.user?.id
  const isAdmin = session?.user ? checkAdmin(session.user) : false

  const course = await CourseService.getCourseBySlug(slug, currentUserId, isAdmin)

  if (!course) {
    notFound()
  }

  // Aggregate unique instructors across all lessons
  const instructorsMap = new Map<string, any>()
  for (const sec of course.sections) {
    for (const les of sec.lessons) {
      for (const inst of les.instructors || []) {
        const key = inst.instructorId || inst.id || inst.name
        if (key && !instructorsMap.has(key)) {
          instructorsMap.set(key, inst)
        }
      }
    }
  }

  let courseInstructors = Array.from(instructorsMap.values())

  // If no instructors are explicitly linked to lessons yet, fallback to active instructors
  if (courseInstructors.length === 0) {
    const fallbackInstructors = await prisma.instructor.findMany({
      where: { status: "ACTIVE" },
      take: 2,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            selactedImg: true,
            bio: true,
            skills: true,
          },
        },
      },
    })
    courseInstructors = fallbackInstructors.map((fi) => ({
      id: fi.id,
      instructorId: fi.instructorId,
      role: "Instructor",
      name: fi.user.name,
      email: fi.user.email,
      image: Array.isArray(fi.user.image) ? fi.user.image[0] : fi.user.image,
      expertise: fi.user.skills?.join(", ") || "Software Engineering Mentor",
      bio: fi.user.bio || "Senior Instructor at DPI Computing Society.",
    }))
  }

  const leadInstructor = courseInstructors[0]

  // Calculate total duration from lessons
  let totalSeconds = 0
  for (const sec of course.sections) {
    for (const les of sec.lessons) {
      if (les.videoDuration) {
        const parts = les.videoDuration.split(":").map(Number)
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          totalSeconds += parts[0] * 60 + parts[1]
        } else if (
          parts.length === 3 &&
          !isNaN(parts[0]) &&
          !isNaN(parts[1]) &&
          !isNaN(parts[2])
        ) {
          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2]
        }
      }
    }
  }
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const totalDurationFormatted =
    totalMinutes > 60
      ? `${totalHours} hrs`
      : totalMinutes > 0
        ? `${totalMinutes} mins`
        : "Self-Paced"

  // Find the first free preview lesson for quick sidebar launch
  const firstPreviewLesson = course.sections
    .flatMap((s: any) => s.lessons)
    .find((l: any) => l.isPreview)

  // Query 3 related courses
  const relatedCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      id: { not: course.id },
      OR: [{ level: course.level }, { isFree: course.isFree }],
    },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: {
          lessons: {
            select: { id: true, videoDuration: true },
          },
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  })

  // Format discount info
  const hasDiscount = Boolean(
    !course.isFree &&
      course.discountPrice &&
      course.price > (course.discountPrice || 0)
  )
  const discountPercent =
    hasDiscount && course.discountPrice
      ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
      : 0


  // Default course requirements
  const prerequisites = [
    t(
      "A laptop or desktop computer with internet access",
      "ইন্টারনেট সুবিধাসহ একটি ল্যাপটপ বা ডেস্কটপ কম্পিউটার"
    ),
    t(
      "Basic computer literacy and enthusiasm to write code",
      "কম্পিউটার ব্যবহারের সাধারণ জ্ঞান ও শেখার প্রবল আগ্রহ"
    ),
    t(
      "Code editor installed (VS Code recommended)",
      "একটি কোড এডিটর (যেমন Visual Studio Code) ইনস্টল করা"
    ),
  ]

  const isBn = lang === "bn"
  const displayTitle = (isBn && course.titleBn) ? course.titleBn : course.title
  const displayExcerpt = (isBn && course.excerptBn) ? course.excerptBn : course.excerpt
  const displayDescription = (isBn && course.descriptionBn) ? course.descriptionBn : (course.description || course.descriptionBn)

  // Rich-result eligible Course schema + breadcrumb trail matching the nav.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: displayTitle,
    description: displayExcerpt || undefined,
    url: absoluteUrl(`/courses/${slug}`),
    image: course.thumbnail ?? undefined,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL.toString() },
    isAccessibleForFree: Boolean(course.isFree),
  }

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: displayTitle },
  ])

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Academy Navigation Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
        <Link
          href="/courses"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Home className="size-3" />
          <span>{t("Courses", "কোর্সসমূহ")}</span>
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <Link
          href={`/courses?level=${course.level}`}
          className="hover:text-foreground transition-colors uppercase"
        >
          {course.level?.replace("_", " ") || "ALL LEVELS"}
        </Link>
        <ChevronRight className="size-3 text-muted-foreground/60" />
        <span className="text-foreground truncate max-w-xs">{displayTitle}</span>
      </nav>

      {/* Course Hero Banner (Academy Style) */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card/95 to-primary/5 p-6 md:p-10 shadow-xs">
        <div className="max-w-4xl space-y-4">
          {/* Badge Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background/80">
              {course.level?.replace("_", " ") || "ALL LEVELS"}
            </Badge>

            {course.isFree ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold">
                {t("FREE COURSE", "ফ্রি কোর্স")}
              </Badge>
            ) : (
              <Badge className="bg-primary text-primary-foreground text-[10px] font-mono font-bold">
                ৳ {course.discountPrice || course.price}
              </Badge>
            )}

            {hasDiscount ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono font-bold">
                {discountPercent}% OFF
              </Badge>
            ) : null}

            {course.featured ? (
              <Badge className="bg-amber-500 text-white text-[10px] gap-1 shadow-xs">
                <Sparkles className="size-2.5" />
                <span>{t("Featured", "ফিচার্ড")}</span>
              </Badge>
            ) : null}

            <Badge variant="secondary" className="text-[10px] gap-1">
              <Award className="size-2.5" />
              <span>{t("Certificate Included", "সার্টিফিকেট অন্তর্ভুক্ত")}</span>
            </Badge>
          </div>

          {/* Main Course Title */}
          <h1 className="font-heading text-2xl font-extrabold sm:text-3xl lg:text-4xl text-foreground leading-tight tracking-tight">
            {displayTitle}
          </h1>

          {/* Course Pitch / Excerpt */}
          {displayExcerpt ? (
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
              {displayExcerpt}
            </p>
          ) : null}

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
            {leadInstructor ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  {leadInstructor.image ? (
                    <AvatarImage src={leadInstructor.image} alt={leadInstructor.name || ""} />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {leadInstructor.name?.charAt(0).toUpperCase() || "I"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">{leadInstructor.name}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5 font-mono">
              <Layers className="size-3.5 text-primary" />
              <span>
                {course.sections.length} {t("Modules", "মডিউল")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <BookOpen className="size-3.5 text-primary" />
              <span>
                {course.stats?.totalLessons || 0} {t("Lectures", "টি পাঠ")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="size-3.5 text-primary" />
              <span>{totalDurationFormatted}</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <Users className="size-3.5 text-primary" />
              <span>
                {course._count?.enrollments || 0} {t("Enrolled", "শিক্ষার্থী")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <CalendarDays className="size-3.5 text-primary" />
              <span>{formatDate(course.updatedAt, lang)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Course Layout */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
        {/* Left Column: Academic Syllabus & Details */}
        <div className="space-y-8 min-w-0">
          {/* 1. Interactive Course Curriculum Accordion */}
          <CourseCurriculum
            courseTitle={displayTitle}
            courseSlug={course.slug}
            sections={course.sections}
            totalLessons={course.stats?.totalLessons || 0}
            totalDuration={totalDurationFormatted}
            isFree={course.isFree}
            price={course.price}
            discountPrice={course.discountPrice}
            hasAccess={course.hasAccess}
          />

          {/* 2. Course Requirements / Prerequisites */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3">
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              <span>{t("Requirements & Prerequisites", "প্রয়োজনীয় পূর্বশর্ত")}</span>
            </h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {prerequisites.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Detailed Description / Overview with Markdown HTML Rendering */}
          {displayDescription ? (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3">
              <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>{t("Course Description", "কোর্সের বিস্তারিত বিবরণ")}</span>
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <MarkdownContent>{displayDescription}</MarkdownContent>
              </div>
            </section>
          ) : null}

          {/* 4. Meet Your Instructors Section */}
          {courseInstructors.length > 0 ? (
            <section className="space-y-4 border-t border-border pt-6">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                <span>{t("Meet Your Instructors", "ইনস্ট্রাক্টর পরিচিতি")}</span>
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {courseInstructors.map((item: any, idx: number) => {
                  const name = item.name || "Instructor"
                  const initials = name.trim().charAt(0).toUpperCase()
                  const image = item.image
                  const role = item.role || t("Instructor", "শিক্ষক")

                  const profileLink = `/profile/${item.studentId || item.instructorId || item.userId || item.id}`

                  return (
                    <Link
                      key={idx}
                      href={profileLink}
                      className="group flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/50 transition-colors"
                    >
                      <Avatar className="size-12 shrink-0 border border-border">
                        {image ? (
                          <AvatarImage src={image} alt={name} />
                        ) : null}
                        <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            {role}
                          </Badge>
                        </div>

                        {item.expertise ? (
                          <p className="text-[11px] text-primary font-medium line-clamp-1">
                            {item.expertise}
                          </p>
                        ) : null}

                        {item.bio ? (
                          <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                            {item.bio}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* 7. Frequently Asked Questions (FAQ) */}
          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <span>{t("Frequently Asked Questions", "সাধারণ কিছু প্রশ্ন")}</span>
            </h2>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">
                  {t(
                    "When do I get access to the course content?",
                    "কোর্সে যুক্ত হওয়ার পর কখন অ্যাক্সেস পাব?"
                  )}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {course.isFree
                    ? t(
                        "Immediately! As soon as you click Enroll for Free, the course will be unlocked in your learning portal.",
                        "তাৎক্ষণিকভাবে! ফ্রি কোর্সে এনরোল করার সাথে সাথেই ক্লাসরুম পোর্টালে সকল লেকচার আনলক হয়ে যাবে।"
                      )
                    : t(
                        "For paid courses, once you submit your payment transaction ID, our team approves your enrollment and unlocks full access.",
                        "পেইড কোর্সের ক্ষেত্রে আপনার বিকাশ/নগদ পেমেন্ট ট্রানজেকশন আইডি সাবমিট করার পর আমাদের টিম ভেরিফাই করে পূর্ণ অ্যাক্সেস চালু করে দিবে।"
                      )}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">
                  {t("Do I get lifetime access to the materials?", "আমি কি আজীবন অ্যাক্সেস পাব?")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    "Yes! You will have lifetime access to all lectures, project resources, code repositories, and future updates to this course.",
                    "হ্যাঁ! একবার এনরোল করলে আপনি এই কোর্সের সকল ভিডিও, রিসোর্স ও ভবিষ্যতের সব আপডেটে আজীবন অ্যাক্সেস পাবেন।"
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground">
                  {t(
                    "How can I ask questions if I get stuck?",
                    "কোডিংয়ে কোনো সমস্যা হলে সাহায্য কীভাবে পাব?"
                  )}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    "Every lesson in the classroom has an active discussion area. You can also connect with instructors and peers directly in our community channels.",
                    "ক্লাসরুমের প্রতিটি পাঠের নিচে আলোচনা সেকশন রয়েছে। এছাড়া সোসাইটির ডিসকর্ড/গ্রুপে সরাসরি সিনিয়র ও ইনস্ট্রাক্টরদের সাহায্য পাবেন।"
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Tags */}
          {course.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
              <span className="text-xs text-muted-foreground font-mono mr-1">
                {t("Tags:", "ট্যাগ:")}
              </span>
              {course.tags.map((tag: string) => (
                <Link key={tag} href={`/courses?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="text-[10px] font-normal hover:bg-muted">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right Column: Sticky Tuition & Enrollment Card */}
        <aside className="sticky top-6 space-y-4">
          <Card id="enroll" className="overflow-hidden border-border shadow-md">
            {/* Preview Thumbnail with Play Icon & Interactive Modal Trigger */}
            <CoursePreviewTrigger
              thumbnail={course.thumbnail}
              title={course.title}
              duration={totalDurationFormatted}
              firstPreviewLessonId={firstPreviewLesson?.id}
            />

            {/* Tuition Pricing Header */}
            <CardHeader className="pb-3 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-muted-foreground font-semibold">
                  {t("Tuition Fee", "কোর্স ফি")}
                </span>
                {hasDiscount ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono font-bold">
                    {discountPercent}% {t("OFF", "ছাড়")}
                  </Badge>
                ) : null}
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                {course.isFree ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {t("Free", "ফ্রি")}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      ({t("100% Free Forever", "১০০% সম্পূর্ণ ফ্রি")})
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="font-heading text-3xl font-black text-foreground">
                      ৳ {course.discountPrice || course.price}
                    </span>
                    {hasDiscount ? (
                      <span className="text-sm text-muted-foreground line-through font-mono">
                        ৳ {course.price}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </CardHeader>

            {/* Enrollment CTA & Highlights */}
            <CardContent className="space-y-5 pt-0">
              {/* Primary Enrollment Action Button */}
              <CourseEnrollCta
                course={{
                  id: course.id,
                  title: course.title,
                  slug: course.slug,
                  isFree: course.isFree,
                  price: course.price,
                  discountPrice: course.discountPrice,
                }}
                enrollment={course.enrollment}
                isAuthenticated={Boolean(session?.user)}
                paymentSettings={{
                  bkashPersonalNumber: settings.bkashPersonalNumber,
                  nagadPersonalNumber: settings.nagadPersonalNumber,
                  rocketPersonalNumber: settings.rocketPersonalNumber,
                }}
              />

              <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                  <span>{t("Full lifetime access to all lessons", "সব পাঠে আজীবন অ্যাক্সেস")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>
                    {t(
                      "Access on mobile, tablet & desktop",
                      "মোবাইল, ট্যাবলেট ও পিসিতে ব্যবহার উপযোগী"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>{t("Quizzes & hands-on assignments", "অনুশীলনী কুইজ ও অ্যাসাইনমেন্ট")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>
                    {t("Verified certificate of completion", "যাচাইযোগ্য কোর্স সমাপ্তি সনদ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>
                    {t("Direct instructor & community support", "সরাসরি শিক্ষক ও কমিউনিটি সহায়তা")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Related Courses Section */}
      {relatedCourses.length > 0 ? (
        <section className="space-y-5 border-t border-border pt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                {t("Related Courses You Might Like", "সম্পর্কিত অন্যান্য কোর্স")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "Continue expanding your technical stack with these tracks",
                  "আপনার স্কিল বাড়াতে এই কোর্সগুলো দেখতে পারেন"
                )}
              </p>
            </div>
            <Link
              href="/courses"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("Explore all", "সব দেখুন")}
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((item) => (
              <CourseCard key={item.id} course={item} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
