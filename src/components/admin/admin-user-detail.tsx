"use client"

import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import {
  AdminAccountForm,
  AdminCommitteeForm,
  AdminInstructorForm,
  AdminMemberForm,
} from "./admin-user-forms"
import { AdminUserOverview } from "./admin-user-overview"
import type { AdminUserDetail } from "@/lib/services/admin-user.service"

const SECTIONS = ["overview", "account", "member", "instructor", "committee"] as const

type Section = (typeof SECTIONS)[number]

export function AdminUserDetailView({
  initialUser,
  isSelf,
}: {
  initialUser: AdminUserDetail
  isSelf: boolean
}) {
  const { t } = useLanguage()
  const [user, setUser] = useState(initialUser)
  const [section, setSection] = useState<Section>("overview")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const LABELS: Record<Section, { en: string; bn: string }> = {
    overview: { en: "Overview", bn: "ওভারভিউ" },
    account: { en: "Account", bn: "অ্যাকাউন্ট" },
    member: { en: "Membership", bn: "সদস্যপদ" },
    instructor: { en: "Instructor", bn: "শিক্ষক" },
    committee: { en: "Committee", bn: "কমিটি" },
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

        <Link
          href="/admin/users"
          className="rounded-md border border-border px-2.5 py-1.5 text-xs/relaxed transition-colors hover:bg-muted"
        >
          {t("Back to users", "ব্যবহারকারীদের ফিরুন")}
        </Link>
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
    </div>
  )
}