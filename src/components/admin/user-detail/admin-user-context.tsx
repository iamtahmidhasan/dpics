"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import type { AdminUserDetail } from "@/lib/services/admin-user.service"
import type { AchievementPage, AdminAchievementSummary } from "@/lib/services/achievement.service"
import type { ProjectListResult } from "@/lib/services/project.service"
import type { MediaTemplateSummary, TemplateAssignmentSummary } from "@/lib/template-engine/types"
import type { UserPostsPayload } from "@/components/admin/admin-user-posts"

interface AdminUserContextType {
  user: AdminUserDetail
  setUser: React.Dispatch<React.SetStateAction<AdminUserDetail>>
  save: (payload: Record<string, unknown>) => Promise<void>
  saving: boolean
  error: string | null
  saved: boolean
  handleDelete: () => Promise<void>
  isDeleting: boolean
  deleteError: string | null
  showDeleteDialog: boolean
  setShowDeleteDialog: (open: boolean) => void
  isSelf: boolean
  isActorSuperAdmin: boolean
  posts?: UserPostsPayload
  achievements?: AchievementPage<AdminAchievementSummary>
  projects?: ProjectListResult
  enrollments: unknown[]
  availableCourses: unknown[]
  templateAssignments: TemplateAssignmentSummary[]
  availableTemplates: MediaTemplateSummary[]
}

const AdminUserContext = createContext<AdminUserContextType | null>(null)

export function AdminUserProvider({
  children,
  initialUser,
  initialPosts,
  initialAchievements,
  initialProjects,
  initialEnrollments = [],
  availableCourses = [],
  initialTemplateAssignments = [],
  availableTemplates = [],
  isSelf,
  isActorSuperAdmin = false,
}: {
  children: ReactNode
  initialUser: AdminUserDetail
  initialPosts?: UserPostsPayload
  initialAchievements?: AchievementPage<AdminAchievementSummary>
  initialProjects?: ProjectListResult
  initialEnrollments?: unknown[]
  availableCourses?: unknown[]
  initialTemplateAssignments?: TemplateAssignmentSummary[]
  availableTemplates?: MediaTemplateSummary[]
  isSelf: boolean
  isActorSuperAdmin?: boolean
}) {
  const { t } = useLanguage()
  const router = useRouter()

  const [user, setUser] = useState(initialUser)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      router.refresh()
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

  return (
    <AdminUserContext.Provider
      value={{
        user,
        setUser,
        save,
        saving,
        error,
        saved,
        handleDelete,
        isDeleting,
        deleteError,
        showDeleteDialog,
        setShowDeleteDialog,
        isSelf,
        isActorSuperAdmin,
        posts: initialPosts,
        achievements: initialAchievements,
        projects: initialProjects,
        enrollments: initialEnrollments,
        availableCourses,
        templateAssignments: initialTemplateAssignments,
        availableTemplates,
      }}
    >
      {children}
    </AdminUserContext.Provider>
  )
}

export function useAdminUser() {
  const ctx = useContext(AdminUserContext)
  if (!ctx) {
    throw new Error("useAdminUser must be used within an AdminUserProvider")
  }
  return ctx
}
