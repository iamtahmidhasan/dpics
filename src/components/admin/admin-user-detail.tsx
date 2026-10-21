"use client"

import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderTree,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Loader2,
  Trash2,
  TriangleAlert,
  Trophy,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "cn"
import {
  AdminAccountForm,
  AdminCommitteeForm,
  AdminInstructorForm,
  AdminMemberForm,
} from "./admin-user-forms"
import { AdminUserCourses } from "./admin-user-courses"
import { AdminUserOverview } from "./admin-user-overview"
import { AdminUserPosts, type UserPostsPayload } from "./admin-user-posts"
import { AdminUserAchievements } from "./admin-user-achievements"
import { AdminUserMedia } from "./admin-user-media"
import { AdminUserTemplates } from "./admin-user-templates"
import type { AdminUserDetail } from "@/lib/services/admin-user.service"
import type { AchievementPage, AdminAchievementSummary } from "@/lib/services/achievement.service"
import type { MediaTemplateSummary, TemplateAssignmentSummary } from "@/lib/template-engine/types"

const SECTIONS = [
  "overview",
  "account",
  "member",
  "instructor",
  "committee",
  "achievements",
  "posts",
  "courses",
  "templates",
  "media",
] as const

type Section = (typeof SECTIONS)[number]

type SectionMeta = {
  id: Section
  label: { en: string; bn: string }
  description: { en: string; bn: string }
  icon: LucideIcon
  colorClass: {
    bg: string
    text: string
  }
}

