"use client"

import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Lock,
  Minus,
  QrCode,
  Square,
  Trash2,
  Type,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FabricCustomObject } from "./fabric-adapter"

interface LayersPanelProps {
  objects: FabricCustomObject[]
  selectedObject: FabricCustomObject | null
  onSelectObject: (obj: FabricCustomObject) => void
  onToggleVisibility: (obj: FabricCustomObject) => void
  onToggleLock: (obj: FabricCustomObject) => void
  onDeleteObject: (obj: FabricCustomObject) => void
}

export function LayersPanel({
  objects,
  selectedObject,
  onSelectObject,
  onToggleVisibility,
  onToggleLock,
  onDeleteObject,
}: LayersPanelProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case "text":
        return <Type className="size-3.5 text-emerald-500" />
      case "image":
        return <ImageIcon className="size-3.5 text-blue-500" />
      case "qr":
        return <QrCode className="size-3.5 text-amber-500" />
      case "line":
        return <Minus className="size-3.5 text-foreground" />
      default:
        return <Square className="size-3.5 text-purple-500" />
    }
  }

  // Reverse list so top layers appear first in UI
  const reversed = [...objects].reverse()

  return (
    <div className="flex h-full flex-col space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Layers className="size-3.5" />
          <span>Layers ({objects.length})</span>
        </h3>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {reversed.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Canvas is empty. Add elements to view layers.
          </div>
        ) : (
          reversed.map((obj) => {
            const custom = obj.customData || { id: "", type: "rectangle" as const }
            const isSelected = selectedObject === obj
            const isLocked = Boolean(obj.lockMovementX)
            const isVisible = obj.visible !== false

            let label = custom.name || custom.type
            if (custom.field) {
              label = `{{${custom.field}}}`
            } else if (custom.type === "text" && (obj as { text?: string }).text) {
              label = (obj as { text?: string }).text || label
            }

            return (
              <div
                key={custom.id}
                onClick={() => onSelectObject(obj)}
                className={`group flex items-center justify-between rounded-md border p-2 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 font-medium text-foreground"
                    : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getIcon(custom.type)}
                  <span className="truncate max-w-[110px] text-xs">
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleVisibility(obj)
                    }}
                    title={isVisible ? "Hide" : "Show"}
                  >
                    {isVisible ? <Eye className="size-3" /> : <EyeOff className="size-3 text-muted-foreground" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleLock(obj)
                    }}
                    title={isLocked ? "Unlock" : "Lock"}
                  >
                    {isLocked ? <Lock className="size-3 text-amber-500" /> : <Unlock className="size-3 text-muted-foreground" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteObject(obj)
                    }}
                    title="Delete"
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
