"use client"

import { useState } from "react"
import {
  Download,
  Edit,
  Eye,
  FileImage,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PreviewModal } from "@/components/template-editor/PreviewModal"
import type { MediaItemSummary } from "@/lib/media-constants"
import type { MediaTemplateSummary, TemplateType } from "@/lib/template-engine/types"

interface AdminTemplatesManagerProps {
  initialTemplates: MediaTemplateSummary[]
  availableMedia: MediaItemSummary[]
}

const TYPE_LABELS: Record<TemplateType, string> = {
  MEMBER_CARD: "Member ID Card",
  EVENT_PASS: "Event Pass / Ticket",
  CERTIFICATE: "Certificate",
  COURSE_CERTIFICATE: "Course Certificate",
  ACHIEVEMENT: "Achievement Award",
  SOCIAL_POST: "Social Media Post",
  ANNOUNCEMENT: "Announcement",
  CUSTOM: "Custom",
}

export function AdminTemplatesManager({
  initialTemplates,
  availableMedia,
}: AdminTemplatesManagerProps) {
  const router = useRouter()

  const [templates, setTemplates] = useState<MediaTemplateSummary[]>(initialTemplates)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")

  // Create Template Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createType, setCreateType] = useState<TemplateType>("MEMBER_CARD")
  const [selectedMediaId, setSelectedMediaId] = useState<string>(
    availableMedia[0]?.id || ""
  )
  const [isCreating, setIsCreating] = useState(false)

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<MediaTemplateSummary | null>(null)

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      t.description?.toLowerCase().includes(search.toLowerCase().trim())
    const matchesType = selectedType === "all" || t.type === selectedType
    return matchesSearch && matchesType
  })

  const handleCreateTemplate = async () => {
    if (!createName.trim()) {
      toast.error("Please enter a template name")
      return
    }
    if (!selectedMediaId) {
      toast.error("Please select a background media image")
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch("/api/media/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          type: createType,
          mediaId: selectedMediaId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to create template")
      }

      const created: MediaTemplateSummary = await res.json()
      toast.success("Template created! Opening editor...")
      setIsCreateOpen(false)
      router.push(`/admin/templates/${created.id}/edit`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create template"
      toast.error(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/media/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete template")

      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success("Template deleted")
    } catch {
      toast.error("Could not delete template")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Filter & Create Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          <Select value={selectedType} onValueChange={(val) => setSelectedType(val || "all")}>
            <SelectTrigger className="h-9 w-44 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 text-xs font-semibold"
        >
          <Plus className="size-4" />
          <span>Create Template</span>
        </Button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <FolderTree className="size-10 text-muted-foreground/60 mb-3" />
          <CardTitle className="text-base">No Templates Found</CardTitle>
          <CardDescription className="text-xs mt-1 max-w-md">
            Create reusable Canva-style design templates using any background image from your Media library.
          </CardDescription>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Create First Template</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const renderPreviewUrl = `/api/media/templates/${template.id}/render?preview=1`

            return (
              <Card
                key={template.id}
                className="group flex flex-col overflow-hidden transition-all hover:border-primary/50 hover:shadow-md"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 border-b border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={renderPreviewUrl}
                    alt={template.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="secondary" className="text-[10px] backdrop-blur-md bg-background/80">
                      {TYPE_LABELS[template.type] || template.type}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold truncate">
                      {template.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                    {template.description || `Canvas resolution: ${template.width} × ${template.height}px`}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex items-center justify-between p-4 pt-2 mt-auto border-t border-border/50">
                  <span className="text-[11px] text-muted-foreground">
                    {template.design.elements?.length || 0} elements
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setPreviewTemplate(template)}
                      title="Live Server Preview"
                    >
                      <Eye className="size-3.5 text-muted-foreground" />
                    </Button>

                    <Link href={`/admin/templates/${template.id}/edit`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Edit className="size-3" />
                        <span>Edit</span>
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deletingId === template.id}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Create New Design Template</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a background image from your Media library to start designing with Fabric.js.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Template Name</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Official DPICS Member ID Card 2026"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Template Category</Label>
              <Select value={createType} onValueChange={(val) => setCreateType((val as TemplateType) || "MEMBER_CARD")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Background Image Asset</Label>
              {availableMedia.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No images found in Media Library. Please upload an image first in <Link href="/admin/media" className="text-primary underline">Media</Link>.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border rounded-md">
                  {availableMedia.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMediaId(m.id)}
                      className={`relative aspect-[16/10] overflow-hidden rounded border transition-all ${
                        selectedMediaId === m.id
                          ? "ring-2 ring-primary border-primary"
                          : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnailUrl || m.url}
                        alt={m.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTemplate}
              disabled={isCreating || !createName.trim() || !selectedMediaId}
              className="gap-1.5 text-xs font-semibold"
            >
              {isCreating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              <span>Create & Open Editor</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          open={Boolean(previewTemplate)}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          template={previewTemplate}
        />
      )}
    </div>
  )
}
