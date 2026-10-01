"use client"

import {
  Check,
  Edit2,
  FolderTree,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"

import { CheckboxField, TextAreaField, TextField } from "@/components/form-fields"
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CATEGORY_TYPES,
  CATEGORY_TYPE_META,
  CategoryType,
  type CategorySummary,
} from "@/lib/category-constants"
import { cn } from "cn"

export function AdminCategoryManager({
  initialCategories,
}: {
  initialCategories: CategorySummary[]
}) {
  const { t } = useLanguage()

  const [categories, setCategories] = useState<CategorySummary[]>(initialCategories)
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  // Create Category modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [catType, setCatType] = useState<CategoryType>(CategoryType.POST)
  const [catName, setCatName] = useState("")
  const [catNameBn, setCatNameBn] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catDescription, setCatDescription] = useState("")
  const [catIsActive, setCatIsActive] = useState(true)
  const [catSlugEdited, setCatSlugEdited] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Category modal state
  const [editingCat, setEditingCat] = useState<CategorySummary | null>(null)
  const [editCatType, setEditCatType] = useState<CategoryType>(CategoryType.POST)
  const [editCatName, setEditCatName] = useState("")
  const [editCatNameBn, setEditCatNameBn] = useState("")
  const [editCatSlug, setEditCatSlug] = useState("")
  const [editCatDescription, setEditCatDescription] = useState("")
  const [editCatIsActive, setEditCatIsActive] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Delete Category modal state
  const [deletingCat, setDeletingCat] = useState<CategorySummary | null>(null)
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

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchType = selectedType === "ALL" || cat.type === selectedType

      const matchSearch =
        !search ||
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        (cat.nameBn && cat.nameBn.toLowerCase().includes(search.toLowerCase())) ||
        cat.slug.toLowerCase().includes(search.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))

      return matchType && matchSearch
    })
  }, [categories, selectedType, search])

  // Open Create Modal
  function openCreate() {
    const defaultType =
      selectedType !== "ALL" ? (selectedType as CategoryType) : CategoryType.POST

    setCatType(defaultType)
    setCatName("")
    setCatNameBn("")
    setCatSlug("")
    setCatDescription("")
    setCatIsActive(true)
    setCatSlugEdited(false)
    setCreateError(null)
    setIsCreateOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: catType,
          name: catName,
          nameBn: catNameBn || null,
          slug: catSlug,
          description: catDescription || null,
          isActive: catIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create category")

      setCategories((prev) => [...prev, data])
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCreating(false)
    }
  }

  // Open Edit Modal
  function openEdit(cat: CategorySummary) {
    setEditingCat(cat)
    setEditCatType(cat.type)
    setEditCatName(cat.name)
    setEditCatNameBn(cat.nameBn || "")
    setEditCatSlug(cat.slug)
    setEditCatDescription(cat.description || "")
    setEditCatIsActive(cat.isActive)
    setUpdateError(null)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCat) return

    setIsUpdating(true)
    setUpdateError(null)

    try {
      const res = await fetch(`/api/admin/categories/${editingCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editCatType,
          name: editCatName,
          nameBn: editCatNameBn || null,
          slug: editCatSlug,
          description: editCatDescription || null,
          isActive: editCatIsActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update category")

      setCategories((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, ...data } : c))
      )
      setEditingCat(null)
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete Category
  async function handleDelete() {
    if (!deletingCat) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/admin/categories/${deletingCat.id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete category")

      setCategories((prev) => prev.filter((c) => c.id !== deletingCat.id))
      setDeletingCat(null)
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const typeColorMap: Record<CategoryType, string> = {
    [CategoryType.POST]: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    [CategoryType.ACHIEVEMENT]: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    [CategoryType.PROJECT]: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    [CategoryType.EVENT]: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  }

  return (
    <div className="space-y-6">
      {/* Category Type Filter Tabs & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={selectedType === "ALL" ? "default" : "outline"}
            className="h-8 text-xs font-medium"
            onClick={() => setSelectedType("ALL")}
          >
            <Layers className="size-3.5" />
            {t("All", "সব")} ({categories.length})
          </Button>

          {CATEGORY_TYPES.map((type) => {
            const count = categories.filter((c) => c.type === type).length
            const isSelected = selectedType === type
            const meta = CATEGORY_TYPE_META[type]
            const label = t(meta.label)

            return (
              <Button
                key={type}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className="h-8 text-xs font-medium"
                onClick={() => setSelectedType(type)}
              >
                {label} ({count})
              </Button>
            )
          })}
        </div>

        <Button size="sm" className="h-8 text-xs font-medium" onClick={openCreate}>
          <Plus className="size-3.5" />
          {t("Add Category", "নতুন ক্যাটাগরি")}
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search categories...", "ক্যাটাগরি খুঁজুন...")}
            className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full rounded-md border bg-background py-1 pr-3 pl-8 text-xs shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden"
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderTree className="text-muted-foreground/50 mb-3 size-10" />
            <h3 className="font-heading text-sm font-semibold">
              {t("No categories found", "কোনো ক্যাটাগরি পাওয়া যায়নি")}
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              {search
                ? t(
                    "Try adjusting your search query.",
                    "অনুসন্ধানের শব্দ পরিবর্তন করে দেখুন।"
                  )
                : t(
                    "Get started by adding categories for posts, achievements, projects, or events.",
                    "পোস্ট, অর্জন, প্রজেক্ট বা ইভেন্টের জন্য ক্যাটাগরি তৈরি করে শুরু করুন।"
                  )}
            </p>
            <Button size="sm" onClick={openCreate} className="mt-4 text-xs">
              <Plus className="size-3.5" />
              {t("Add Category", "নতুন ক্যাটাগরি")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => {
            const meta = CATEGORY_TYPE_META[cat.type]
            const typeLabel = t(meta?.label ?? { en: cat.type, bn: cat.type })
            const typeColor = typeColorMap[cat.type] ?? ""

            return (
              <Card
                key={cat.id}
                className={cn(
                  "group relative transition-all duration-200 hover:shadow-xs",
                  !cat.isActive && "opacity-60"
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                            typeColor
                          )}
                        >
                          {typeLabel}
                        </span>
                        <Badge
                          variant={cat.isActive ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {cat.isActive
                            ? t("Active", "সক্রিয়")
                            : t("Inactive", "নিষ্ক্রিয়")}
                        </Badge>
                      </div>

                      <CardTitle className="mt-2 text-sm font-bold">
                        {cat.name}
                        {cat.nameBn ? (
                          <span className="text-muted-foreground ml-2 text-xs font-normal">
                            ({cat.nameBn})
                          </span>
                        ) : null}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => openEdit(cat)}
                        aria-label={t("Edit", "সম্পাদনা")}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive size-7"
                        onClick={() => {
                          setDeletingCat(cat)
                          setDeleteError(null)
                        }}
                        aria-label={t("Delete", "মুছুন")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardDescription className="font-mono text-[11px] text-muted-foreground">
                    slug: {cat.slug}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-1">
                  {cat.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {cat.description}
                    </p>
                  ) : null}

                  {cat.type === CategoryType.POST ? (
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                      <span>
                        {t("Attached posts:", "সংযুক্ত পোস্ট:")}{" "}
                        <strong className="text-foreground">{cat.postsCount}</strong>
                      </span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Category Create Modal */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>{t("Add Category", "নতুন ক্যাটাগরি তৈরি")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Create a reusable category for posts, achievements, projects, or events.",
                  "পোস্ট, অর্জন, প্রজেক্ট বা ইভেন্টের জন্য ক্যাটাগরি তৈরি করুন।"
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {createError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                  {createError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  {t("Category Type", "ক্যাটাগরি টাইপ")} *
                </label>
                <Select
                  value={catType}
                  onValueChange={(val) => setCatType((val ?? CategoryType.POST) as CategoryType)}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {t(CATEGORY_TYPE_META[type].label)} ({type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TextField
                id="create-cat-name"
                label={t("Name (English)", "নাম (ইংরেজি)")}
                value={catName}
                onChange={(val) => {
                  setCatName(val)
                  if (!catSlugEdited) {
                    setCatSlug(autoSlug(val))
                  }
                }}
                required
                placeholder="e.g. Announcement, Tutorial, Workshop"
              />

              <TextField
                id="create-cat-name-bn"
                label={t("Name (Bangla)", "নাম (বাংলা)")}
                value={catNameBn}
                onChange={setCatNameBn}
                placeholder="যেমন: ঘোষণা, টিউটোরিয়াল, ওয়ার্কশপ"
              />

              <TextField
                id="create-cat-slug"
                label={t("Slug", "স্লাগ")}
                value={catSlug}
                onChange={(val) => {
                  setCatSlugEdited(true)
                  setCatSlug(autoSlug(val))
                }}
                required
                placeholder="e.g. announcement"
              />

              <TextAreaField
                id="create-cat-desc"
                label={t("Description", "বিবরণ")}
                value={catDescription}
                onChange={setCatDescription}
                rows={2}
                placeholder={t("Brief description of this category", "এই ক্যাটাগরির সংক্ষিপ্ত বিবরণ")}
              />

              <CheckboxField
                id="create-cat-active"
                label={t("Category is active", "ক্যাটাগরি সক্রিয়")}
                checked={catIsActive}
                onChange={setCatIsActive}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || !catName || !catSlug}>
                {isCreating ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1.5 size-3.5" />
                )}
                {t("Create Category", "ক্যাটাগরি তৈরি করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Category Edit Modal */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingCat)} onOpenChange={(open) => !open && setEditingCat(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>{t("Edit Category", "ক্যাটাগরি সম্পাদনা")}</DialogTitle>
              <DialogDescription>
                {t("Update category details and language translations.", "ক্যাটাগরির নাম ও অনুবাদ হালনাগাদ করুন।")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {updateError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                  {updateError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  {t("Category Type", "ক্যাটাগরি টাইপ")} *
                </label>
                <Select
                  value={editCatType}
                  onValueChange={(val) => setEditCatType((val ?? CategoryType.POST) as CategoryType)}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {t(CATEGORY_TYPE_META[type].label)} ({type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TextField
                id="edit-cat-name"
                label={t("Name (English)", "নাম (ইংরেজি)")}
                value={editCatName}
                onChange={setEditCatName}
                required
              />

              <TextField
                id="edit-cat-name-bn"
                label={t("Name (Bangla)", "নাম (বাংলা)")}
                value={editCatNameBn}
                onChange={setEditCatNameBn}
              />

              <TextField
                id="edit-cat-slug"
                label={t("Slug", "স্লাগ")}
                value={editCatSlug}
                onChange={(val) => setEditCatSlug(autoSlug(val))}
                required
              />

              <TextAreaField
                id="edit-cat-desc"
                label={t("Description", "বিবরণ")}
                value={editCatDescription}
                onChange={setEditCatDescription}
                rows={2}
              />

              <CheckboxField
                id="edit-cat-active"
                label={t("Category is active", "ক্যাটাগরি সক্রিয়")}
                checked={editCatIsActive}
                onChange={setEditCatIsActive}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingCat(null)}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" size="sm" disabled={isUpdating || !editCatName || !editCatSlug}>
                {isUpdating ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1.5 size-3.5" />
                )}
                {t("Save Changes", "সংরক্ষণ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Category Delete Modal */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(deletingCat)} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("Delete Category", "ক্যাটাগরি মুছুন")}
            </DialogTitle>
            <DialogDescription>
              {t(
                `Are you sure you want to delete the category "${deletingCat?.name}"?`,
                `আপনি কি নিশ্চিত যে "${deletingCat?.name}" ক্যাটাগরি মুছে ফেলতে চান?`
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              {deleteError}
            </div>
          ) : null}

          {deletingCat && deletingCat.postsCount > 0 ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
              {t(
                `Warning: ${deletingCat.postsCount} post(s) are using this category. You must reassign those posts before deleting.`,
                `সতর্কতা: ${deletingCat.postsCount}টি পোস্টে এই ক্যাটাগরি ব্যবহৃত হচ্ছে। মুছে ফেলার আগে পোস্টগুলো অন্য ক্যাটাগরিতে স্থানান্তর করুন।`
              )}
            </p>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingCat(null)}
            >
              {t("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting || (deletingCat ? deletingCat.postsCount > 0 : false)}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 size-3.5" />
              )}
              {t("Delete", "মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
