"use client"

import {
  ArrowLeft,
  Check,
  Eye,
  Grid,
  Loader2,
  Magnet,
  Maximize2,
  Redo2,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { TemplateType } from "@/lib/template-engine/types"

interface ToolbarProps {
  name: string
  onNameChange: (val: string) => void
  type: TemplateType
  onTypeChange: (val: TemplateType) => void
  width: number
  height: number
  zoom: number
  onZoomChange: (val: number) => void
  onFitZoom: () => void
  showGrid: boolean
  onToggleGrid: () => void
  snapToGrid: boolean
  onToggleSnap: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onOpenPreview: () => void
  onSave: () => void
  isSaving: boolean
  hasUnsavedChanges: boolean
}

const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: "MEMBER_CARD", label: "Member ID Card" },
  { value: "EVENT_PASS", label: "Event Pass / Ticket" },
  { value: "CERTIFICATE", label: "Certificate of Appreciation" },
  { value: "COURSE_CERTIFICATE", label: "Course Completion Certificate" },
  { value: "ACHIEVEMENT", label: "Achievement Award" },
  { value: "SOCIAL_POST", label: "Social Media Post" },
  { value: "ANNOUNCEMENT", label: "Announcement Banner" },
  { value: "CUSTOM", label: "Custom Template" },
]

export function Toolbar({
  name,
  onNameChange,
  type,
  onTypeChange,
  width,
  height,
  zoom,
  onZoomChange,
  onFitZoom,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPreview,
  onSave,
  isSaving,
  hasUnsavedChanges,
}: ToolbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background px-4">
      {/* Left section: Back & Template metadata */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/templates"
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Back to Templates"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Template Name"
            className="h-8 w-44 text-sm font-semibold tracking-tight md:w-56"
          />

          <Select value={type} onValueChange={(val) => onTypeChange((val as TemplateType) || "MEMBER_CARD")}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden lg:flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-muted/30">
            <span>{width}</span>
            <span>×</span>
            <span>{height}px</span>
          </div>

          {hasUnsavedChanges ? (
            <Badge variant="warning" className="text-[10px] hidden sm:inline-flex">
              Unsaved
            </Badge>
          ) : (
            <Badge variant="muted" className="text-[10px] hidden sm:inline-flex">
              Saved
            </Badge>
          )}
        </div>
      </div>

      {/* Center section: Canvas tools */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="size-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        <Button
          variant={showGrid ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={onToggleGrid}
          title="Toggle Grid"
        >
          <Grid className="size-3.5" />
        </Button>

        <Button
          variant={snapToGrid ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={onToggleSnap}
          title="Snap to Grid"
        >
          <Magnet className="size-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Zoom controls */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onZoomChange(Math.max(0.15, zoom - 0.1))}
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={onFitZoom}
          className="w-14 text-center text-xs text-muted-foreground font-mono hover:text-foreground"
          title="Click to Fit Screen"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))}
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onFitZoom}
          title="Fit Canvas to Screen"
        >
          <Maximize2 className="size-3.5" />
        </Button>
      </div>

      {/* Right section: Preview & Save */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenPreview} className="gap-1.5 text-xs">
          <Eye className="size-3.5" />
          <span>Preview</span>
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="gap-1.5 text-xs font-semibold"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          <span>{isSaving ? "Saving..." : "Save Template"}</span>
        </Button>
      </div>
    </header>
  )
}
