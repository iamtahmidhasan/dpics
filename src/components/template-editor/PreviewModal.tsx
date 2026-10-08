"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, RefreshCw, Share2, Sparkles } from "lucide-react"
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
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)

  const fetchLivePreview = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/media/templates/${template.id}/render?preview=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width: template.width,
          height: template.height,
          type: template.type,
          design: template.design,
        }),
      })

      if (!res.ok) {
        throw new Error("Server returned error during image render")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch (err) {
      console.error("Live preview error:", err)
      toast.error("Failed to render server image preview.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchLivePreview()
    }
    return () => {
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template.design, template.width, template.height])

  const handleDownload = () => {
    if (!previewBlobUrl) return
    const a = document.createElement("a")
    a.href = previewBlobUrl
    const sanitizedName = template.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
    a.download = `${sanitizedName}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShare = async () => {
    if (previewBlobUrl && navigator.share) {
      try {
        const res = await fetch(previewBlobUrl)
        const blob = await res.blob()
        const file = new File([blob], `${template.name}.png`, { type: "image/png" })
        await navigator.share({
          title: template.name,
          text: `Check out ${template.name} generated dynamically on DPICS!`,
          files: [file],
        })
        toast.success("Shared successfully")
        return
      } catch {
        // Fallback below
      }
    }
    const publicUrl = `${window.location.origin}/api/media/templates/${template.id}/render?preview=1`
    navigator.clipboard.writeText(publicUrl)
    toast.success("Direct image render URL copied to clipboard")
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
                Rendered live with Next.js <code className="text-[11px] bg-muted px-1 rounded">ImageResponse</code> using current canvas edits & dynamic data.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={fetchLivePreview} title="Reload render">
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Live Image Container */}
        <div className="relative my-4 flex min-h-[340px] items-center justify-center rounded-lg border border-border/70 bg-muted/30 p-4 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Rendering exact PNG with Unicode & Fonts...</span>
            </div>
          )}

          {previewBlobUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewBlobUrl}
              alt={template.name}
              className="max-h-[500px] w-auto rounded shadow-lg object-contain"
            />
          )}
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

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!previewBlobUrl}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="size-3.5" />
              <span>Download PNG</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

