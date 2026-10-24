"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  ExternalLink,
  Flashlight,
  FlashlightOff,
  History,
  Loader2,
  RefreshCw,
  Search,
  SwitchCamera,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react"
import jsQR from "jsqr"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { EventRegistrationStatus } from "@/generated/prisma/enums"

interface VerificationData {
  isValid: boolean
  credentialType: "EVENT_PASS" | "MEMBER_ID" | "CERTIFICATE" | "UNKNOWN"
  code: string
  title: string
  titleBn?: string | null
  status?: string | null
  statusLabel: string
  recipientName: string
  recipientAvatar?: string | null
  studentId?: string | null
  department?: string | null
  semester?: string | null
  shift?: string | null
  institution?: string | null
  issuedAt?: string | null
  validUntil?: string | null
  issuer?: string | null
  issuerLocation?: string | null
  detailsUrl?: string | null
  metadata?: {
    venue?: string | null
    eventDate?: string | null
    ticketCode?: string | null
    registrationId?: string | null
  }
  isAdmin?: boolean
}

interface RecentScanItem {
  id: string
  name: string
  code: string
  status: string
  isValid: boolean
  time: string
}

// Clean helper to extract exact ticket/credential code from URL or raw text
function extractCodeFromInput(raw: string): string {
  const str = raw.trim()
  if (!str) return ""
  try {
    if (str.startsWith("http://") || str.startsWith("https://") || str.includes("/")) {
      const url = new URL(str, "https://dummy.org")
      const segments = url.pathname.split("/").filter(Boolean)
      if (segments.length > 0) {
        return segments[segments.length - 1]
      }
    }
  } catch {
    const parts = str.split("/").filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
  return str
}

// High-speed audio chime feedback using Web Audio API
function playScanSound(type: "success" | "warning" | "error", soundEnabled = true) {
  if (!soundEnabled || typeof window === "undefined") return
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (type === "success") {
      // Pleasant double high ding (880Hz -> 1760Hz)
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.16)
    } else if (type === "warning") {
      // Moderate buzz for duplicate / already attended
      osc.type = "triangle"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    } else {
      // Low buzz for invalid
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.26)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.26)
    }
  } catch {
    // Ignore audio permission/autoplay limitations
  }
}

