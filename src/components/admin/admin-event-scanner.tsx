"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Flashlight,
  FlashlightOff,
  Keyboard,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react"
import jsQR from "jsqr"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { resolveUserImage } from "@/lib/user-image"
import { departmentLabel, semesterLabel, shiftLabel } from "@/lib/profile-labels"
import { useLanguage } from "@/components/language-provider"

interface EventSummaryData {
  id: string
  title: string
  startDate: string
  venue: string | null
}

interface StatsData {
  total: number
  confirmed: number
  attended: number
  remaining: number
}

interface ScanResultItem {
  id: string
  name: string
  email: string
  phone?: string | null
  studentId?: string | null
  department?: string | null
  semester?: string | null
  shift?: string | null
  ticketCode: string
  status: string
  checkedInAt: string
  avatar?: string | null
  user?: {
    id: string
    name: string
    image: string[]
    selactedImg?: string | null
  } | null
}

// Audio synthesizer using Web Audio API
function playSound(type: "success" | "warning" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === "success") {
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08)
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.18)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.08)
        osc.stop(ctx.currentTime + idx * 0.08 + 0.18)
      })
    } else if (type === "warning") {
      [260, 260].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12)
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + idx * 0.12)
        osc.stop(ctx.currentTime + idx * 0.12 + 0.1)
      })
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(140, ctx.currentTime)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch {
    // Audio context may be restricted before interaction
  }
}

