"use client"

import {
  ArrowLeft,
  Eye,
  Grid,
  Hand,
  Loader2,
  Magnet,
  Maximize2,
  MousePointer2,
  PanelRight,
  PanelRightClose,
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
import { ThemeSwitcher } from "@/components/theme-switcher"
import type { TemplateType } from "@/lib/template-engine/types"

interface ToolbarProps {
  name: string
  onNameChange: (val: string) => void
  type: TemplateType
  onTypeChange: (val: TemplateType) => void
  toolMode?: "select" | "hand"
  onToolModeChange?: (mode: "select" | "hand") => void
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
  isPropertiesOpen?: boolean
  onToggleProperties?: () => void
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
  toolMode = "select",
  onToolModeChange,
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
  isPropertiesOpen,
  onToggleProperties,
}: ToolbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background px-2.5 sm:px-4 gap-1.5 sm:gap-2">
      {/* Left section: Back & Template metadata */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <Link
          href="/admin/templates"
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Back to Templates"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Template Name"
          className="h-8 w-24 xs:w-32 sm:w-44 md:w-52 text-xs sm:text-sm font-semibold tracking-tight shrink-0"
        />

        <div className="hidden sm:block">
          <Select value={type} onValueChange={(val) => onTypeChange((val as TemplateType) || "MEMBER_CARD")}>
            <SelectTrigger className="h-8 w-32 md:w-40 text-xs">
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
        </div>

        <div className="hidden xl:flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground bg-muted/30 shrink-0">
          <span>{width}</span>
          <span>×</span>
          <span>{height}px</span>
        </div>

        {hasUnsavedChanges ? (
          <Badge variant="warning" className="text-[10px] hidden md:inline-flex shrink-0">
            Unsaved
          </Badge>
        ) : (
          <Badge variant="muted" className="text-[10px] hidden md:inline-flex shrink-0">
            Saved
          </Badge>
        )}
      </div>

      {/* Center section: Tool mode, Undo/Redo & Zoom controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {onToolModeChange && (
          <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5">
            <Button
              variant={toolMode === "select" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onToolModeChange("select")}
              title="Select tool (V)"
              className="h-6 w-6"
            >
              <MousePointer2 className="size-3.5" />
            </Button>
            <Button
              variant={toolMode === "hand" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => onToolModeChange("hand")}
              title="Hand tool - pan canvas (H or hold Spacebar)"
              className="h-6 w-6"
            >
              <Hand className="size-3.5" />
            </Button>
          </div>
        )}

        <div className="mx-0.5 h-4 w-px bg-border" />

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

        <div className="hidden lg:block mx-1 h-4 w-px bg-border" />

        <Button
          variant={showGrid ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={onToggleGrid}
          title="Toggle Grid"
          className="hidden lg:inline-flex"
        >
          <Grid className="size-3.5" />
        </Button>

        <Button
          variant={snapToGrid ? "secondary" : "ghost"}
          size="icon-xs"
          onClick={onToggleSnap}
          title="Snap to Grid"
          className="hidden lg:inline-flex"
        >
          <Magnet className="size-3.5" />
        </Button>

        <div className="hidden sm:block mx-1 h-4 w-px bg-border" />

        {/* Zoom controls */}
        <div className="hidden sm:flex items-center gap-0.5">
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
            className="w-12 text-center text-xs text-muted-foreground font-mono hover:text-foreground"
            title="Click to Fit Screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onZoomChange(Math.min(3.0, zoom + 0.1))}
            title="Zoom In"
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>

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
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ThemeSwitcher className="size-8" />

        <Button variant="outline" size="sm" onClick={onOpenPreview} className="gap-1 sm:gap-1.5 text-xs h-8 px-2 sm:px-3">
          <Eye className="size-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="gap-1 sm:gap-1.5 text-xs font-semibold h-8 px-2.5 sm:px-3"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          <span className="hidden xs:inline">{isSaving ? "Saving..." : "Save"}</span>
        </Button>

        {onToggleProperties && (
          <Button
            variant={isPropertiesOpen ? "secondary" : "outline"}
            size="icon-xs"
            onClick={onToggleProperties}
            title={isPropertiesOpen ? "Hide Properties" : "Show Properties"}
            className="hidden sm:inline-flex lg:hidden shrink-0 size-8"
          >
            {isPropertiesOpen ? <PanelRightClose className="size-4" /> : <PanelRight className="size-4" />}
          </Button>
        )}
      </div>
    </header>
  )
}

