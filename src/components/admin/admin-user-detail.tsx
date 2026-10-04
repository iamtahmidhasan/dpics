"use client"

import { CheckCircle2, Loader2, Trash2, TriangleAlert } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import type { AdminUserDetail } from "@/lib/services/admin-user.service"
import type { AchievementPage, AdminAchievementSummary } from "@/lib/services/achievement.service"

const SECTIONS = ["overview", "account", "member", "instructor", "committee", "achievements", "posts", "courses"] as const

type Section = (typeof SECTIONS)[number]

export function AdminUserDetailView({
  initialUser,
  initialPosts,
  initialAchievements,
  initialEnrollments = [],
  availableCourses = [],
  isSelf,
}: {
  initialUser: AdminUserDetail
  initialPosts?: UserPostsPayload
  initialAchievements?: AchievementPage<AdminAchievementSummary>
  initialEnrollments?: any[]
  availableCourses?: any[]
  isSelf: boolean
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [section, setSection] = useState<Section>("overview")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const LABELS: Record<Section, { en: string; bn: string }> = {
    overview: { en: "Overview", bn: "ওভারভিউ" },
    account: { en: "Account", bn: "অ্যাকাউন্ট" },
    member: { en: "Membership", bn: "সদস্যপদ" },
    instructor: { en: "Instructor", bn: "শিক্ষক" },
    committee: { en: "Committee", bn: "কমিটি" },
    achievements: { en: "Achievements", bn: "অর্জনসমূহ" },
    posts: { en: "Posts", bn: "পোস্ট" },
    courses: { en: "Enrolled Courses", bn: "কোর্সসমূহ" },
  }

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10">
            {user.avatar && (
              <AvatarImage
                keepMounted
                render={<Image src={user.avatar} alt={user.name} width={40} height={40} unoptimized />}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-heading text-lg font-semibold">{user.name}</h1>
            <p className="truncate text-xs/relaxed text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
              {isSelf ? <Badge variant="default">{t("You", "আপনি")}</Badge> : null}
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

      <nav aria-label={t("User sections", "ব্যবহারকারী বিভাগ")} className="border-b border-border">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {SECTIONS.map((value) => {
            const isActive = section === value

            return (
              <li key={value} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSection(value)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "border-b-2 px-3 py-2 text-xs/relaxed font-medium transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(LABELS[value])}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

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
          onManageCommittees={() => setSection("committee")}
        />
      ) : null}

      {/* Remounting on `updatedAt` resets the form fields to the saved values. */}
      {section === "account" ? (
        <AdminAccountForm
          key={`account-${user.updatedAt}`}
          user={user}
          isSelf={isSelf}
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