export function AdminEventScanner({
  event,
  initialStats,
}: {
  event: EventSummaryData
  initialStats: StatsData
}) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  const [stats, setStats] = useState<StatsData>(initialStats)
  const [recentAdmissions, setRecentAdmissions] = useState<ScanResultItem[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState("")

  // Active popup notification from the latest scan
  const [scanStatus, setScanStatus] = useState<{
    type: "success" | "warning" | "error" | "pending"
    title: string
    message: string
    attendee?: ScanResultItem
    canForceAdmit?: boolean
  } | null>(null)

  // Start video stream
  const startCamera = useCallback(async () => {
    setCameraError(null)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0]
      const capabilities = (videoTrack?.getCapabilities?.() || {}) as { torch?: boolean }
      setHasTorch(Boolean(capabilities.torch))
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Camera permission denied or camera not found."
      setCameraError(errorMessage)
    }
  }, [cameraFacing])

  // Stop video stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }, [])

  // Toggle torch
  const toggleTorch = async () => {
    if (!streamRef.current) return
    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (videoTrack && hasTorch) {
      try {
        const nextState = !torchEnabled
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextState }],
        })
        setTorchEnabled(nextState)
      } catch {
        // Ignored
      }
    }
  }

  // Handle server ticket validation
  const submitTicketCode = useCallback(
    async (codeToVerify: string, forceConfirm = false) => {
      if (!codeToVerify || isProcessing) return
      setIsProcessing(true)

      try {
        const res = await fetch(`/api/admin/events/${event.id}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketCode: codeToVerify, forceConfirm }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          // Successful check-in
          if (!isMuted) playSound("success")
          if (navigator.vibrate) navigator.vibrate([100])

          if (data.stats) setStats(data.stats)

          const reg = data.registration
          let resolvedAvatar: string | null = null
          if (reg.user?.image) {
            resolvedAvatar = resolveUserImage(reg.user.image, reg.user.selactedImg).avatar
          }

          const attendeeItem: ScanResultItem = {
            id: reg.id,
            name: reg.name,
            email: reg.email,
            phone: reg.phone,
            studentId: reg.studentId,
            department: reg.department,
            semester: reg.semester,
            shift: reg.shift,
            ticketCode: reg.ticketCode,
            status: "ATTENDED",
            checkedInAt: new Date().toLocaleTimeString(),
            avatar: resolvedAvatar,
            user: reg.user,
          }

          setRecentAdmissions((prev) => [
            attendeeItem,
            ...prev.filter((item) => item.ticketCode !== reg.ticketCode),
          ].slice(0, 15))

          setScanStatus({
            type: "success",
            title: t({ en: "Checked In Successfully!", bn: "সফলভাবে প্রবেশ করানো হয়েছে!" }),
            message: `${reg.name} • ${reg.studentId || reg.department || "Attendee"}`,
            attendee: attendeeItem,
          })
        } else if (data.alreadyAttended) {
          // Already attended
          if (!isMuted) playSound("warning")
          if (navigator.vibrate) navigator.vibrate([80, 50, 80])

          const reg = data.registration
          setScanStatus({
            type: "warning",
            title: t({ en: "Already Checked In", bn: "ইতোমধ্যে প্রবেশ করেছেন" }),
            message: `${reg.name} is already marked as attended.`,
            attendee: {
              ...reg,
              checkedInAt: reg.confirmedAt
                ? new Date(reg.confirmedAt).toLocaleTimeString()
                : "Earlier",
            },
          })
        } else if (data.isPending) {
          // Pending payment
          if (!isMuted) playSound("warning")
          const reg = data.registration
          setScanStatus({
            type: "pending",
            title: t({ en: "Pending Payment Verification", bn: "পেমেন্ট যাচাই বাকি আছে" }),
            message: `${reg.name} has not been approved yet (${reg.paymentMethod || "Offline"}).`,
            attendee: reg,
            canForceAdmit: true,
          })
        } else {
          // Error or mismatch
          if (!isMuted) playSound("error")
          if (navigator.vibrate) navigator.vibrate([200])

          setScanStatus({
            type: "error",
            title: t({ en: "Scan Rejected", bn: "টিকেট প্রত্যাখ্যাত" }),
            message: data.message || "Invalid ticket code.",
          })
        }
      } catch {
        if (!isMuted) playSound("error")
        setScanStatus({
          type: "error",
          title: t({ en: "Network Error", bn: "নেটওয়ার্ক ত্রুটি" }),
          message: "Could not connect to server. Please check your internet connection.",
        })
      } finally {
        setTimeout(() => {
          setIsProcessing(false)
        }, 1200)
      }
    },
    [event.id, isMuted, isProcessing, t]
  )

  // Scanner loop: runs continuously on video frames
  useEffect(() => {
    let animId: number
    const BarcodeDetectorClass = (window as any).BarcodeDetector

    const scanFrame = async () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !isProcessing) {
        try {
          if (BarcodeDetectorClass) {
            const detector = new BarcodeDetectorClass({ formats: ["qr_code"] })
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              submitTicketCode(barcodes[0].rawValue)
            }
          } else if (canvas) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              })
              if (code && code.data) {
                submitTicketCode(code.data)
              }
            }
          }
        } catch {
          // Frame grab ignore
        }
      }

      animId = requestAnimationFrame(scanFrame)
    }

    startCamera().then(() => {
      animId = requestAnimationFrame(scanFrame)
    })

    return () => {
      cancelAnimationFrame(animId)
      stopCamera()
    }
  }, [cameraFacing, isProcessing, startCamera, stopCamera, submitTicketCode])

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/events/${event.id}/registrations`} />}
            className="mb-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {t({ en: "Back to Registrations", bn: "নিবন্ধন তালিকায় ফিরুন" })}
          </Button>
          <h1 className="font-heading text-xl font-bold tracking-tight">
            {t({ en: "Live Event Ticket Scanner", bn: "লাইভ ইভেন্ট টিকেট স্ক্যানার" })}
          </h1>
          <p className="text-xs text-muted-foreground">
            {event.title} • {event.venue || "DPI Campus"}
          </p>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-2.5 text-center shadow-xs">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {t({ en: "Total", bn: "মোট" })}
            </span>
            <p className="text-base font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-2.5 text-center shadow-xs border-emerald-500/30 bg-emerald-500/5">
            <span className="text-[10px] font-medium uppercase text-emerald-600 dark:text-emerald-400">
              {t({ en: "Admitted", bn: "প্রবেশকৃত" })}
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {stats.attended}
            </p>
          </Card>
          <Card className="p-2.5 text-center shadow-xs">
            <span className="text-[10px] font-medium uppercase text-blue-600 dark:text-blue-400">
              {t({ en: "Confirmed", bn: "নিশ্চিত" })}
            </span>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              {stats.confirmed}
            </p>
          </Card>
          <Card className="p-2.5 text-center shadow-xs">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {t({ en: "Remaining", bn: "অবশিষ্ট" })}
            </span>
            <p className="text-base font-bold text-muted-foreground">{stats.remaining}</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Camera Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border-2 border-border/80 shadow-md">
            <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Laser Scanner HUD Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                <div className="relative size-60 sm:size-72 border-2 border-primary/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  {/* Four Corner Brackets */}
                  <div className="absolute top-0 left-0 size-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 size-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 size-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 size-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                  {/* Animated Laser Scanline */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-[bounce_2s_infinite]" />
                </div>
              </div>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 shadow-lg">
                    <RefreshCw className="size-4 animate-spin text-primary" />
                    <span className="text-xs font-semibold">
                      {t({ en: "Verifying Ticket...", bn: "যাচাই করা হচ্ছে..." })}
                    </span>
                  </div>
                </div>
              )}

              {/* Camera Error Display */}
              {cameraError && (
                <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <ShieldAlert className="size-10 text-amber-500" />
                  <h3 className="font-semibold text-sm">
                    {t({ en: "Camera Access Error", bn: "ক্যামেরা সংযোগ সমস্যা" })}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm">{cameraError}</p>
                  <Button size="sm" variant="outline" onClick={startCamera} className="gap-1.5">
                    <RefreshCw className="size-3.5" />
                    {t({ en: "Retry Camera", bn: "পুনরায় চেষ্টা করুন" })}
                  </Button>
                </div>
              )}

              {/* Viewport Action Controls Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                {hasTorch && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="size-8 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs border border-white/20"
                    onClick={toggleTorch}
                    title="Toggle Flashlight"
                  >
                    {torchEnabled ? (
                      <Flashlight className="size-4 text-amber-400" />
                    ) : (
                      <FlashlightOff className="size-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="size-8 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs border border-white/20"
                  onClick={() =>
                    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))
                  }
                  title="Switch Camera"
                >
                  <Camera className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="size-8 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs border border-white/20"
                  onClick={() => setIsMuted((prev) => !prev)}
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? (
                    <VolumeX className="size-4 text-red-400" />
                  ) : (
                    <Volume2 className="size-4 text-emerald-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Manual Code Fallback Input */}
            <div className="p-3 bg-muted/40 border-t border-border flex items-center gap-2">
              <Keyboard className="size-4 text-muted-foreground shrink-0 ml-1" />
              <Input
                placeholder="Or enter ticket code manually (e.g. TKT-2026-8941)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualCode.trim()) {
                    submitTicketCode(manualCode.trim())
                    setManualCode("")
                  }
                }}
                className="h-8 text-xs font-mono"
              />
              <Button
                size="sm"
                className="h-8 px-3 text-xs shrink-0"
                disabled={!manualCode.trim() || isProcessing}
                onClick={() => {
                  submitTicketCode(manualCode.trim())
                  setManualCode("")
                }}
              >
                {t({ en: "Verify", bn: "যাচাই" })}
              </Button>
            </div>
          </Card>

          {/* Active Scan Popup Card */}
          {scanStatus && (
            <Card
              className={`border-2 transition-all duration-200 shadow-md ${
                scanStatus.type === "success"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                  : scanStatus.type === "warning"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                    : scanStatus.type === "pending"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-950 dark:text-blue-100"
                      : "border-red-500/50 bg-red-500/10 text-red-950 dark:text-red-100"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                {scanStatus.type === "success" ? (
                  <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : scanStatus.type === "warning" ? (
                  <AlertCircle className="size-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : scanStatus.type === "pending" ? (
                  <Clock className="size-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="size-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{scanStatus.title}</h4>
                    {scanStatus.attendee?.ticketCode && (
                      <span className="font-mono text-[11px] font-semibold opacity-80">
                        {scanStatus.attendee.ticketCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-90">{scanStatus.message}</p>

                  {scanStatus.attendee && (
                    <div className="mt-2 pt-2 border-t border-current/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          {scanStatus.attendee.avatar && (
                            <AvatarImage src={scanStatus.attendee.avatar} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {scanStatus.attendee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{scanStatus.attendee.name}</span>
                        {scanStatus.attendee.studentId && (
                          <span className="opacity-75">({scanStatus.attendee.studentId})</span>
                        )}
                      </div>

                      {scanStatus.canForceAdmit && (
                        <Button
                          size="sm"
                          className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => submitTicketCode(scanStatus.attendee!.ticketCode, true)}
                        >
                          {t({ en: "Confirm & Admit", bn: "নিশ্চিত করে প্রবেশ করান" })}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Admission Stream */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="h-full border-border/80 shadow-xs flex flex-col">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold">
                    {t({ en: "Recent Admissions", bn: "সাম্প্রতিক প্রবেশ তালিকা" })}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t({ en: "Live", bn: "লাইভ" })}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-y-auto max-h-[520px] divide-y divide-border/40">
              {recentAdmissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Users className="size-8 mx-auto opacity-30" />
                  <p className="text-xs">
                    {t({
                      en: "No attendees admitted yet this session. Point the camera at a ticket QR code.",
                      bn: "এখনো কোনো উপস্থিতি রেকর্ড করা হয়নি। টিকেটের কিউআর কোডে ক্যামেরা ধরুন।",
                    })}
                  </p>
                </div>
              ) : (
                recentAdmissions.map((item, index) => (
                  <div
                    key={`${item.ticketCode}-${index}`}
                    className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8 shrink-0">
                        {item.avatar && <AvatarImage src={item.avatar} />}
                        <AvatarFallback className="text-xs font-bold">
                          {item.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.studentId || item.department || item.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] font-semibold">
                        {t({ en: "Attended", bn: "উপস্থিত" })}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.checkedInAt}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