const SECTION_CONFIG: SectionMeta[] = [
  {
    id: "overview",
    label: { en: "Overview", bn: "ওভারভিউ" },
    description: {
      en: "Profile summary, roles, badges & account status",
      bn: "প্রোফাইল সারসংক্ষেপ, ভূমিকা, ব্যাজ ও অ্যাকাউন্টের অবস্থা",
    },
    icon: LayoutDashboard,
    colorClass: {
      bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    },
  },
  {
    id: "account",
    label: { en: "Account Details", bn: "অ্যাকাউন্ট বিবরণ" },
    description: {
      en: "Personal details, phone, bio, address & security",
      bn: "ব্যক্তিগত তথ্য, ফোন, পরিচিতি, ঠিকানা ও নিরাপত্তা",
    },
    icon: UserCog,
    colorClass: {
      bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
  {
    id: "member",
    label: { en: "Membership", bn: "সদস্যপদ" },
    description: {
      en: "Department, session, semester & verification",
      bn: "বিভাগ, সেশন, পর্ব ও সদস্যপদ যাচাইকরণ",
    },
    icon: BadgeCheck,
    colorClass: {
      bg: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      text: "text-teal-600 dark:text-teal-400",
    },
  },
  {
    id: "instructor",
    label: { en: "Instructor Profile", bn: "শিক্ষক প্রোফাইল" },
    description: {
      en: "Instructor ID, teaching status & credentials",
      bn: "শিক্ষক আইডি, স্ট্যাটাস ও তথ্য",
    },
    icon: Wrench,
    colorClass: {
      bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      text: "text-amber-600 dark:text-amber-400",
    },
  },
  {
    id: "committee",
    label: { en: "Committee Roles", bn: "কমিটি ভূমিকা" },
    description: {
      en: "Designations & committee assignments",
      bn: "পদবি ও কার্যনির্বাহী কমিটি সংযুক্তি",
    },
    icon: Award,
    colorClass: {
      bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    id: "achievements",
    label: { en: "Achievements", bn: "অর্জনসমূহ" },
    description: {
      en: "Awards, hackathons & contest ranking",
      bn: "পুরস্কার, হ্যাকাথন ও সম্মাননা",
    },
    icon: Trophy,
    colorClass: {
      bg: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
      text: "text-yellow-600 dark:text-yellow-400",
    },
  },
  {
    id: "posts",
    label: { en: "Posts & Articles", bn: "পোস্ট ও আর্টিকেল" },
    description: {
      en: "Articles authored, drafts & publications",
      bn: "রচিত আর্টিকেল, ড্রাফট ও প্রকাশনা",
    },
    icon: FileText,
    colorClass: {
      bg: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      text: "text-sky-600 dark:text-sky-400",
    },
  },
  {
    id: "courses",
    label: { en: "Enrolled Courses", bn: "কোর্সসমূহ" },
    description: {
      en: "Course enrollments, payment & lesson progress",
      bn: "কোর্স ভর্তি, পেমেন্ট ও শেখার অগ্রগতি",
    },
    icon: GraduationCap,
    colorClass: {
      bg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      text: "text-indigo-600 dark:text-indigo-400",
    },
  },
  {
    id: "templates",
    label: { en: "Cards & Templates", bn: "কার্ড ও টেমপ্লেট" },
    description: {
      en: "Assigned ID card & certificate templates",
      bn: "নির্ধারিত আইডি কার্ড ও সনদপত্র টেমপ্লেট",
    },
    icon: IdCard,
    colorClass: {
      bg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      text: "text-rose-600 dark:text-rose-400",
    },
  },
  {
    id: "media",
    label: { en: "Media & Documents", bn: "মিডিয়া ও ডকুমেন্টস" },
    description: {
      en: "Uploaded student ID card, NID & document assets",
      bn: "আপলোডকৃত স্টুডেন্ট আইডি, এনআইডি ও ডকুমেন্ট ফাইল",
    },
    icon: FolderTree,
    colorClass: {
      bg: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
      text: "text-pink-600 dark:text-pink-400",
    },
  },
]

export function AdminUserDetailView({
  initialUser,
  initialPosts,
  initialAchievements,
  initialEnrollments = [],
  availableCourses = [],
  initialTemplateAssignments = [],
  availableTemplates = [],
  isSelf,
  isActorSuperAdmin = false,
}: {
  initialUser: AdminUserDetail
  initialPosts?: UserPostsPayload
  initialAchievements?: AchievementPage<AdminAchievementSummary>
  initialEnrollments?: unknown[]
  availableCourses?: unknown[]
  initialTemplateAssignments?: TemplateAssignmentSummary[]
  availableTemplates?: MediaTemplateSummary[]
  isSelf: boolean
  isActorSuperAdmin?: boolean
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = searchParams.get("tab") as Section | null

  const [user, setUser] = useState(initialUser)
  const [section, setSection] = useState<Section>(
    initialTab && SECTIONS.includes(initialTab) ? initialTab : "overview"
  )
  const [mobileSection, setMobileSection] = useState<Section | null>(
    initialTab && SECTIONS.includes(initialTab) ? initialTab : null
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleSelectSection(sec: Section) {
    setSection(sec)
    setMobileSection(sec)
  }

  const activeSectionMeta = SECTION_CONFIG.find((s) => s.id === section)

  async function save(payload: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Request failed")
      }

      setUser(body as AdminUserDetail)
      setSaved(true)
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Request failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(
          body?.error?.message ?? t("Failed to delete user", "ব্যবহারকারী মুছে ফেলতে ব্যর্থ হয়েছে")
        )
      }

      router.push("/admin/users")
      router.refresh()
    } catch (cause: unknown) {
      setDeleteError(cause instanceof Error ? cause.message : t("Request failed", "অনুরোধ ব্যর্থ হয়েছে"))
      setIsDeleting(false)
    }
  }

  const initials = (user.name || user.email || "?").trim().charAt(0).toUpperCase()

  return (
    <div className="space-y-4">
      {/* User Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-3.5 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-border/70 bg-card sm:bg-transparent">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-11 sm:size-10 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
            {user.avatar && (
              <AvatarImage
                keepMounted
                render={<Image src={user.avatar} alt={user.name} width={44} height={44} unoptimized />}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-heading text-base sm:text-lg font-semibold">{user.name}</h1>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0 h-4.5">
                  {role}
                </Badge>
              ))}
              {isSelf ? <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4.5">{t("You", "আপনি")}</Badge> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="rounded-md border border-border px-2.5 py-1.5 text-xs/relaxed transition-colors hover:bg-muted"
          >
            {t("Back to users", "ব্যবহারকারীদের ফিরুন")}
          </Link>
        </div>
      </div>

      {/* Desktop Horizontal Tab Bar (>= md) */}
      <nav aria-label={t("User sections", "ব্যবহারকারী বিভাগ")} className="hidden md:block border-b border-border">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {SECTION_CONFIG.map((item) => {
            const isActive = section === item.id
            const Icon = item.icon

            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectSection(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs/relaxed font-medium transition-colors",
                    isActive
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{t(item.label)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Mobile Tabs List (< md when on master view) */}
      {mobileSection === null && (
        <div className="space-y-2.5 md:hidden pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-1 pt-1">
            {t("User Sections & Details", "ব্যবহারকারী বিভাগ ও বিবরণ")}
          </h2>

          <div className="space-y-1.5">
            {SECTION_CONFIG.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSection(item.id)}
                  className="w-full text-left group flex items-center justify-between gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/40 active:bg-accent/70 active:scale-[0.99] transition-all duration-150 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        item.colorClass.bg
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {t(item.label)}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {t(item.description)}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile Back Header (< md when viewing a specific section) */}
      {mobileSection !== null && (
        <div className="md:hidden flex items-center justify-between pb-3 mb-1 border-b border-border/60">
          <button
            type="button"
            onClick={() => setMobileSection(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all -ml-1"
          >
            <ChevronLeft className="size-4" />
            <span>{t("All Sections", "সকল বিভাগ")}</span>
          </button>

          {activeSectionMeta && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <activeSectionMeta.icon className="size-3.5 text-primary" />
              <span className="truncate max-w-[170px]">{t(activeSectionMeta.label)}</span>
            </div>
          )}
        </div>
      )}

      {/* Section Content Area (Always visible on desktop, visible on mobile when section is active) */}
      <div className={mobileSection === null ? "hidden md:block space-y-6" : "space-y-6"}>
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs/relaxed text-destructive"
          >
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}

        {saved && !error ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs/relaxed text-success"
          >
            <CheckCircle2 className="size-3.5" />
            {t("Saved.", "সংরক্ষণ হয়েছে।")}
          </p>
        ) : null}

        {saving ? (
          <p className="flex items-center gap-2 text-xs/relaxed text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {t("Saving...", "সংরক্ষণ হচ্ছে...")}
          </p>
        ) : null}

        {section === "overview" ? (
          <AdminUserOverview
            user={user}
            isSelf={isSelf}
            onManageCommittees={() => handleSelectSection("committee")}
          />
        ) : null}

        {/* Remounting on `updatedAt` resets the form fields to the saved values. */}
        {section === "account" ? (
          <AdminAccountForm
            key={`account-${user.updatedAt}`}
            user={user}
            isSelf={isSelf}
            isActorSuperAdmin={isActorSuperAdmin}
            saving={saving}
            onSave={save}
          />
        ) : null}

        {section === "member" ? (
          <AdminMemberForm
            key={`member-${user.updatedAt}`}
            user={user}
            saving={saving}
            onSave={save}
          />
        ) : null}

        {section === "instructor" ? (
          <AdminInstructorForm
            key={`instructor-${user.updatedAt}`}
            user={user}
            saving={saving}
            onSave={save}
          />
        ) : null}

        {section === "committee" ? (
          <AdminCommitteeForm
            key={`committee-${user.updatedAt}`}
            user={user}
            onUserUpdated={setUser}
          />
        ) : null}

        {section === "achievements" ? (
          <AdminUserAchievements
            userId={user.id}
            userName={user.name || user.email}
            initialAchievements={initialAchievements}
          />
        ) : null}

        {section === "posts" ? (
          <AdminUserPosts
            userId={user.id}
            userName={user.name || user.email}
            initialPosts={initialPosts ?? { posts: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }}
          />
        ) : null}

        {section === "courses" ? (
          <AdminUserCourses
            userId={user.id}
            userName={user.name || user.email}
            initialEnrollments={initialEnrollments}
            availableCourses={availableCourses}
          />
        ) : null}

        {section === "templates" ? (
          <AdminUserTemplates
            user={user}
            initialAssignments={initialTemplateAssignments}
            availableTemplates={availableTemplates}
          />
        ) : null}

        {section === "media" ? (
          <AdminUserMedia user={user} isSelf={isSelf} />
        ) : null}

        {/* Danger Zone */}
        {!isSelf && (
          <Card className="border-destructive/30 bg-destructive/5 mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="size-4" />
                {t("Danger zone", "বিপদজনক অঞ্চল")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t(
                  "Permanently delete this user and all associated records (membership, student ID, instructor profile, committee roles, and active sessions).",
                  "এই ব্যবহারকারী এবং তার সমস্ত সম্পর্কিত তথ্য (সদস্যপদ, স্টুডেন্ট আইডি, শিক্ষক প্রোফাইল, কমিটি পদবি এবং সেশন) স্থায়ীভাবে মুছে ফেলুন।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end pt-0">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-3.5" data-icon="inline-start" />
                {t("Delete user", "ব্যবহারকারী মুছুন")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) setDeleteError(null)
          setShowDeleteDialog(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              {t("Delete user permanently?", "ব্যবহারকারী স্থায়ীভাবে মুছে ফেলবেন?")}
            </DialogTitle>
            <DialogDescription className="space-y-2 text-xs/relaxed pt-2">
              <span>
                {t(
                  `Are you sure you want to delete "${user.name}" (${user.email})?`,
                  `আপনি কি নিশ্চিত যে "${user.name}" (${user.email}) মুছে ফেলতে চান?`
                )}
              </span>
              <span className="block text-destructive/90 font-medium">
                {t(
                  "This action cannot be undone. All data across all models (membership profile, student ID, instructor profile, committee roles, sessions, and login accounts) will be deleted immediately.",
                  "এই কাজটি অপরিবর্তনীয়। এই ব্যবহারকারীর সাথে সম্পর্কিত সমস্ত তথ্য (সদস্য প্রোফাইল, স্টুডেন্ট আইডি, শিক্ষক প্রোফাইল, কমিটি পদবি, সেশন এবং অ্যাকাউন্ট লগইন) অবিলম্বে স্থায়ীভাবে মুছে যাবে।"
                )}
              </span>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              {isDeleting
                ? t("Deleting...", "মুছে ফেলা হচ্ছে...")
                : t("Confirm delete", "মুছে ফেলা নিশ্চিত করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}