"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import "plyr-react/plyr.css"
import type { PlyrSource, PlyrOptions } from "plyr-react"
import { PlayCircle } from "lucide-react"

// Dynamically import Plyr to prevent server-side rendering issues
const Plyr = dynamic(
  () => import("plyr-react").then((mod) => mod.Plyr),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-neutral-900 text-neutral-400">
        <div className="flex flex-col items-center gap-2">
          <PlayCircle className="size-10 animate-pulse text-primary" />
          <span className="text-xs">Loading player...</span>
        </div>
      </div>
    ),
  }
)

function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()

  // If directly an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  // youtube.com/watch?v=...
  const matchWatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (matchWatch && matchWatch[1]) return matchWatch[1]

  // youtu.be/...
  const matchShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (matchShort && matchShort[1]) return matchShort[1]

  // youtube.com/embed/...
  const matchEmbed = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (matchEmbed && matchEmbed[1]) return matchEmbed[1]

  return trimmed
}

interface VideoPlayerProps {
  videoUrl?: string | null
  title?: string
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const videoId = extractYouTubeId(videoUrl)

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <PlayCircle className="size-12 text-muted-foreground/50" />
          <p className="text-sm font-medium">No video attached to this lesson</p>
          <p className="text-xs text-muted-foreground/75">
            Check the other tabs below for live class details, notes, quizzes, or assignments.
          </p>
        </div>
      </div>
    )
  }

  const plyrSource: PlyrSource = {
    type: "video",
    sources: [
      {
        src: videoId,
        provider: "youtube",
      },
    ],
  }

  const plyrOptions: any = {
    controls: [
      "play-large",
      "play",
      "progress",
      "current-time",
      "duration",
      "mute",
      "volume",
      "captions",
      "settings",
      "pip",
      "fullscreen",
    ],
    settings: ["speed", "quality"],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    youtube: {
      noCookie: true,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      modestbranding: 1,
    },
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
      <Plyr source={plyrSource} options={plyrOptions} />
    </div>
  )
}
