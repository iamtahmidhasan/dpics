"use client"

import { useState } from "react"
import { Download, ExternalLink, Loader2, RefreshCw, Share2, Sparkles, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { MediaTemplateSummary } from "@/lib/template-engine/types"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MediaTemplateSummary
}

export function PreviewModal({ open, onOpenChange, template }: PreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [previewKey, setPreviewKey] = useState(Date.now())

  const renderUrl = `/api/media/templates/${template.id}/render?preview=1&_t=${previewKey}`
  const downloadUrl = `/api/media/templates/${template.id}/render?preview=1&download=1`

  const handleRefresh = () => {
    setIsLoading(true)
    setPreviewKey(Date.now())
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: template.name,
          text: `Check out ${template.name} generated dynamically on DPICS!`,
          url: window.location.origin + renderUrl,
        })
        toast.success("Shared successfully")
      } catch {
        // User cancelled or share error
      }
    } else {
      navigator.clipboard.writeText(window.location.origin + renderUrl)
      toast.success("Direct image render URL copied to clipboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>Live Server Render Preview</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Generated via Next.js <code className="text-[11px] bg-muted px-1 rounded">ImageResponse</code> with dynamic database fields & zero asset storage.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={handleRefresh} title="Reload render">
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Live Image Container */}
        <div className="relative my-4 flex min-h-[340px] items-center justify-center rounded-lg border border-border/70 bg-muted/30 p-4 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Rendering PNG with Unicode & Fonts...</span>
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewKey}
            src={renderUrl}
            alt={template.name}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              toast.error("Failed to render server image. Check template elements.")
            }}
            className="max-h-[500px] w-auto rounded shadow-lg object-contain"
          />
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Resolution: <span className="font-mono text-foreground">{template.width} × {template.height} px</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 text-xs">
              <Share2 className="size-3.5" />
              <span>Share</span>
            </Button>

            <a href={downloadUrl} download>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <Download className="size-3.5" />
                <span>Download PNG</span>
              </Button>
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
