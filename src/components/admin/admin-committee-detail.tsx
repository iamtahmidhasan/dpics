"use client"

import {
  ArrowLeft,
  Calendar,
  Check,
  Edit2,
  FolderPlus,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckboxField, TextAreaField, TextField } from "@/components/form-fields"
import { formatDate } from "@/lib/format"
import type {
  AssignableUserSummary,
  CommitteeDetail,
  CommitteeMemberDetail,
  CommitteeRoleDetail,
} from "@/lib/services/committee.service"

export function AdminCommitteeDetailView({
  initialCommittee,
}: {
  initialCommittee: CommitteeDetail
}) {
  const { t, lang } = useLanguage()
  const locale = lang === "bn" ? "bn-BD" : "en-US"

  const [committee, setCommittee] = useState(initialCommittee)
  const [activeTab, setActiveTab] = useState<"roles" | "members">("roles")

  // Add Role modal state
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [roleName, setRoleName] = useState("")
  const [roleSlug, setRoleSlug] = useState("")
  const [roleDescription, setRoleDescription] = useState("")
  const [isRoleSlugManual, setIsRoleSlugManual] = useState(false)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [addRoleError, setAddRoleError] = useState<string | null>(null)

  // Edit Role modal state
  const [editingRole, setEditingRole] = useState<CommitteeRoleDetail | null>(null)
  const [editRoleName, setEditRoleName] = useState("")
  const [editRoleSlug, setEditRoleSlug] = useState("")
  const [editRoleDescription, setEditRoleDescription] = useState("")
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [updateRoleError, setUpdateRoleError] = useState<string | null>(null)

  // Delete Role modal state
  const [deletingRole, setDeletingRole] = useState<CommitteeRoleDetail | null>(null)
  const [isDeletingRole, setIsDeletingRole] = useState(false)
  const [deleteRoleError, setDeleteRoleError] = useState<string | null>(null)

  // Assign Member modal state
  const [isAssignMemberOpen, setIsAssignMemberOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [memberStartDate, setMemberStartDate] = useState("")
  const [memberEndDate, setMemberEndDate] = useState("")
  const [memberIsActive, setMemberIsActive] = useState(true)
  const [userQuery, setUserQuery] = useState("")
  const [assignableUsers, setAssignableUsers] = useState<AssignableUserSummary[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [isAssigningMember, setIsAssigningMember] = useState(false)
  const [assignMemberError, setAssignMemberError] = useState<string | null>(null)

  // Edit Member modal state
  const [editingMember, setEditingMember] = useState<CommitteeMemberDetail | null>(null)
  const [editMemberRoleId, setEditMemberRoleId] = useState("")
  const [editMemberStartDate, setEditMemberStartDate] = useState("")
  const [editMemberEndDate, setEditMemberEndDate] = useState("")
  const [editMemberIsActive, setEditMemberIsActive] = useState(true)
  const [isUpdatingMember, setIsUpdatingMember] = useState(false)
  const [updateMemberError, setUpdateMemberError] = useState<string | null>(null)

  // Remove Member modal state
  const [removingMember, setRemovingMember] = useState<CommitteeMemberDetail | null>(null)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null)

  function autoSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  async function reloadCommittee() {
    const res = await fetch(`/api/admin/committees/${committee.id}`)
    if (res.ok) {
      setCommittee(await res.json())
    }
  }

  // Role Actions
  function openAddRole() {
    setRoleName("")
    setRoleSlug("")
    setRoleDescription("")
    setIsRoleSlugManual(false)
    setAddRoleError(null)
    setIsAddRoleOpen(true)
  }

  function handleRoleNameChange(val: string) {
    setRoleName(val)
    if (!isRoleSlugManual) {
      setRoleSlug(autoSlug(val))
    }
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault()
    if (!roleName.trim()) {
      setAddRoleError(t("Role name is required", "পদবির নাম আবশ্যক"))
      return
    }

    setIsAddingRole(true)
    setAddRoleError(null)

    try {
      const res = await fetch(`/api/admin/committees/${committee.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleName.trim(),
          slug: roleSlug.trim() || autoSlug(roleName),
          description: roleDescription.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to create role")

      setIsAddRoleOpen(false)
      await reloadCommittee()
    } catch (err) {
      setAddRoleError(err instanceof Error ? err.message : "Failed to create role")
    } finally {
      setIsAddingRole(false)
    }
  }

  function openEditRole(role: CommitteeRoleDetail) {
    setEditingRole(role)
    setEditRoleName(role.name)
    setEditRoleSlug(role.slug)
    setEditRoleDescription(role.description ?? "")
    setUpdateRoleError(null)
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRole) return
    if (!editRoleName.trim()) {
      setUpdateRoleError(t("Role name is required", "পদবির নাম আবশ্যক"))
      return
    }

    setIsUpdatingRole(true)
    setUpdateRoleError(null)

    try {
      const res = await fetch(
        `/api/admin/committees/${committee.id}/roles/${editingRole.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editRoleName.trim(),
            slug: editRoleSlug.trim() || autoSlug(editRoleName),
            description: editRoleDescription.trim() || null,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to update role")

      setEditingRole(null)
      await reloadCommittee()
    } catch (err) {
      setUpdateRoleError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  async function handleDeleteRole() {
    if (!deletingRole) return
    setIsDeletingRole(true)
    setDeleteRoleError(null)

    try {
      const res = await fetch(
        `/api/admin/committees/${committee.id}/roles/${deletingRole.id}`,
        {
          method: "DELETE",
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to delete role")

      setDeletingRole(null)
      await reloadCommittee()
    } catch (err) {
      setDeleteRoleError(err instanceof Error ? err.message : "Failed to delete role")
    } finally {
      setIsDeletingRole(false)
    }
  }

  // Member Actions
  async function searchUsers(q: string) {
    setUserQuery(q)
    setIsSearchingUsers(true)
    try {
      const res = await fetch(`/api/admin/committee-options?userSearch=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setAssignableUsers(data.users || [])
      }
    } finally {
      setIsSearchingUsers(false)
    }
  }

  async function openAssignMember() {
    setSelectedUserId("")
    setSelectedRoleId(committee.roles[0]?.id ?? "")
    setMemberStartDate("")
    setMemberEndDate("")
    setMemberIsActive(true)
    setAssignMemberError(null)
    setIsAssignMemberOpen(true)
    await searchUsers("")
  }

  async function handleAssignMember(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId) {
      setAssignMemberError(t("Please select a user", "অনুগ্রহ করে একজন ব্যবহারকারী নির্বাচন করুন"))
      return
    }
    if (!selectedRoleId) {
      setAssignMemberError(t("Please select a role", "অনুগ্রহ করে একটি পদবি নির্বাচন করুন"))
      return
    }

    setIsAssigningMember(true)
    setAssignMemberError(null)

    try {
      const res = await fetch(`/api/admin/committees/${committee.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          roleId: selectedRoleId,
          startDate: memberStartDate || null,
          endDate: memberEndDate || null,
          isActive: memberIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to assign member")

      setIsAssignMemberOpen(false)
      await reloadCommittee()
    } catch (err) {
      setAssignMemberError(err instanceof Error ? err.message : "Failed to assign member")
    } finally {
      setIsAssigningMember(false)
    }
  }

  function openEditMember(member: CommitteeMemberDetail) {
    setEditingMember(member)
    setEditMemberRoleId(member.roleId)
    setEditMemberStartDate(member.startDate ? member.startDate.slice(0, 10) : "")
    setEditMemberEndDate(member.endDate ? member.endDate.slice(0, 10) : "")
    setEditMemberIsActive(member.isActive)
    setUpdateMemberError(null)
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMember) return

    setIsUpdatingMember(true)
    setUpdateMemberError(null)

    try {
      const res = await fetch(
        `/api/admin/committees/${committee.id}/members/${editingMember.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId: editMemberRoleId,
            startDate: editMemberStartDate || null,
            endDate: editMemberEndDate || null,
            isActive: editMemberIsActive,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to update member")

      setEditingMember(null)
      await reloadCommittee()
    } catch (err) {
      setUpdateMemberError(err instanceof Error ? err.message : "Failed to update member")
    } finally {
      setIsUpdatingMember(false)
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return
    setIsRemovingMember(true)
    setRemoveMemberError(null)

    try {
      const res = await fetch(
        `/api/admin/committees/${committee.id}/members/${removingMember.id}`,
        {
          method: "DELETE",
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to remove member")

      setRemovingMember(null)
      await reloadCommittee()
    } catch (err) {
      setRemoveMemberError(err instanceof Error ? err.message : "Failed to remove member")
    } finally {
      setIsRemovingMember(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/committees"
            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("Back to committees", "কমিটিসমূহে ফিরুন")}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold tracking-tight">{committee.name}</h1>
              <Badge variant={committee.isActive ? "success" : "muted"}>
                {committee.isActive ? t("Active", "সক্রিয়") : t("Inactive", "নিষ্ক্রিয়")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              /{committee.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={activeTab === "roles" ? openAddRole : openAssignMember}
          >
            <Plus className="size-3.5" data-icon="inline-start" />
            {activeTab === "roles"
              ? t("Add role", "পদবি যোগ করুন")
              : t("Assign member", "সদস্য নিয়োগ করুন")}
          </Button>
        </div>
      </div>

      {committee.description && (
        <p className="text-xs/relaxed text-muted-foreground bg-muted/40 p-3 rounded-md border border-border/60">
          {committee.description}
        </p>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "roles"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderPlus className="size-3.5" />
          {t("Roles", "পদবিসমূহ")} ({committee.roles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === "members"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-3.5" />
          {t("Appointed Members", "নিযুক্ত সদস্য")} ({committee.members.length})
        </button>
      </div>

      {/* Roles Tab Content */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Committee Hierarchy & Roles", "কমিটির পদবি ও ক্রম")}
            </h2>
            <Button variant="outline" size="xs" onClick={openAddRole}>
              <Plus className="size-3" data-icon="inline-start" />
              {t("New role", "নতুন পদবি")}
            </Button>
          </div>

          {committee.roles.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderPlus className="mx-auto size-8 text-muted-foreground/60" />
              <CardTitle className="mt-3 text-sm font-semibold">
                {t("No roles defined yet", "এখনও কোনো পদবি তৈরি করা হয়নি")}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {t(
                  "Define roles such as President, Vice President, General Secretary, Member, etc.",
                  "সভাপতি, সহ-সভাপতি, সাধারণ সম্পাদক, সদস্য ইত্যাদির মতো পদবি নির্ধারণ করুন।"
                )}
              </CardDescription>
              <div className="mt-4">
                <Button size="sm" onClick={openAddRole}>
                  <Plus className="size-3.5" data-icon="inline-start" />
                  {t("Add first role", "প্রথম পদবি যোগ করুন")}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {committee.roles.map((role) => (
                <Card key={role.id} size="sm" className="flex flex-col justify-between">
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-sm font-bold">{role.name}</CardTitle>
                        <span className="font-mono text-[11px] text-muted-foreground block truncate">
                          /{role.slug}
                        </span>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[11px]">
                        {role.usersCount} {t("users", "জন")}
                      </Badge>
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {role.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2 mt-2">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditRole(role)}
                        aria-label={t("Edit role", "পদবি সম্পাদনা")}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeletingRole(role)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t("Delete role", "পদবি মুছুন")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab Content */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Assigned Committee Members", "কমিটিতে নিযুক্ত সদস্যবৃন্দ")}
            </h2>
            <Button variant="outline" size="xs" onClick={openAssignMember}>
              <UserPlus className="size-3" data-icon="inline-start" />
              {t("Assign member", "সদস্য নিয়োগ")}
            </Button>
          </div>

          {committee.members.length === 0 ? (
            <Card className="p-8 text-center">
              <UserCheck className="mx-auto size-8 text-muted-foreground/60" />
              <CardTitle className="mt-3 text-sm font-semibold">
                {t("No members assigned yet", "এখনও কোনো সদস্য নিযুক্ত করা হয়নি")}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {committee.roles.length === 0
                  ? t("Please add at least one role first before assigning members.", "সদস্য নিয়োগের আগে অনুগ্রহ করে অন্তত একটি পদবি তৈরি করুন।")
                  : t("Assign registered users to committee roles with tenures and statuses.", "নিবন্ধিত ব্যবহারকারীদের নির্দিষ্ট পদবি ও মেয়াদের সাথে নিয়োগ করুন।")}
              </CardDescription>
              {committee.roles.length > 0 && (
                <div className="mt-4">
                  <Button size="sm" onClick={openAssignMember}>
                    <UserPlus className="size-3.5" data-icon="inline-start" />
                    {t("Assign member", "সদস্য নিয়োগ করুন")}
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">{t("Member", "সদস্য")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("Role", "পদবি")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("Tenure Period", "মেয়াদ")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("Status", "অবস্থা")}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t("Actions", "পদক্ষেপ")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {committee.members.map((m) => {
                    const initials = (m.userName || m.userEmail || "?").trim().charAt(0).toUpperCase()

                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8">
                              {m.userAvatar && (
                                <AvatarImage
                                  keepMounted
                                  render={<Image src={m.userAvatar} alt={m.userName} width={32} height={32} unoptimized />}
                                />
                              )}
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/users/${m.userId}`}
                                className="font-semibold text-foreground hover:underline hover:text-primary transition-colors block truncate"
                              >
                                {m.userName}
                              </Link>
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {m.userEmail}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-medium">
                            {m.roleName}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground tabular-nums text-[11px]">
                          {m.startDate || m.endDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3 text-muted-foreground" />
                              {formatDate(m.startDate, locale)} — {formatDate(m.endDate, locale)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant={m.isActive ? "success" : "muted"}>
                            {m.isActive ? t("Active", "সক্রিয়") : t("Ended", "সমাপ্ত")}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => openEditMember(m)}
                              aria-label={t("Edit member", "সদস্য সম্পাদনা")}
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setRemovingMember(m)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={t("Remove member", "সদস্য অপসারণ")}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Role Modal */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent>
          <form onSubmit={handleAddRole}>
            <DialogHeader>
              <DialogTitle>{t("Add committee role", "কমিটিতে পদবি যোগ করুন")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Define a specific position in this committee, such as President or General Secretary.",
                  "কমিটিতে নির্দিষ্ট পদবি তৈরি করুন, যেমন সভাপতি বা সাধারণ সম্পাদক।"
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <TextField
                id="role-name"
                label={t("Role name", "পদবির নাম")}
                value={roleName}
                onChange={handleRoleNameChange}
                placeholder="e.g. President / General Secretary"
                required
              />

              <TextField
                id="role-slug"
                label={t("Slug", "স্লাগ")}
                value={roleSlug}
                onChange={(val) => {
                  setRoleSlug(autoSlug(val))
                  setIsRoleSlugManual(true)
                }}
                placeholder="e.g. president"
                required
              />

              <TextAreaField
                id="role-description"
                label={t("Description (optional)", "বিবরণ (ঐচ্ছিক)")}
                value={roleDescription}
                onChange={setRoleDescription}
                rows={3}
              />

              {addRoleError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {addRoleError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddRoleOpen(false)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={isAddingRole}>
                {isAddingRole ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                {isAddingRole ? t("Adding...", "যোগ হচ্ছে...") : t("Add role", "পদবি যোগ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog
        open={Boolean(editingRole)}
        onOpenChange={(open) => !open && setEditingRole(null)}
      >
        <DialogContent>
          <form onSubmit={handleUpdateRole}>
            <DialogHeader>
              <DialogTitle>{t("Edit role", "পদবি সম্পাদনা করুন")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <TextField
                id="edit-role-name"
                label={t("Role name", "পদবির নাম")}
                value={editRoleName}
                onChange={setEditRoleName}
                required
              />

              <TextField
                id="edit-role-slug"
                label={t("Slug", "স্লাগ")}
                value={editRoleSlug}
                onChange={(val) => setEditRoleSlug(autoSlug(val))}
                required
              />

              <TextAreaField
                id="edit-role-description"
                label={t("Description", "বিবরণ")}
                value={editRoleDescription}
                onChange={setEditRoleDescription}
                rows={3}
              />

              {updateRoleError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {updateRoleError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingRole(null)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={isUpdatingRole}>
                {isUpdatingRole ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                {isUpdatingRole ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save changes", "পরিবর্তন সংরক্ষণ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Modal */}
      <Dialog
        open={Boolean(deletingRole)}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("Delete role?", "পদবি মুছে ফেলবেন?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                `Are you sure you want to delete "${deletingRole?.name}"? Any member appointed to this role will also be unassigned.`,
                `আপনি কি নিশ্চিত যে "${deletingRole?.name}" মুছে ফেলতে চান? এতে নিযুক্ত সদস্যদের পদবিও বাতিল হবে।`
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteRoleError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {deleteRoleError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setDeletingRole(null)} disabled={isDeletingRole}>
              {t("Cancel", "বাতিল")}
            </Button>
            <Button variant="destructive" type="button" onClick={handleDeleteRole} disabled={isDeletingRole}>
              {isDeletingRole ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              {isDeletingRole ? t("Deleting...", "মুছে ফেলা হচ্ছে...") : t("Delete role", "পদবি মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Member Modal */}
      <Dialog open={isAssignMemberOpen} onOpenChange={setIsAssignMemberOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAssignMember}>
            <DialogHeader>
              <DialogTitle>{t("Assign committee member", "কমিটিতে সদস্য নিয়োগ করুন")}</DialogTitle>
              <DialogDescription>
                {t("Appoint an existing platform user to a role in this committee.", "প্ল্যাটফর্মের নিবন্ধিত কোনো ব্যবহারকারীকে এই কমিটিতে নিয়োগ দিন।")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              {/* User Selection */}
              <div>
                <label className="text-xs font-medium block mb-1">
                  {t("Select user", "ব্যবহারকারী নির্বাচন করুন")} *
                </label>
                <input
                  type="search"
                  value={userQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder={t("Filter by name or email...", "নাম বা ইমেইল দিয়ে খুঁজুন...")}
                  className="w-full mb-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs/relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
                  {isSearchingUsers ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin mx-auto mb-1" />
                      {t("Loading users...", "লোড হচ্ছে...")}
                    </div>
                  ) : assignableUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      {t("No users found", "কোনো ব্যবহারকারী পাওয়া যায়নি")}
                    </div>
                  ) : (
                    assignableUsers.map((u) => {
                      const isSelected = selectedUserId === u.id
                      const initials = (u.name || u.email).charAt(0).toUpperCase()

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className={`w-full flex items-center justify-between gap-2 p-2 text-left text-xs transition-colors ${
                            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="size-6">
                              {u.avatar && <AvatarImage src={u.avatar} />}
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="font-medium block truncate">{u.name}</span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {u.email}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs font-medium block mb-1">
                  {t("Assign to role", "পদবি নির্বাচন করুন")} *
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs/relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {committee.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (/{r.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  id="member-start"
                  label={t("Start date", "শুরুর তারিখ")}
                  type="date"
                  value={memberStartDate}
                  onChange={setMemberStartDate}
                />
                <TextField
                  id="member-end"
                  label={t("End date", "শেষের তারিখ")}
                  type="date"
                  value={memberEndDate}
                  onChange={setMemberEndDate}
                />
              </div>

              <CheckboxField
                id="member-is-active"
                label={t("Active member in this tenure", "এই মেয়াদে সক্রিয় সদস্য")}
                checked={memberIsActive}
                onChange={setMemberIsActive}
              />

              {assignMemberError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {assignMemberError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAssignMemberOpen(false)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={isAssigningMember}>
                {isAssigningMember ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                {isAssigningMember ? t("Assigning...", "নিয়োগ হচ্ছে...") : t("Appoint member", "সদস্য নিয়োগ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <form onSubmit={handleUpdateMember}>
            <DialogHeader>
              <DialogTitle>{t("Edit member appointment", "সদস্য নিয়োগ সম্পাদনা করুন")}</DialogTitle>
              <DialogDescription>
                {editingMember?.userName} — {editingMember?.userEmail}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div>
                <label className="text-xs font-medium block mb-1">
                  {t("Role", "পদবি")}
                </label>
                <select
                  value={editMemberRoleId}
                  onChange={(e) => setEditMemberRoleId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs/relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {committee.roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  id="edit-start"
                  label={t("Start date", "শুরুর তারিখ")}
                  type="date"
                  value={editMemberStartDate}
                  onChange={setEditMemberStartDate}
                />
                <TextField
                  id="edit-end"
                  label={t("End date", "শেষের তারিখ")}
                  type="date"
                  value={editMemberEndDate}
                  onChange={setEditMemberEndDate}
                />
              </div>

              <CheckboxField
                id="edit-member-active"
                label={t("Active status", "সক্রিয় অবস্থা")}
                checked={editMemberIsActive}
                onChange={setEditMemberIsActive}
              />

              {updateMemberError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {updateMemberError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingMember(null)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={isUpdatingMember}>
                {isUpdatingMember ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                {isUpdatingMember ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save changes", "পরিবর্তন সংরক্ষণ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Modal */}
      <Dialog
        open={Boolean(removingMember)}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("Remove committee member?", "কমিটি সদস্য অপসারণ করবেন?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                `Are you sure you want to remove ${removingMember?.userName} from the role "${removingMember?.roleName}"?`,
                `আপনি কি নিশ্চিত যে ${removingMember?.userName}-কে "${removingMember?.roleName}" পদবি থেকে অপসারণ করতে চান?`
              )}
            </DialogDescription>
          </DialogHeader>

          {removeMemberError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {removeMemberError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setRemovingMember(null)} disabled={isRemovingMember}>
              {t("Cancel", "বাতিল")}
            </Button>
            <Button variant="destructive" type="button" onClick={handleRemoveMember} disabled={isRemovingMember}>
              {isRemovingMember ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              {isRemovingMember ? t("Removing...", "অপসারণ হচ্ছে...") : t("Remove member", "সদস্য অপসারণ করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
