"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BookOpen,
  Edit2,
  ExternalLink,
  Layers,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

interface AdminCourseListProps {
  initialCourses: any[]
}

export function AdminCourseList({ initialCourses }: AdminCourseListProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [courses, setCourses] = React.useState(initialCourses)
  const [search, setSearch] = React.useState("")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<any | null>(null)
  const [courseToDelete, setCourseToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form states
  const [title, setTitle] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [excerpt, setExcerpt] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [thumbnail, setThumbnail] = React.useState("")
  const [level, setLevel] = React.useState("ALL_LEVELS")
  const [isFree, setIsFree] = React.useState(true)
  const [price, setPrice] = React.useState("0")
  const [discountPrice, setDiscountPrice] = React.useState("")
  const [isPublished, setIsPublished] = React.useState(false)
  const [featured, setFeatured] = React.useState(false)

  const openCreateModal = () => {
    setEditingCourse(null)
    setTitle("")
    setSlug("")
    setExcerpt("")
    setDescription("")
    setThumbnail("")
    setLevel("ALL_LEVELS")
    setIsFree(true)
    setPrice("0")
    setDiscountPrice("")
    setIsPublished(false)
    setFeatured(false)
    setError(null)
    setModalOpen(true)
  }

  const openEditModal = (c: any) => {
    setEditingCourse(c)
    setTitle(c.title || "")
    setSlug(c.slug || "")
    setExcerpt(c.excerpt || "")
    setDescription(c.description || "")
    setThumbnail(c.thumbnail || "")
    setLevel(c.level || "ALL_LEVELS")
    setIsFree(Boolean(c.isFree))
    setPrice(String(c.price || 0))
    setDiscountPrice(c.discountPrice ? String(c.discountPrice) : "")
    setIsPublished(Boolean(c.isPublished))
    setFeatured(Boolean(c.featured))
    setError(null)
    setModalOpen(true)
  }

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!editingCourse) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setSlug(generated)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        title,
        slug,
        excerpt,
        description,
        thumbnail,
        level,
        isFree,
        price: isFree ? 0 : parseInt(price) || 0,
        discountPrice: isFree || !discountPrice ? null : parseInt(discountPrice) || null,
        isPublished,
        featured,
      }

      const url = editingCourse ? `/api/courses/${editingCourse.id}` : "/api/courses"
      const method = editingCourse ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to save course")
      }

      setModalOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return

    try {
      const res = await fetch(`/api/courses/${courseToDelete.id}`, { method: "DELETE" })
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id))
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCourseToDelete(null)
    }
  }

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {t("Course Management", "কোর্স ব্যবস্থাপনা")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              "Create and organize courses, modules, lessons, quizzes, and live classes.",
              "কোর্স, মডিউল, পাঠ, কুইজ এবং লাইভ ক্লাস তৈরি ও পরিচালনা করুন।"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/courses/enrollments"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <Users className="size-3.5" />
            <span>{t("Enrollment Queue", "পেমেন্ট ভেরিফিকেশন")}</span>
          </Link>
          <Button size="sm" onClick={openCreateModal} className="text-xs gap-1.5 font-semibold">
            <Plus className="size-4" />
            <span>{t("New Course", "নতুন কোর্স")}</span>
          </Button>
        </div>
      </div>

      {/* Filter / Search input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("Filter courses by title...", "কোর্স ফিল্টার করুন...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs h-9"
        />
      </div>

      {/* Course Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("Course", "কোর্স")}</th>
                <th className="px-4 py-3">{t("Curriculum", "সিলেবাস")}</th>
                <th className="px-4 py-3">{t("Pricing", "ফি")}</th>
                <th className="px-4 py-3">{t("Status", "স্ট্যাটাস")}</th>
                <th className="px-4 py-3">{t("Students", "শিক্ষার্থী")}</th>
                <th className="px-4 py-3 text-right">{t("Actions", "অ্যাকশন")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {t("No courses found. Click 'New Course' to get started.", "কোনো কোর্স নেই। শুরু করতে 'নতুন কোর্স' বাটনে ক্লিক করুন।")}
                  </td>
                </tr>
              ) : (
                filtered.map((course) => {
                  return (
                    <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{course.title}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          /{course.slug}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {course.totalSections || course.sections?.length || 0} {t("modules", "মডিউল")}, {course.totalLessons || 0} {t("lessons", "পাঠ")}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {course.isFree ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {t("Free", "ফ্রি")}
                          </Badge>
                        ) : (
                          <span className="font-mono font-bold text-foreground">
                            ৳ {course.discountPrice || course.price}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {course.isPublished ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                            {t("Published", "প্রকাশিত")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t("Draft", "ড্রাফট")}
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">
                          {course._count?.enrollments || 0}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/courses/${course.id}/curriculum`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 px-2 text-[11px] gap-1")}
                          >
                            <Layers className="size-3 text-primary" />
                            <span>{t("Curriculum", "সিলেবাস")}</span>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEditModal(course)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          <Link
                            href={`/courses/${course.slug}`}
                            target="_blank"
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7")}
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setCourseToDelete({ id: course.id, name: course.title })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? t("Edit Course", "কোর্স সম্পাদনা") : t("Create New Course", "নতুন কোর্স তৈরি")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("Fill in basic information, pricing and metadata.", "কোর্সের শিরোনাম, প্রাইজ এবং বিস্তারিত লিখুন।")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Course Title", "কোর্স শিরোনাম")} *</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Full-Stack Web Development with Next.js"
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("URL Slug", "ইউআরএল স্ল্যাগ")} *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. full-stack-web-development"
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("Short Excerpt", "সংক্ষিপ্ত বিবরণ")}</Label>
              <Input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="One sentence summary of the course"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Skill Level", "লেভেল")}</Label>
                <Select value={level} onValueChange={(val) => val && setLevel(val)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("Thumbnail Image URL", "থাম্বনেইল ইমেজ ইউআরএল")}</Label>
                <Input
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="rounded-lg border border-border p-3.5 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold">{t("Free Course", "ফ্রি কোর্স")}</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {t("Students can enroll instantly without payment", "শিক্ষার্থীরা কোনো ফি ছাড়াই যোগ দিতে পারবে")}
                  </p>
                </div>
                <Switch checked={isFree} onCheckedChange={setIsFree} />
              </div>

              {!isFree && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("Regular Price (৳)", "মূল ফি (৳)")} *</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1000"
                      className="text-xs font-mono"
                      required={!isFree}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("Discount Price (৳)", "ডিসকাউন্ট ফি (৳)")}</Label>
                    <Input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="500"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("Detailed Description (Markdown)", "বিস্তারিত বিবরণ")}</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will students learn? Prerequisites, syllabus details..."
                className="text-xs font-mono"
              />
            </div>

            {/* Publish & Feature Switches */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} id="isPublished" />
                <Label htmlFor="isPublished" className="text-xs cursor-pointer">
                  {t("Publish to Catalog", "ওয়েবসাইটে প্রকাশ করুন")}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
                <Label htmlFor="featured" className="text-xs cursor-pointer">
                  {t("Featured", "ফিচার্ড")}
                </Label>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {editingCourse ? t("Save Changes", "পরিবর্তন সংরক্ষণ") : t("Create Course", "কোর্স তৈরি করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(courseToDelete)} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <DialogTitle className="text-base">
                {t("Delete Course?", "কোর্স মুছে ফেলতে চান?")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              {t("Are you sure you want to delete", "আপনি কি নিশ্চিতভাবে")} &quot;
              <strong className="text-foreground">{courseToDelete?.name}</strong>&quot;?{" "}
              {t(
                "This will permanently delete all modules, lessons, and student enrollment records!",
                "এর ফলে সকল মডিউল, লেকচার এবং শিক্ষার্থী রেকর্ড মুছে যাবে!"
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => setCourseToDelete(null)}>
              {t("Cancel", "বাতিল")}
            </Button>
            <Button variant="destructive" type="button" onClick={handleConfirmDelete}>
              {t("Delete Permanently", "স্থায়ীভাবে মুছুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
