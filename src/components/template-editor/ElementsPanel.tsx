"use client"

import {
  Circle,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Minus,
  QrCode,
  Square,
  Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ElementsPanelProps {
  onAddText: (type: "heading" | "subheading" | "body") => void
  onAddShape: (type: "rectangle" | "circle" | "line") => void
  onAddImage: () => void
  onAddQRCode: () => void
}

export function ElementsPanel({
  onAddText,
  onAddShape,
  onAddImage,
  onAddQRCode,
}: ElementsPanelProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Text Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Typography
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddText("heading")}
            className="justify-start gap-2 h-10 px-3 text-left"
          >
            <Heading1 className="size-4 text-primary" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold">Add Heading</span>
              <span className="text-[10px] text-muted-foreground">36px bold text</span>
            </div>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddText("subheading")}
            className="justify-start gap-2 h-10 px-3 text-left"
          >
            <Heading2 className="size-4 text-primary" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold">Add Subheading</span>
              <span className="text-[10px] text-muted-foreground">22px semibold text</span>
            </div>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddText("body")}
            className="justify-start gap-2 h-10 px-3 text-left"
          >
            <Type className="size-4 text-primary" />
            <div className="flex flex-col text-left">
              <span className="text-xs">Add Body Text</span>
              <span className="text-[10px] text-muted-foreground">14px normal text</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Shapes Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Shapes & Lines
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape("rectangle")}
            className="flex-col h-16 gap-1 p-2"
          >
            <Square className="size-5 text-muted-foreground" />
            <span className="text-[10px]">Rectangle</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape("circle")}
            className="flex-col h-16 gap-1 p-2"
          >
            <Circle className="size-5 text-muted-foreground" />
            <span className="text-[10px]">Circle</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape("line")}
            className="flex-col h-16 gap-1 p-2"
          >
            <Minus className="size-5 text-muted-foreground" />
            <span className="text-[10px]">Line</span>
          </Button>
        </div>
      </div>

      {/* Media & QR Code */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Media & Utilities
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddImage}
            className="flex-col h-16 gap-1 p-2 text-center"
          >
            <ImageIcon className="size-5 text-muted-foreground" />
            <span className="text-[10px]">Static Image</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAddQRCode}
            className="flex-col h-16 gap-1 p-2 text-center"
          >
            <QrCode className="size-5 text-muted-foreground" />
            <span className="text-[10px]">Static QR</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
