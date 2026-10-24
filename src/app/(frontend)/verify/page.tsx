"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  ExternalLink,
  Flashlight,
  FlashlightOff,
  Loader2,
  QrCode,
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
import { useLanguage } from "@/components/language-provider"

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
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationData | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isVerifyingRef = useRef(false)
  const cooldownCodeRef = useRef<string | null>(null)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef(0)

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
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }

        streamRef.current = stream
        setIsCameraActive(true)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch (playErr) {
            console.warn("Camera auto-play warning:", playErr)
          }
        }

        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter((d) => d.kind === "videoinput")
          setHasMultipleCameras(videoDevices.length > 1)
        } catch {
          // Ignore
        }

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
              bn: "ক্যামেরার অনুমতি দেওয়া হয়নি। ব্রাউজারে অনুমতি দিন।",
            })
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            errorMsg = t({
              en: "No camera found on this device.",
              bn: "এই ডিভাইসে কোনো ক্যামেরা পাওয়া যায়নি।",
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

  // Verify code against API (Read-only check)
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
          setResult(data)
          if (navigator.vibrate) {
            navigator.vibrate(data.isValid ? [60] : [150])
          }
        } else {
          toast.error(t({ en: `Invalid or unrecognized: "${code}"`, bn: `অবৈধ কোড: "${code}"` }))
        }
      } catch {
        toast.error(t({ en: "Network error verifying ticket", bn: "যাচাই করতে সমস্যা হয়েছে" }))
      } finally {
        isVerifyingRef.current = false
        setIsVerifying(false)
      }
    },
    [t]
  )

  // Continuous camera scanning loop
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
        if (now - lastScanTimeRef.current >= 80) {
          lastScanTimeRef.current = now

          if (canvas) {
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputCode.trim()) {
      handleVerify(inputCode.trim())
    }
  }

  const handleReset = () => {
    setResult(null)
    setInputCode("")
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
          <ShieldCheck className="size-3.5" />
          {t({ en: "Official Verification Portal", bn: "অফিসিয়াল ভেরিফিকেশন পোর্টাল" })}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t({ en: "Verify Ticket & Credentials", bn: "টিকেট ও সনদ যাচাই" })}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          {t({
            en: "Check the authenticity and validity of event passes, certificates, and student membership credentials.",
            bn: "ইভেন্ট পাস, সার্টিফিকেট ও সদস্য পদের সত্যতা ও মেয়াদ যাচাই করুন।",
          })}
        </p>
      </div>

      {/* Admin Notice Banner (links to /scanner) */}
      {result?.isAdmin && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <QrCode className="size-4 text-primary shrink-0" />
            <span>
              {t({
                en: "Admin Gatekeeper Mode: Access full attendance scanning and ticket rosters.",
                bn: "অ্যাডমিন মোড: উপস্থিতি স্ক্যান ও সম্পূর্ণ টিকেট তালিকা পরিচালনা করুন।",
              })}
            </span>
          </div>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/scanner" />}
            className="h-7 text-xs font-bold gap-1 shrink-0"
          >
            {t({ en: "Open Scanner", bn: "স্ক্যানারে যান" })}
            <ArrowRight className="size-3" />
          </Button>
        </div>
      )}

      {/* Search Input Bar */}
      <Card className="border border-border shadow-xs bg-card">
        <CardContent className="p-3.5 sm:p-5 space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder={t({
                en: "Enter ticket/credential code or paste verification link...",
                bn: "টিকেট বা সনদ কোড লিখুন অথবা লিংক পেস্ট করুন...",
              })}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="h-11 text-xs sm:text-sm font-mono bg-background"
            />
            <Button
              type="submit"
              disabled={!inputCode.trim() || isVerifying}
              className="h-11 px-5 font-semibold text-xs gap-1.5 shrink-0"
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
          <div className="pt-1">
            {!isCameraActive ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => startCamera()}
                className="w-full h-11 gap-2 text-xs font-semibold border-dashed"
              >
                <Camera className="size-4 text-primary" />
                {t({ en: "Scan QR Code with Camera", bn: "ক্যামেরা দিয়ে কিউআর স্ক্যান করুন" })}
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

              {/* Top Controls Overlay */}
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

              {/* Viewfinder Target */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="relative size-48 sm:size-56 border-2 border-primary/50 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  <div className="absolute top-0 left-0 size-5 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  <div className="absolute top-0 right-0 size-5 border-t-4 border-r-4 border-primary rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 size-5 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 size-5 border-b-4 border-r-4 border-primary rounded-br-md" />
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

          {cameraError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
              {cameraError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* READ-ONLY VERIFICATION RESULT CARD */}
      {result && (
        <Card className="border border-border shadow-md overflow-hidden bg-card">
          <CardContent className="p-5 sm:p-7 space-y-5">
            {/* Validity Banner */}
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
                      ? t({ en: "Verified & Authentic", bn: "যাচাইকৃত ও সত্য" })
                      : t({ en: "Invalid or Not Found", bn: "অবৈধ অথবা পাওয়া যায়নি" })}
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

            {/* Read-only Details Grid */}
            <div className="space-y-3 border-t border-b border-border/60 py-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t({ en: "Title / Credential", bn: "শিরোনাম / সনদ" })}
                </span>
                <span className="font-bold text-sm text-foreground mt-0.5 block">
                  {isBn && result.titleBn ? result.titleBn : result.title}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {t({ en: "Recipient", bn: "অংশগ্রহণকারী" })}
                  </span>
                  <span className="font-semibold text-foreground text-sm block">
                    {result.recipientName}
                  </span>
                  {result.studentId && (
                    <span className="text-muted-foreground text-[11px] block">
                      ID: {result.studentId}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {t({ en: "Reference / Code", bn: "রেফারেন্স কোড" })}
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

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" />
                {t({ en: "Check Another", bn: "আরেকটি যাচাই করুন" })}
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
                  {t({ en: "View Ticket Pass", bn: "টিকেট দেখুন" })}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
