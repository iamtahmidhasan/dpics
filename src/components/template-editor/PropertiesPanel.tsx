"use client"

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Layers,
  Lock,
  Maximize,
  Ratio,
  RotateCcw,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DYNAMIC_FIELDS } from "@/lib/template-engine/fields"
import type { FabricCustomObject } from "./fabric-adapter"

interface PropertiesPanelProps {
  selectedObject: FabricCustomObject | null
  canvasWidth: number
  canvasHeight: number
  naturalImageWidth?: number
  naturalImageHeight?: number
  onUpdateCanvasDimensions: (width: number, height: number) => void
  onAdaptToImageSize?: () => void
  onUpdateProperty: (key: string, value: unknown) => void
  onDuplicate: () => void
  onDelete: () => void
  onBringForward: () => void
  onSendBackward: () => void
}

const FONTS = [
  { value: "Inter", label: "Inter (Modern Sans)" },
  { value: "Hind Siliguri", label: "Hind Siliguri (Bengali)" },
  { value: "Poppins", label: "Poppins (Display)" },
  { value: "Roboto", label: "Roboto" },
]

const RESOLUTION_PRESETS = [
  { label: "ID Card (1080 × 680)", width: 1080, height: 680 },
  { label: "Full HD (1920 × 1080)", width: 1920, height: 1080 },
  { label: "Vertical Card (680 × 1080)", width: 680, height: 1080 },
  { label: "Square (1080 × 1080)", width: 1080, height: 1080 },
  { label: "Certificate (1920 × 1080)", width: 1920, height: 1080 },
  { label: "Social OG (1200 × 630)", width: 1200, height: 630 },
]

