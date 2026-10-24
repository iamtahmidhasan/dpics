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
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  SwitchCamera,
  XCircle,
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

function playScanBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
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
  const [isVerifying, setIsVerifying] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationData | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastScannedRef = useRef<string | null>(null)

  // Attach stream to video element when mounted or when camera active changes
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
          // Attempt with desired facing mode
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
          en: "Could not access camera. Please allow camera permissions or enter the code manually.",
          bn: "ক্যামেরা চালু করা যায়নি। অনুগ্রহ করে ক্যামেরার অনুমতি দিন অথবা ম্যানুয়ালি কোড লিখুন।",
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

  // Verify code against API
  const handleVerify = useCallback(
    async (rawCode: string) => {
      const trimmed = rawCode.trim()
      if (!trimmed || isVerifying) return

      setIsVerifying(true)
      // Extract clean code if a full URL was pasted/scanned
      const match = trimmed.match(/(?:verify|ticket|tickets|cert|u)\/([A-Za-z0-9_-]+)/i)
      const code = match ? match[1] : trimmed

      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(code)}`)
        const data: VerificationData = await res.json()

        if (res.ok) {
          playScanBeep()
          if (navigator.vibrate) navigator.vibrate([100])
          setResult(data)
          stopCamera()
        } else {
          toast.error(t({ en: "Invalid or unrecognized code", bn: "অবৈধ বা অজানা কোড" }))
        }
      } catch {
        toast.error(t({ en: "Failed to verify code", bn: "যাচাই করতে সমস্যা হয়েছে" }))
      } finally {
        setIsVerifying(false)
      }
    },
    [isVerifying, stopCamera, t]
  )

  // Camera frame scanning loop
  useEffect(() => {
    if (!isCameraActive || result) return

    let animId: number
    let isCancelled = false

    const BarcodeDetectorClass =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              BarcodeDetector?: new (options?: { formats?: string[] }) => {
                detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
              }
            }
          ).BarcodeDetector
        : undefined

    let detector: { detect: (s: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null = null
    if (BarcodeDetectorClass) {
      try {
        detector = new BarcodeDetectorClass({ formats: ["qr_code"] })
      } catch {
        detector = null
      }
    }

    const scan = async () => {
      if (isCancelled) return

      const video = videoRef.current
      const canvas = canvasRef.current

      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        !isVerifying
      ) {
        try {
          if (detector) {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const code = barcodes[0].rawValue
              if (code !== lastScannedRef.current) {
                lastScannedRef.current = code
                handleVerify(code)
                return
              }
            }
          } else if (canvas) {
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const qr = jsQR(imgData.data, imgData.width, imgData.height)
              if (qr && qr.data && qr.data !== lastScannedRef.current) {
                lastScannedRef.current = qr.data
                handleVerify(qr.data)
                return
              }
            }
          }
        } catch {
          // Ignore scanning frame errors
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
  }, [handleVerify, isCameraActive, isVerifying, result])

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Admin action: update status
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

  const handleReset = () => {
    lastScannedRef.current = null
    setResult(null)
    setInputCode("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputCode.trim()) {
      handleVerify(inputCode.trim())
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t({ en: "Verify Ticket & Credentials", bn: "টিকেট ও সনদ যাচাই" })}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t({
            en: "Scan QR code with your camera or enter the ticket code below.",
            bn: "ক্যামেরা দিয়ে কিউআর কোড স্ক্যান করুন অথবা নিচে কোডটি লিখুন।",
          })}
        </p>
      </div>

      {/* Main Container */}
      <Card className="border border-border shadow-md overflow-hidden bg-card">
        <CardContent className="p-5 sm:p-7 space-y-5">
          {/* STATE 1: VERIFIED RESULT */}
          {result ? (
            <div className="space-y-5">
              {/* Status Header */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  result.isValid
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {result.isValid ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-sm block">
                      {result.isValid
                        ? t({ en: "Verified & Valid", bn: "যাচাইকৃত ও বৈধ" })
                        : t({ en: "Invalid or Expired", bn: "অবৈধ অথবা মেয়াদোত্তীর্ণ" })}
                    </span>
                    <span className="text-xs opacity-80">{result.credentialType}</span>
                  </div>
                </div>

                <Badge
                  className={`text-xs font-semibold uppercase ${
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

              {/* Details */}
              <div className="space-y-3 border-t border-b border-border/60 py-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {t({ en: "Title / Event", bn: "ইভেন্ট / শিরোনাম" })}
                  </span>
                  <span className="font-bold text-sm text-foreground mt-0.5 block">
                    {isBn && result.titleBn ? result.titleBn : result.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t({ en: "Attendee Name", bn: "অংশগ্রহণকারী" })}
                    </span>
                    <span className="font-semibold text-foreground text-sm block">
                      {result.recipientName}
                    </span>
                    <span className="text-muted-foreground text-[11px] block">
                      {result.studentId ? `ID: ${result.studentId}` : ""}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t({ en: "Code / Ref", bn: "কোড নম্বর" })}
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm block">
                      {result.code}
                    </span>
                    <span className="text-muted-foreground text-[11px] block truncate">
                      {result.department || result.institution || "DPI"}
                    </span>
                  </div>
                </div>

                {result.metadata?.venue && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t({ en: "Venue", bn: "স্থান" })}
                    </span>
                    <span className="font-medium text-foreground text-xs block">
                      {result.metadata.venue}
                    </span>
                  </div>
                )}
              </div>

              {/* Admin Actions (if admin) */}
              {result.isAdmin && result.metadata?.registrationId && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-primary" />
                      {t({ en: "Admin Quick Actions", bn: "অ্যাডমিন অ্যাকশন" })}
                    </span>

                    {result.status !== EventRegistrationStatus.ATTENDED && (
                      <Button
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus(EventRegistrationStatus.ATTENDED)}
                        className="h-8 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        {t({ en: "Mark Attended", bn: "উপস্থিতি নিশ্চিত" })}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t({ en: "Change Status:", bn: "স্ট্যাটাস পরিবর্তন:" })}
                    </span>
                    <Select
                      value={result.status || undefined}
                      onValueChange={(val) => {
                        if (val) handleUpdateStatus(val as EventRegistrationStatus)
                      }}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold bg-background w-36">
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
                </div>
              )}

              {/* Bottom Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                  <RefreshCw className="size-3.5" />
                  {t({ en: "Verify Another", bn: "আরেকটি যাচাই করুন" })}
                </Button>

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
                    className="gap-1.5 text-xs text-primary"
                  >
                    <ExternalLink className="size-3.5" />
                    {t({ en: "View Ticket", bn: "টিকেট দেখুন" })}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* STATE 2: SEARCH INPUT & CAMERA TOGGLE */
            <div className="space-y-4">
              {/* Form Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  placeholder={t({
                    en: "Enter ticket code (e.g. EVT-8941) or paste URL...",
                    bn: "টিকেট কোড লিখুন (যেমন EVT-8941) বা লিংক পেস্ট করুন...",
                  })}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="h-11 text-sm font-mono bg-background"
                />
                <Button
                  type="submit"
                  disabled={!inputCode.trim() || isVerifying}
                  className="h-11 px-5 font-semibold gap-1.5 shrink-0"
                >
                  {isVerifying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  {t({ en: "Verify", bn: "যাচাই" })}
                </Button>
              </form>

              {/* Camera Button */}
              <div className="text-center pt-1">
                {!isCameraActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startCamera()}
                    className="w-full h-11 gap-2 text-xs font-semibold border-dashed"
                  >
                    <Camera className="size-4 text-primary" />
                    {t({ en: "Scan with Device Camera", bn: "ক্যামেরা দিয়ে স্ক্যান করুন" })}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={stopCamera}
                    className="w-full h-11 gap-2 text-xs font-semibold"
                  >
                    <CameraOff className="size-4" />
                    {t({ en: "Stop Camera", bn: "ক্যামেরা বন্ধ করুন" })}
                  </Button>
                )}
              </div>

              {/* Camera Stream Viewport */}
              {isCameraActive && (
                <div className="relative aspect-4/3 sm:aspect-16/9 w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-border shadow-inner">
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

                  {/* Top-Right Camera Controls Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
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

                  {/* Scanning box guide & Corner Accents */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                    <div className="relative size-48 sm:size-56 border-2 border-primary/50 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 size-5 border-t-4 border-l-4 border-primary rounded-tl-md" />
                      <div className="absolute top-0 right-0 size-5 border-t-4 border-r-4 border-primary rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 size-5 border-b-4 border-l-4 border-primary rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 size-5 border-b-4 border-r-4 border-primary rounded-br-md" />

                      {/* Animated Laser Scan Line */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-[bounce_2s_infinite]" />
                    </div>
                  </div>

                  {isVerifying && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-lg">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          {t({ en: "Verifying...", bn: "যাচাই হচ্ছে..." })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  {cameraError}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
