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

const PLYR_OPTIONS: PlyrOptions = {
  controls: [
    "play-large",
    "restart",
    "rewind",
    "play",
    "fast-forward",
    "progress",
    "current-time",
    "duration",
    "mute",
    "volume",
    "captions",
    "settings",
    "pip",
    "airplay",
    "fullscreen",
  ],
  seekTime: 10,
  settings: ["captions", "quality", "speed", "loop"],
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
  keyboard: { focused: true, global: false },
  tooltips: { controls: true, seek: true },
  clickToPlay: true,
  invertTime: false,
  toggleInvert: true,
  resetOnEnd: false,
  ratio: "16:9",
  youtube: {
    noCookie: true,
    rel: 0,
    showinfo: 0,
    iv_load_policy: 3,
    modestbranding: 1,
  },
}

interface VideoPlayerProps {
  videoUrl?: string | null
  title?: string
}

function VideoPlayerComponent({ videoUrl }: VideoPlayerProps) {
  const videoId = extractYouTubeId(videoUrl)

  const plyrSource = React.useMemo<PlyrSource | null>(() => {
    if (!videoId) return null
    return {
      type: "video",
      sources: [
        {
          src: videoId,
          provider: "youtube",
        },
      ],
    }
  }, [videoId])

  if (!videoId || !plyrSource) {
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

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black shadow-lg [&_.plyr]:h-full [&_.plyr]:w-full [&_.plyr]:[--plyr-color-main:var(--primary)]">
      <Plyr source={plyrSource} options={PLYR_OPTIONS} />
    </div>
  )
}

export const VideoPlayer = React.memo(VideoPlayerComponent)