export function PropertiesPanel({
  selectedObject,
  canvasWidth,
  canvasHeight,
  naturalImageWidth,
  naturalImageHeight,
  onUpdateCanvasDimensions,
  onAdaptToImageSize,
  onUpdateProperty,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  // If no object is selected, render Canvas & Background Settings
  if (!selectedObject) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(canvasWidth, canvasHeight)
    const ratioStr = divisor > 0 ? `${canvasWidth / divisor}:${canvasHeight / divisor}` : "—"

    return (
      <div className="flex h-full flex-col divide-y divide-border overflow-y-auto">
        <div className="p-3 bg-muted/20">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Ratio className="size-3.5 text-primary" />
            <span>Canvas Settings</span>
          </span>
        </div>

        {/* Canvas Dimensions */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Output Resolution
              </Label>
              <Badge variant="outline" className="text-[10px] font-mono">
                {ratioStr}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Width (px)</Label>
                <Input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => onUpdateCanvasDimensions(Number(e.target.value) || 1080, canvasHeight)}
                  className="h-8 text-xs font-mono"
                  min={200}
                  max={4000}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Height (px)</Label>
                <Input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => onUpdateCanvasDimensions(canvasWidth, Number(e.target.value) || 680)}
                  className="h-8 text-xs font-mono"
                  min={200}
                  max={4000}
                />
              </div>
            </div>
          </div>

          {/* Sync to Original Background Image Resolution */}
          {naturalImageWidth && naturalImageHeight && (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Original Media Size</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {naturalImageWidth} × {naturalImageHeight} px
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onAdaptToImageSize}
                className="w-full text-xs gap-1.5 h-8 border-primary/40 hover:bg-primary hover:text-primary-foreground"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Adapt to Original Ratio</span>
              </Button>
            </div>
          )}

          {/* Dimension Presets */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
              Dimension Presets
            </Label>
            <div className="grid grid-cols-1 gap-1">
              {RESOLUTION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onUpdateCanvasDimensions(preset.width, preset.height)}
                  className="flex items-center justify-between rounded border border-border/70 bg-card px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted"
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {preset.width}×{preset.height}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <Layers className="size-6 opacity-30 mb-1" />
          <p className="text-[11px]">Click an element on the canvas to inspect its properties</p>
        </div>
      </div>
    )
  }

  const custom = selectedObject.customData || { id: "", type: "rectangle" as const }
  const isText = custom.type === "text" || (selectedObject as { text?: string }).text !== undefined
  const isImage = custom.type === "image"
  const isRect = custom.type === "rectangle"
  const isCircle = custom.type === "circle"

  const isLocked = Boolean(selectedObject.lockMovementX)

  return (
    <div className="flex h-full flex-col divide-y divide-border overflow-y-auto">
      {/* Header & Quick Action bar */}
      <div className="flex items-center justify-between p-3 bg-muted/20">
        <span className="text-xs font-semibold capitalize text-foreground">
          {custom.name || custom.type} Element
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onUpdateProperty("locked", !isLocked)}
            title={isLocked ? "Unlock" : "Lock"}
          >
            {isLocked ? <Lock className="size-3.5 text-amber-500" /> : <Unlock className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDuplicate} title="Duplicate">
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            title="Delete"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Dynamic Field Binding */}
      <div className="p-3 space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
          Data Binding
        </Label>
        <Select
          value={custom.field || "none"}
          onValueChange={(val) => onUpdateProperty("field", val === "none" ? undefined : val)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Static / No Binding" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">
              None (Static Element)
            </SelectItem>
            {DYNAMIC_FIELDS.map((f) => (
              <SelectItem key={f.key} value={f.key} className="text-xs">
                {f.label.en} ({`{{${f.key}}}`})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Typography Properties */}
      {isText && (
        <div className="p-3 space-y-3">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
            Typography
          </Label>

          <div className="space-y-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Text Content</Label>
              <Input
                value={(selectedObject as { text?: string }).text || ""}
                onChange={(e) => onUpdateProperty("text", e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Font Family</Label>
                <Select
                  value={(selectedObject as { fontFamily?: string }).fontFamily || "Inter"}
                  onValueChange={(val) => onUpdateProperty("fontFamily", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value} className="text-xs">
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Font Size (px)</Label>
                <Input
                  type="number"
                  value={Math.round((selectedObject as { fontSize?: number }).fontSize || 24)}
                  onChange={(e) => onUpdateProperty("fontSize", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  min={8}
                  max={200}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Font Weight</Label>
                <Select
                  value={String((selectedObject as { fontWeight?: string | number }).fontWeight || 400)}
                  onValueChange={(val) => onUpdateProperty("fontWeight", Number(val))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400" className="text-xs">Regular (400)</SelectItem>
                    <SelectItem value="500" className="text-xs">Medium (500)</SelectItem>
                    <SelectItem value="600" className="text-xs">SemiBold (600)</SelectItem>
                    <SelectItem value="700" className="text-xs">Bold (700)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground">Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={String(selectedObject.fill || "#000000")}
                    onChange={(e) => onUpdateProperty("fill", e.target.value)}
                    className="size-8 cursor-pointer rounded border border-border bg-transparent p-0"
                  />
                  <Input
                    value={String(selectedObject.fill || "#000000")}
                    onChange={(e) => onUpdateProperty("fill", e.target.value)}
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Alignment */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Alignment</Label>
              <div className="flex items-center gap-1 mt-1">
                <Button
                  variant={(selectedObject as { textAlign?: string }).textAlign === "left" ? "secondary" : "outline"}
                  size="icon-xs"
                  onClick={() => onUpdateProperty("textAlign", "left")}
                >
                  <AlignLeft className="size-3.5" />
                </Button>
                <Button
                  variant={(selectedObject as { textAlign?: string }).textAlign === "center" ? "secondary" : "outline"}
                  size="icon-xs"
                  onClick={() => onUpdateProperty("textAlign", "center")}
                >
                  <AlignCenter className="size-3.5" />
                </Button>
                <Button
                  variant={(selectedObject as { textAlign?: string }).textAlign === "right" ? "secondary" : "outline"}
                  size="icon-xs"
                  onClick={() => onUpdateProperty("textAlign", "right")}
                >
                  <AlignRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Properties */}
      {isImage && (
        <div className="p-3 space-y-3">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
            Image Styling
          </Label>
          <div className="space-y-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Border Radius (px)</Label>
              <Input
                type="number"
                value={custom.borderRadius || 0}
                onChange={(e) => onUpdateProperty("borderRadius", Number(e.target.value))}
                className="h-8 text-xs font-mono"
                min={0}
                max={500}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateProperty("borderRadius", 0)}
                className="flex-1 text-[10px] h-7"
              >
                Square
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateProperty("borderRadius", 16)}
                className="flex-1 text-[10px] h-7"
              >
                Rounded
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateProperty("borderRadius", 999)}
                className="flex-1 text-[10px] h-7"
              >
                Circle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Shape Properties */}
      {(isRect || isCircle) && (
        <div className="p-3 space-y-3">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
            Shape Fill & Stroke
          </Label>
          <div className="space-y-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Fill Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={String(selectedObject.fill || "#3b82f6")}
                  onChange={(e) => onUpdateProperty("fill", e.target.value)}
                  className="size-8 cursor-pointer rounded border border-border bg-transparent p-0"
                />
                <Input
                  value={String(selectedObject.fill || "#3b82f6")}
                  onChange={(e) => onUpdateProperty("fill", e.target.value)}
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
            </div>

            {isRect && (
              <div>
                <Label className="text-[10px] text-muted-foreground">Corner Radius (px)</Label>
                <Input
                  type="number"
                  value={(selectedObject as { rx?: number }).rx || 0}
                  onChange={(e) => onUpdateProperty("rx", Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  min={0}
                  max={200}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Geometry / Transform Properties */}
      <div className="p-3 space-y-3">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
          Position & Size
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">X (px)</Label>
            <Input
              type="number"
              value={Math.round(selectedObject.left || 0)}
              onChange={(e) => onUpdateProperty("left", Number(e.target.value))}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Y (px)</Label>
            <Input
              type="number"
              value={Math.round(selectedObject.top || 0)}
              onChange={(e) => onUpdateProperty("top", Number(e.target.value))}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Width (px)</Label>
            <Input
              type="number"
              value={Math.round((selectedObject.width || 100) * (selectedObject.scaleX || 1))}
              onChange={(e) => onUpdateProperty("width", Number(e.target.value))}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Height (px)</Label>
            <Input
              type="number"
              value={Math.round((selectedObject.height || 100) * (selectedObject.scaleY || 1))}
              onChange={(e) => onUpdateProperty("height", Number(e.target.value))}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Layer Stacking Order */}
      <div className="p-3 space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase">
          Layer Ordering
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onBringForward} className="text-xs h-8">
            Bring Forward
          </Button>
          <Button variant="outline" size="sm" onClick={onSendBackward} className="text-xs h-8">
            Send Backward
          </Button>
        </div>
      </div>
    </div>
  )
}