export default function VerificationPortalPage() {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  const [inputCode, setInputCode] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoAdmit, setAutoAdmit] = useState(true)

  const [isVerifying, setIsVerifying] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationData | null>(null)
  const [flashColor, setFlashColor] = useState<"emerald" | "amber" | "red" | null>(null)

  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([])
  const [sessionCount, setSessionCount] = useState({ total: 0, admitted: 0, issues: 0 })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isVerifyingRef = useRef(false)
  const autoAdmitRef = useRef(true)
  const soundEnabledRef = useRef(true)
  const cooldownCodeRef = useRef<string | null>(null)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef(0)

  useEffect(() => {
    autoAdmitRef.current = autoAdmit
  }, [autoAdmit])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Attach stream to video element whenever camera becomes active or video mounts
  useEffect(() => {
    const video = videoRef.current
    if (isCameraActive && video && streamRef.current) {
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current
      }
      video.play().catch((err) => {
        console.warn("Video playback warning:", err)
      })
    }
  }, [isCameraActive])

  // Start device camera
  const startCamera = useCallback(
    async (facing: "environment" | "user" = cameraFacing) => {
      setCameraError(null)

      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          t({
            en: "Camera access requires HTTPS or localhost. Please ensure you are connected securely.",
            bn: "ক্যামেরা ব্যবহারের জন্য HTTPS অথবা localhost প্রয়োজন।",
          })
        )
        return
      }

      // Stop previous tracks if running
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      try {
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          })
        } catch {
          // Fallback to any available video device
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }

        streamRef.current = stream

        // Ensure state is active first so the video element exists in DOM
        setIsCameraActive(true)

        // If video element is already present, assign srcObject and play
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch (playErr) {
            console.warn("Camera auto-play warning:", playErr)
          }
        }

        // Check if multiple camera devices exist for switching
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter((d) => d.kind === "videoinput")
          setHasMultipleCameras(videoDevices.length > 1)
        } catch {
          // Ignore enumeration failure
        }

        // Check torch support
        const videoTrack = stream.getVideoTracks()[0]
        const capabilities = (videoTrack?.getCapabilities?.() || {}) as { torch?: boolean }
        setHasTorch(Boolean(capabilities.torch))
      } catch (err: unknown) {
        let errorMsg = t({
          en: "Could not access camera. Please allow camera permissions.",
          bn: "ক্যামেরা চালু করা যায়নি। ক্যামেরার অনুমতি দিন।",
        })

        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            errorMsg = t({
              en: "Camera permission denied. Please allow camera permissions in your browser.",
              bn: "ক্যামেরার অনুমতি প্রত্যাখ্যাত হয়েছে। ব্রাউজারে অনুমতি দিন।",
            })
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            errorMsg = t({
              en: "No camera found on this device.",
              bn: "এই ডিভাইসে কোনো ক্যামেরা পাওয়া যায়নি।",
            })
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            errorMsg = t({
              en: "Camera is currently in use by another application.",
              bn: "ক্যামেরাটি অন্য কোনো অ্যাপে ব্যবহৃত হচ্ছে।",
            })
          }
        }

        setCameraError(errorMsg)
        setIsCameraActive(false)
      }
    },
    [cameraFacing, t]
  )

  // Switch between front and back camera
  const toggleFacingMode = useCallback(() => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment"
    setCameraFacing(nextFacing)
    startCamera(nextFacing)
  }, [cameraFacing, startCamera])

  // Toggle torch / flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return
    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (videoTrack && hasTorch) {
      try {
        const nextState = !torchEnabled
        await (
          videoTrack as unknown as {
            applyConstraints: (c: unknown) => Promise<void>
          }
        ).applyConstraints({
          advanced: [{ torch: nextState }],
        })
        setTorchEnabled(nextState)
      } catch (err) {
        console.warn("Torch toggle warning:", err)
      }
    }
  }, [hasTorch, torchEnabled])

  // Stop device camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
    setTorchEnabled(false)
  }, [])

  // Fast verify code against API
  const handleVerify = useCallback(
    async (rawCode: string) => {
      const code = extractCodeFromInput(rawCode)
      if (!code || isVerifyingRef.current) return

      isVerifyingRef.current = true
      setIsVerifying(true)

      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(code)}`)
        const data: VerificationData = await res.json()

        if (res.ok) {
          const isAttended = data.status === "ATTENDED"
          const isValidPass = data.isValid

          // Determine sound and flash
          if (!isValidPass) {
            playScanSound("error", soundEnabledRef.current)
            setFlashColor("red")
            setTimeout(() => setFlashColor(null), 600)
          } else if (isAttended) {
            playScanSound("warning", soundEnabledRef.current)
            setFlashColor("amber")
            setTimeout(() => setFlashColor(null), 600)
          } else {
            playScanSound("success", soundEnabledRef.current)
            setFlashColor("emerald")
            setTimeout(() => setFlashColor(null), 600)
          }

          // AUTO-ADMIT / CHECK-IN FEATURE FOR HIGH-SPEED SCANNING:
          // If auto-admit is ON, user has admin rights, and attendee is CONFIRMED, mark attended instantly!
          if (
            autoAdmitRef.current &&
            data.isAdmin &&
            data.metadata?.registrationId &&
            data.status === "CONFIRMED"
          ) {
            try {
              const patchRes = await fetch(
                `/api/admin/tickets/${data.metadata.registrationId}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: EventRegistrationStatus.ATTENDED }),
                }
              )
              if (patchRes.ok) {
                data.status = EventRegistrationStatus.ATTENDED
                data.statusLabel = "ATTENDED"
              }
            } catch {
              // Ignore background auto-patch network error
            }
          }

          setResult(data)

          // Add to recent scans log
          const newStatus = data.status || data.statusLabel
          setRecentScans((prev) => [
            {
              id: `${data.code}-${Date.now()}`,
              name: data.recipientName,
              code: data.code,
              status: newStatus,
              isValid: data.isValid,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            },
            ...prev.slice(0, 7),
          ])

          // Update session counter
          setSessionCount((prev) => ({
            total: prev.total + 1,
            admitted: prev.admitted + (data.isValid ? 1 : 0),
            issues: prev.issues + (data.isValid ? 0 : 1),
          }))

          if (navigator.vibrate) {
            navigator.vibrate(data.isValid ? [60, 40, 60] : [150])
          }
        } else {
          playScanSound("error", soundEnabledRef.current)
          setFlashColor("red")
          setTimeout(() => setFlashColor(null), 600)
          toast.error(t({ en: `Invalid or unrecognized: "${code}"`, bn: `অবৈধ কোড: "${code}"` }))
          setSessionCount((prev) => ({ ...prev, total: prev.total + 1, issues: prev.issues + 1 }))
        }
      } catch {
        playScanSound("error", soundEnabledRef.current)
        toast.error(t({ en: "Network error verifying ticket", bn: "যাচাই করতে সমস্যা হয়েছে" }))
      } finally {
        isVerifyingRef.current = false
        setIsVerifying(false)
      }
    },
    [t]
  )

  // High-performance continuous camera scanning loop
  useEffect(() => {
    if (!isCameraActive) return

    let animId: number
    let isCancelled = false

    const scan = () => {
      if (isCancelled) return

      const video = videoRef.current
      const canvas = canvasRef.current

      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        !isVerifyingRef.current
      ) {
        const now = Date.now()
        // Fast throttled frame scan: ~12 times per second for 0% CPU lag
        if (now - lastScanTimeRef.current >= 80) {
          lastScanTimeRef.current = now

          if (canvas) {
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              // Scale video down to max 640px for instant jsQR decoding (<3ms)
              const maxDim = 640
              let w = video.videoWidth
              let h = video.videoHeight
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w)
                w = maxDim
              }

              if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
              }

              ctx.drawImage(video, 0, 0, w, h)
              const imgData = ctx.getImageData(0, 0, w, h)
              const qr = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: "dontInvert",
              })

              if (qr && qr.data) {
                const code = qr.data.trim()
                if (code && code !== cooldownCodeRef.current) {
                  cooldownCodeRef.current = code
                  // Reset cooldown for this specific code after 2.5s
                  if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
                  cooldownTimerRef.current = setTimeout(() => {
                    cooldownCodeRef.current = null
                  }, 2500)

                  handleVerify(code)
                }
              }
            }
          }
        }
      }

      if (!isCancelled) {
        animId = requestAnimationFrame(scan)
      }
    }

    animId = requestAnimationFrame(scan)

    return () => {
      isCancelled = true
      cancelAnimationFrame(animId)
    }
  }, [handleVerify, isCameraActive])

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [stopCamera])

  // Admin action: manual status update
  const handleUpdateStatus = async (newStatus: EventRegistrationStatus) => {
    if (!result?.metadata?.registrationId || isUpdatingStatus) return
    setIsUpdatingStatus(true)

    try {
      const res = await fetch(`/api/admin/tickets/${result.metadata.registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast.success(
          t({
            en: `Ticket status updated to ${newStatus}`,
            bn: `টিকেট সফলভাবে ${newStatus} করা হয়েছে`,
          })
        )
        setResult((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                statusLabel: newStatus,
                isValid:
                  newStatus === EventRegistrationStatus.CONFIRMED ||
                  newStatus === EventRegistrationStatus.ATTENDED,
              }
            : null
        )
      } else {
        const err = await res.json()
        toast.error(err.message || "Failed to update status")
      }
    } catch {
      toast.error("Network error while updating status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputCode.trim()) {
      handleVerify(inputCode.trim())
    }
  }

  const clearSessionStats = () => {
    setSessionCount({ total: 0, admitted: 0, issues: 0 })
    setRecentScans([])
    setResult(null)
    toast.info(t({ en: "Session counter reset", bn: "কাউন্টার রিসেট করা হয়েছে" }))
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t({ en: "Instant Ticket Scanner", bn: "দ্রুত টিকেট স্ক্যানার" })}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t({
              en: "High-speed auto-scanner for event passes and credentials.",
              bn: "ইভেন্ট টিকেট ও সনদপত্র স্বয়ংক্রিয় দ্রুত স্ক্যান করুন।",
            })}
          </p>
        </div>

        {/* Live Session Counter */}
        <div className="flex items-center gap-2 bg-muted/60 border border-border/80 px-3 py-1.5 rounded-xl text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              {t({ en: "Admitted", bn: "উপস্থিত" })}
            </span>
            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
              {sessionCount.admitted}
            </span>
          </div>
          <div className="h-6 w-px bg-border/80 mx-1" />
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              {t({ en: "Total Scanned", bn: "মোট" })}
            </span>
            <span className="font-bold text-sm text-foreground">{sessionCount.total}</span>
          </div>
          {sessionCount.total > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSessionStats}
              className="size-6 text-muted-foreground hover:text-foreground ml-1"
              title="Reset stats"
            >
              <RefreshCw className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Manual Code Input Bar */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-3.5 sm:p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder={t({
                en: "Paste URL or enter code (e.g. DPI-EVT-9281)...",
                bn: "লিংক পেস্ট করুন অথবা কোড লিখুন (যেমন DPI-EVT-9281)...",
              })}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="h-10 text-xs sm:text-sm font-mono bg-background"
            />
            <Button
              type="submit"
              disabled={!inputCode.trim() || isVerifying}
              className="h-10 px-4 font-semibold text-xs gap-1.5 shrink-0"
            >
              {isVerifying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              {t({ en: "Verify", bn: "যাচাই" })}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Scanner & Camera Viewport */}
      <Card className="border border-border shadow-md overflow-hidden bg-card">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {!isCameraActive ? (
                <Button
                  type="button"
                  onClick={() => startCamera()}
                  className="h-9 px-4 text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-sm"
                >
                  <Camera className="size-4" />
                  {t({ en: "Start Auto-Scanner", bn: "ক্যামেরা চালু করুন" })}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopCamera}
                  className="h-9 px-4 text-xs font-bold gap-2 shadow-sm"
                >
                  <CameraOff className="size-4" />
                  {t({ en: "Stop Camera", bn: "ক্যামেরা বন্ধ করুন" })}
                </Button>
              )}
            </div>

            {/* Quick Action Toggles */}
            <div className="flex items-center gap-1.5">
              {/* Auto-Admit Toggle */}
              <Button
                type="button"
                variant={autoAdmit ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAutoAdmit(!autoAdmit)
                  toast.info(
                    !autoAdmit
                      ? t({ en: "Auto-Admit ON: Confirmed tickets are checked in automatically", bn: "অটো-উপস্থিতি চালু" })
                      : t({ en: "Auto-Admit OFF", bn: "অটো-উপস্থিতি বন্ধ" })
                  )
                }}
                className={`h-8 px-2.5 text-xs font-bold gap-1.5 transition-all ${
                  autoAdmit
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "text-muted-foreground"
                }`}
                title="Automatically mark valid tickets as Attended"
              >
                <Zap className="size-3.5" />
                {t({ en: "Auto-Admit", bn: "অটো-উপস্থিতি" })}
              </Button>

              {/* Sound Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
              >
                {soundEnabled ? (
                  <Volume2 className="size-4 text-primary" />
                ) : (
                  <VolumeX className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Camera Viewport */}
          {isCameraActive ? (
            <div className="relative aspect-4/3 sm:aspect-16/9 w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center border border-border shadow-inner">
              <video
                ref={(el) => {
                  videoRef.current = el
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current
                    el.play().catch(() => {})
                  }
                }}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  e.currentTarget.play().catch(() => {})
                }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Top Controls Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                {hasTorch && (
                  <Button
                    type="button"
                    size="icon"
                    variant={torchEnabled ? "default" : "secondary"}
                    onClick={toggleTorch}
                    className="size-8 rounded-full shadow-md backdrop-blur-xs"
                    title={torchEnabled ? "Turn off torch" : "Turn on torch"}
                  >
                    {torchEnabled ? (
                      <Flashlight className="size-4 text-amber-400" />
                    ) : (
                      <FlashlightOff className="size-4" />
                    )}
                  </Button>
                )}

                {hasMultipleCameras && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={toggleFacingMode}
                    className="size-8 rounded-full shadow-md backdrop-blur-xs"
                    title={t({ en: "Switch Camera", bn: "ক্যামেরা পরিবর্তন" })}
                  >
                    <SwitchCamera className="size-4" />
                  </Button>
                )}
              </div>

              {/* Viewfinder Target & Laser Scanning HUD */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div
                  className={`relative size-52 sm:size-64 border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                    flashColor === "emerald"
                      ? "border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-105"
                      : flashColor === "amber"
                        ? "border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.8)] scale-105"
                        : flashColor === "red"
                          ? "border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.8)] scale-105"
                          : "border-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  }`}
                >
                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 size-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 size-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 size-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 size-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                  {/* Animated Laser Scanning Beam */}
                  <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#10b981] animate-[bounce_1.8s_infinite]" />
                </div>
              </div>

              {/* Processing Overlay */}
              {isVerifying && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-30">
                  <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-xl border border-border">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {t({ en: "Checking ticket...", bn: "যাচাই হচ্ছে..." })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Standby Card */
            <div className="rounded-2xl border-2 border-dashed border-border/80 p-8 sm:p-12 text-center space-y-3 bg-muted/20">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Camera className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm sm:text-base">
                  {t({ en: "Scanner is on Standby", bn: "স্ক্যানার প্রস্তুত রয়েছে" })}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t({
                    en: "Click Start Auto-Scanner to activate the continuous camera reader or paste a code above.",
                    bn: "ক্যামেরা চালু করতে স্টার্ট বাটনে ক্লিক করুন অথবা কোড পেস্ট করুন।",
                  })}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => startCamera()}
                className="h-10 px-5 text-xs font-bold gap-2"
              >
                <Camera className="size-4" />
                {t({ en: "Start Auto-Scanner", bn: "ক্যামেরা চালু করুন" })}
              </Button>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
              {cameraError}
            </p>
          )}

          {/* LIVE SCAN RESULT CARD */}
          {result && (
            <div
              className={`rounded-xl border p-4 sm:p-5 transition-all shadow-sm space-y-4 ${
                result.status === "ATTENDED"
                  ? "border-teal-500/40 bg-teal-500/10 text-teal-900 dark:text-teal-100"
                  : result.isValid
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                    : "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
              }`}
            >
              {/* Header Status */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {result.isValid ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold text-sm block">
                      {result.status === "ATTENDED"
                        ? t({ en: "Attended & Checked In", bn: "উপস্থিতি নিশ্চিতকৃত" })
                        : result.isValid
                          ? t({ en: "Valid Entry Ticket", bn: "বৈধ প্রবেশ টিকেট" })
                          : t({ en: "Invalid / Expired", bn: "অবৈধ বা মেয়াদোত্তীর্ণ" })}
                    </span>
                    <span className="text-[11px] opacity-80 font-mono">{result.code}</span>
                  </div>
                </div>

                <Badge
                  className={`text-xs font-bold uppercase tracking-wider ${
                    result.status === "ATTENDED"
                      ? "bg-teal-600 text-white"
                      : result.status === "CONFIRMED"
                        ? "bg-emerald-600 text-white"
                        : result.status === "PENDING"
                          ? "bg-amber-600 text-white"
                          : "bg-red-600 text-white"
                  }`}
                >
                  {result.status || result.statusLabel}
                </Badge>
              </div>

              {/* Attendee Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-b border-border/50 py-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {t({ en: "Attendee", bn: "অংশগ্রহণকারী" })}
                  </span>
                  <span className="font-bold text-foreground text-sm block truncate">
                    {result.recipientName}
                  </span>
                  {result.studentId && (
                    <span className="text-muted-foreground text-[11px] block">
                      ID: {result.studentId}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {t({ en: "Event", bn: "ইভেন্ট" })}
                  </span>
                  <span className="font-bold text-foreground text-sm block truncate">
                    {isBn && result.titleBn ? result.titleBn : result.title}
                  </span>
                  {result.metadata?.venue && (
                    <span className="text-muted-foreground text-[11px] block truncate">
                      {result.metadata.venue}
                    </span>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {t({ en: "Department / Info", bn: "বিভাগ / বিবরণ" })}
                  </span>
                  <span className="font-medium text-foreground text-xs block truncate">
                    {result.department || result.institution || "DPI"}
                  </span>
                  {result.semester && (
                    <span className="text-muted-foreground text-[11px] block">
                      {result.semester} {result.shift ? `(${result.shift})` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                {/* Admin Quick Status Update */}
                {result.isAdmin && result.metadata?.registrationId && (
                  <div className="flex items-center gap-2">
                    {result.status !== EventRegistrationStatus.ATTENDED && (
                      <Button
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus(EventRegistrationStatus.ATTENDED)}
                        className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        {t({ en: "Mark Attended", bn: "উপস্থিতি নিশ্চিত করুন" })}
                      </Button>
                    )}

                    <Select
                      value={result.status || undefined}
                      onValueChange={(val) => {
                        if (val) handleUpdateStatus(val as EventRegistrationStatus)
                      }}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold bg-background w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EventRegistrationStatus.CONFIRMED}>CONFIRMED</SelectItem>
                        <SelectItem value={EventRegistrationStatus.ATTENDED}>ATTENDED</SelectItem>
                        <SelectItem value={EventRegistrationStatus.PENDING}>PENDING</SelectItem>
                        <SelectItem value={EventRegistrationStatus.CANCELLED}>CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* View Ticket Link */}
                {result.metadata?.ticketCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/events/ticket/${result.metadata.ticketCode}`}
                        target="_blank"
                      />
                    }
                    className="h-8 text-xs font-semibold gap-1.5 text-primary ml-auto"
                  >
                    <ExternalLink className="size-3.5" />
                    {t({ en: "View Ticket Pass", bn: "টিকেট দেখুন" })}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* RECENT SCANS LOG */}
          {recentScans.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <History className="size-3.5 text-primary" />
                <span>{t({ en: "Recent Scans", bn: "সর্বশেষ স্ক্যান" })}</span>
              </div>

              <div className="divide-y divide-border/60 rounded-xl border border-border/70 overflow-hidden bg-background">
                {recentScans.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3.5 py-2 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full shrink-0 bg-emerald-500" />
                      <span className="font-semibold text-foreground truncate">{item.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground truncate hidden sm:inline">
                        {item.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {item.time}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold py-0 h-5 ${
                          item.status === "ATTENDED"
                            ? "bg-teal-600/15 text-teal-700 dark:text-teal-300 border-teal-500/30"
                            : item.status === "CONFIRMED"
                              ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-red-600/15 text-red-700 dark:text-red-300 border-red-500/30"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
