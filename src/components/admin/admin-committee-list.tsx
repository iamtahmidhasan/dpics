"use client"

import {
  Award,
  Calendar,
  Check,
  Edit2,
  FolderPlus,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { useLanguage } from "@/components/language-provider"
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckboxField, TextAreaField, TextField } from "@/components/form-fields"
import { formatDate } from "@/lib/format"
import type { CommitteeSummary } from "@/lib/services/committee.service"

export function AdminCommitteeList({
  initialCommittees,
}: {
  initialCommittees: CommitteeSummary[]
}) {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const locale = lang === "bn" ? "bn-BD" : "en-US"

  const [committees, setCommittees] = useState(initialCommittees)
  const [search, setSearch] = useState("")

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit modal state
  const [editingCommittee, setEditingCommittee] = useState<CommitteeSummary | null>(null)
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editIsActive, setEditIsActive] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Delete modal state
  const [deletingCommittee, setDeletingCommittee] = useState<CommitteeSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function autoSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!slugManuallyEdited) {
      setSlug(autoSlug(val))
    }
  }

  function openCreate() {
    setName("")
    setSlug("")
    setDescription("")
    setIsActive(true)
    setSlugManuallyEdited(false)
    setCreateError(null)
    setIsCreateOpen(true)
  }

  function openEdit(committee: CommitteeSummary) {
    setEditingCommittee(committee)
    setEditName(committee.name)
    setEditSlug(committee.slug)
    setEditDescription(committee.description ?? "")
    setEditIsActive(committee.isActive)
    setUpdateError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setCreateError(t("Name is required", "নাম আবশ্যক"))
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await fetch("/api/admin/committees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || autoSlug(name),
          description: description.trim() || null,
          isActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to create committee")

      setIsCreateOpen(false)
      router.refresh()
      // Refresh list
      const listRes = await fetch("/api/admin/committees")
      if (listRes.ok) {
        setCommittees(await listRes.json())
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create committee")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCommittee) return
    if (!editName.trim()) {
      setUpdateError(t("Name is required", "নাম আবশ্যক"))
      return
    }

    setIsUpdating(true)
    setUpdateError(null)

    try {
      const res = await fetch(`/api/admin/committees/${editingCommittee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() || autoSlug(editName),
          description: editDescription.trim() || null,
          isActive: editIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to update committee")

      setEditingCommittee(null)
      router.refresh()
      const listRes = await fetch("/api/admin/committees")
      if (listRes.ok) {
        setCommittees(await listRes.json())
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update committee")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    if (!deletingCommittee) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/admin/committees/${deletingCommittee.id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to delete committee")

      setDeletingCommittee(null)
      router.refresh()
      setCommittees((current) => current.filter((c) => c.id !== deletingCommittee.id))
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete committee")
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return committees
    return committees.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    )
  }, [committees, search])

  const totalRoles = committees.reduce((sum, c) => sum + c.rolesCount, 0)
  const totalMembers = committees.reduce((sum, c) => sum + c.membersCount, 0)
  const activeCount = committees.filter((c) => c.isActive).length

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Total Committees", "মোট কমিটি")}
            </CardTitle>
            <Award className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-heading">{committees.length}</div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Active Committees", "সক্রিয় কমিটি")}
            </CardTitle>
            <Badge variant="success">{t("Active", "সক্রিয়")}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-heading">{activeCount}</div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Total Roles", "মোট পদবি")}
            </CardTitle>
            <FolderPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-heading">{totalRoles}</div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("Appointed Members", "নিযুক্ত সদস্য")}
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-heading">{totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search committees...", "কমিটি খুঁজুন...")}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-xs/relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Button onClick={openCreate} size="sm">
          <Plus className="size-3.5" data-icon="inline-start" />
          {t("New committee", "নতুন কমিটি")}
        </Button>
      </div>

      {/* Committees Grid / List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="size-6" />
          </div>
          <CardTitle className="mt-4 text-base font-semibold">
            {search
              ? t("No committees found", "কোনো কমিটি খুঁজে পাওয়া যায়নি")
              : t("No committees yet", "এখনও কোনো কমিটি তৈরি হয়নি")}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            {search
              ? t("Try a different search query.", "ভিন্ন কিছু দিয়ে অনুসন্ধান করুন।")
              : t(
                  "Get started by creating your society's executive committee or advisory board.",
                  "সোসাইটির নির্বাহী কমিটি বা উপদেষ্টা পর্ষদ তৈরি করে শুরু করুন।"
                )}
          </CardDescription>
          {!search && (
            <div className="mt-4">
              <Button onClick={openCreate} size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                {t("Create first committee", "প্রথম কমিটি তৈরি করুন")}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((committee) => (
            <Card
              key={committee.id}
              className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-xs"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-base font-bold text-foreground">
                      <Link
                        href={`/admin/committees/${committee.id}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {committee.name}
                      </Link>
                    </CardTitle>
                    <span className="font-mono text-[11px] text-muted-foreground block truncate mt-0.5">
                      /{committee.slug}
                    </span>
                  </div>
                  <Badge variant={committee.isActive ? "success" : "muted"}>
                    {committee.isActive ? t("Active", "সক্রিয়") : t("Inactive", "নিষ্ক্রিয়")}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                  {committee.description || t("No description provided", "কোনো বিবরণ নেই")}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-y border-border/60 py-2">
                  <span className="flex items-center gap-1.5">
                    <FolderPlus className="size-3.5 text-primary" />
                    <span>
                      {committee.rolesCount} {t("roles", "পদবি")}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-primary" />
                    <span>
                      {committee.membersCount} {t("members", "সদস্য")}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>{formatDate(committee.createdAt, locale)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(committee)}
                      aria-label={t("Edit committee", "কমিটি সম্পাদনা")}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeletingCommittee(committee)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("Delete committee", "কমিটি মুছুন")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <Link
                    href={`/admin/committees/${committee.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {t("Manage roles & members", "পদবি ও সদস্য পরিচালনা")} →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Committee Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>{t("Create new committee", "নতুন কমিটি তৈরি করুন")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Define the committee details. You can add specific roles and members after creating it.",
                  "কমিটির প্রাথমিক তথ্য দিন। তৈরির পর পদবি ও সদস্য যুক্ত করতে পারবেন।"
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <TextField
                id="create-name"
                label={t("Committee name", "কমিটির নাম")}
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Executive Committee 2024-25"
                required
              />

              <TextField
                id="create-slug"
                label={t("URL Slug", "ইউআরএল স্লাগ")}
                value={slug}
                onChange={(val) => {
                  setSlug(autoSlug(val))
                  setSlugManuallyEdited(true)
                }}
                placeholder="e.g. executive-2024-25"
                hint={t("Unique identifier for links and routing", "লিংক ও রাউটিংয়ের জন্য অনন্য শনাক্তকারী")}
                required
              />

              <TextAreaField
                id="create-description"
                label={t("Description (optional)", "বিবরণ (ঐচ্ছিক)")}
                value={description}
                onChange={setDescription}
                placeholder={t("Brief summary of committee purpose...", "কমিটির উদ্দেশ্য ও পরিধি...")}
                rows={3}
              />

              <CheckboxField
                id="create-is-active"
                label={t("Committee is active", "কমিটি সক্রিয়")}
                checked={isActive}
                onChange={setIsActive}
                hint={t("Inactive committees represent past or archived tenures", "নিষ্ক্রিয় কমিটিগুলো পূর্ববর্তী বা আর্কাইভ নির্দেশ করে")}
              />

              {createError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {createError}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button">{t("Cancel", "বাতিল")}</Button>} />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                {isCreating ? t("Creating...", "তৈরি হচ্ছে...") : t("Create committee", "কমিটি তৈরি করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Committee Modal */}
      <Dialog
        open={Boolean(editingCommittee)}
        onOpenChange={(open) => !open && setEditingCommittee(null)}
      >
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>{t("Edit committee", "কমিটি সম্পাদনা করুন")}</DialogTitle>
              <DialogDescription>
                {t("Update the committee's name, slug, or active status.", "কমিটির নাম, স্লাগ বা অবস্থা আপডেট করুন।")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <TextField
                id="edit-name"
                label={t("Committee name", "কমিটির নাম")}
                value={editName}
                onChange={setEditName}
                required
              />

              <TextField
                id="edit-slug"
                label={t("URL Slug", "ইউআরএল স্লাগ")}
                value={editSlug}
                onChange={(val) => setEditSlug(autoSlug(val))}
                required
              />

              <TextAreaField
                id="edit-description"
                label={t("Description", "বিবরণ")}
                value={editDescription}
                onChange={setEditDescription}
                rows={3}
              />

              <CheckboxField
                id="edit-is-active"
                label={t("Committee is active", "কমিটি সক্রিয়")}
                checked={editIsActive}
                onChange={setEditIsActive}
              />

              {updateError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {updateError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditingCommittee(null)}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                {isUpdating ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save changes", "পরিবর্তন সংরক্ষণ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deletingCommittee)}
        onOpenChange={(open) => !open && setDeletingCommittee(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("Delete committee?", "কমিটি মুছে ফেলবেন?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                `Are you sure you want to delete "${deletingCommittee?.name}"? All associated roles and member assignments will be permanently removed.`,
                `আপনি কি নিশ্চিত যে "${deletingCommittee?.name}" মুছে ফেলতে চান? এর সাথে যুক্ত সমস্ত পদবি ও সদস্য নিয়োগ মুছে যাবে।`
              )}
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
              onClick={() => setDeletingCommittee(null)}
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
              {isDeleting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              {isDeleting ? t("Deleting...", "মুছে ফেলা হচ্ছে...") : t("Delete committee", "কমিটি মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
