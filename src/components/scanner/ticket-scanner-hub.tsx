"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flashlight,
  FlashlightOff,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  SwitchCamera,
  Ticket,
  User,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react"
import jsQR from "jsqr"
import { toast } from "sonner"

import { UserDrawer } from "@/components/navigation/user-drawer"
import { useSession } from "@/lib/auth-client"
import { resolveUserImage } from "@/lib/user-image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { EventRegistrationSummary } from "@/lib/services/event.service"
import { cn } from "cn"

interface EventOption {
  id: string
  title: string
  titleBn?: string | null
  startDate: string
  venue: string | null
}

interface VerificationData {
  isValid: boolean
  credentialType: string
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
  metadata?: {
    venue?: string | null
    eventDate?: string | null
    ticketCode?: string | null
    registrationId?: string | null
  }
  isAdmin?: boolean
}

interface TicketScannerHubProps {
  events: EventOption[]
  initialData: {
    registrations: (EventRegistrationSummary & {
      eventStartDate?: string
      eventVenue?: string | null
    })[]
    total: number
    stats: {
      total: number
      confirmed: number
      pending: number
      attended: number
      cancelled: number
    }
  }
}

// Clean helper to extract exact ticket code from URL or raw text
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

// High-speed audio synthesizer using Web Audio API
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
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } else if (type === "warning") {
      osc.type = "triangle"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } else {
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.24)
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function TicketScannerHub({ events, initialData }: TicketScannerHubProps) {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"

  // Dedicated Bottom Nav Active Tab ("scanner", "roster", or "settings")
  const [activeTab, setActiveTab] = useState<"scanner" | "roster" | "settings">("scanner")
  const [drawerOpen, setDrawerOpen] = useState(false)

  const session = useSession()
  const user = session.data?.user
  const initials = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase()
  const avatar = user
    ? resolveUserImage(
        user.image as unknown as string[] | undefined,
        user.selactedImg ?? null
      ).avatar
    : null

  // Event & Directory Filter State
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [manualCode, setManualCode] = useState("")

  // Data List State
  const [registrations, setRegistrations] = useState(initialData.registrations)
  const [stats, setStats] = useState(initialData.stats)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null)

  // Camera & Scanner State
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
  const [flashColor, setFlashColor] = useState<"emerald" | "amber" | "red" | null>(null)
  const [activeResult, setActiveResult] = useState<VerificationData | null>(null)
  const [sessionCount, setSessionCount] = useState({ total: 0, admitted: 0, issues: 0 })

  // Refs for high-speed scanning
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isVerifyingRef = useRef(false)
  const autoAdmitRef = useRef(true)
  const soundEnabledRef = useRef(true)
  const cooldownCodeRef = useRef<string | null>(null)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef(0)
  const registrationsRef = useRef(registrations)

  useEffect(() => {
    registrationsRef.current = registrations
  }, [registrations])

  useEffect(() => {
    autoAdmitRef.current = autoAdmit
  }, [autoAdmit])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  // Attach stream to video element when camera becomes active or video mounts
  useEffect(() => {
    const video = videoRef.current
    if (isCameraActive && video && streamRef.current) {
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current
      }
      video.play().catch((err) => console.warn("Video playback warning:", err))
    }
  }, [isCameraActive])

  // Fetch / Refresh Ticket List
  const fetchTickets = useCallback(
    async (eventId = selectedEventId, status = selectedStatus, q = searchQuery) => {
      setIsLoadingList(true)
      try {
        const params = new URLSearchParams()
        if (eventId && eventId !== "ALL") params.set("eventId", eventId)
        if (status && status !== "ALL") params.set("status", status)
        if (q.trim()) params.set("q", q.trim())
        params.set("page", "1")
        params.set("pageSize", "100")

        const res = await fetch(`/api/admin/tickets?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setRegistrations(data.registrations || [])
          if (data.stats) setStats(data.stats)
        }
      } catch (err) {
        console.error("Failed to load tickets:", err)
        toast.error("Failed to load ticket list")
      } finally {
        setIsLoadingList(false)
      }
    },
    [searchQuery, selectedEventId, selectedStatus]
  )

  // Start device camera
  const startCamera = useCallback(
    async (facing: "environment" | "user" = cameraFacing) => {
      setCameraError(null)

      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          t({
            en: "Camera access requires HTTPS or localhost.",
            bn: "ক্যামেরা ব্যবহারের জন্য HTTPS অথবা localhost প্রয়োজন।",
          })
        )
        return
      }

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
          en: "Could not access camera. Please allow permissions.",
          bn: "ক্যামেরা চালু করা যায়নি। অনুমতি দিন।",
        })

        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            errorMsg = t({
              en: "Camera permission denied.",
              bn: "ক্যামেরার অনুমতি দেওয়া হয়নি।",
            })
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            errorMsg = t({
              en: "No camera device found.",
              bn: "কোনো ক্যামেরা পাওয়া যায়নি।",
            })
          }
        }

        setCameraError(errorMsg)
        setIsCameraActive(false)
      }
    },
    [cameraFacing, t]
  )

  const toggleFacingMode = useCallback(() => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment"
    setCameraFacing(nextFacing)
    startCamera(nextFacing)
  }, [cameraFacing, startCamera])

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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
    setTorchEnabled(false)
  }, [])

  // Update Status of a registration (Used by both scanner and list)
  const updateTicketStatus = useCallback(
    async (registrationId: string, newStatus: EventRegistrationStatus) => {
      setIsUpdatingStatus(true)
      try {
        const res = await fetch(`/api/admin/tickets/${registrationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })

        if (res.ok) {
          toast.success(
            t({
              en: `Ticket updated to ${newStatus}`,
              bn: `টিকেট সফলভাবে ${newStatus} করা হয়েছে`,
            })
          )

          setActiveResult((prev) =>
            prev && prev.metadata?.registrationId === registrationId
              ? {
                  ...prev,
                  status: newStatus,
                  statusLabel: newStatus,
                  isValid:
                    newStatus === EventRegistrationStatus.CONFIRMED ||
                    newStatus === EventRegistrationStatus.ATTENDED,
                }
              : prev
          )

          setRegistrations((prev) =>
            prev.map((item) =>
              item.id === registrationId ? { ...item, status: newStatus } : item
            )
          )

          setStats((prev) => {
            const isToAttended = newStatus === EventRegistrationStatus.ATTENDED
            const isToConfirmed = newStatus === EventRegistrationStatus.CONFIRMED

            return {
              ...prev,
              attended: isToAttended
                ? prev.attended + 1
                : isToConfirmed && prev.attended > 0
                  ? prev.attended - 1
                  : prev.attended,
              confirmed: isToAttended && prev.confirmed > 0
                ? prev.confirmed - 1
                : isToConfirmed
                  ? prev.confirmed + 1
                  : prev.confirmed,
            }
          })

          setHighlightedTicketId(registrationId)
          setTimeout(() => setHighlightedTicketId(null), 3000)
        } else {
          const err = await res.json()
          toast.error(err.message || "Failed to update ticket status")
        }
      } catch {
        toast.error("Network error updating status")
      } finally {
        setIsUpdatingStatus(false)
      }
    },
    [t]
  )

  // Verify and process scanned or typed ticket code
  const handleScanCode = useCallback(
    async (rawCode: string) => {
      const code = extractCodeFromInput(rawCode)
      if (!code || isVerifyingRef.current) return

      isVerifyingRef.current = true
      setIsVerifying(true)

      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(code)}`)
        const data: VerificationData = await res.json()

        if (res.ok) {
          const localMatch = registrationsRef.current.find(
            (r) =>
              r.ticketCode.toLowerCase() === code.toLowerCase() ||
              (data.metadata?.registrationId && r.id === data.metadata.registrationId)
          )
          const isAttended =
            data.status === EventRegistrationStatus.ATTENDED ||
            localMatch?.status === EventRegistrationStatus.ATTENDED
          const isValidPass = data.isValid

          if (!isValidPass) {
            playScanSound("error", soundEnabledRef.current)
            setFlashColor("red")
            setTimeout(() => setFlashColor(null), 600)
            toast.error(
              t({
                en: "Invalid / Unrecognized Pass",
                bn: "অবৈধ বা অনিবন্ধিত প্রবেশ পাস",
              }),
              {
                description: t({
                  en: `Code "${code}" is not a valid ticket credential.`,
                  bn: `"${code}" কোডটি কোনো বৈধ টিকেট নয়।`,
                }),
                duration: 5000,
              }
            )
            setSessionCount((prev) => ({ ...prev, total: prev.total + 1, issues: prev.issues + 1 }))
          } else if (isAttended) {
            data.status = EventRegistrationStatus.ATTENDED
            data.statusLabel = EventRegistrationStatus.ATTENDED

            playScanSound("warning", soundEnabledRef.current)
            setFlashColor("amber")
            setTimeout(() => setFlashColor(null), 800)

            toast.warning(
              t({
                en: "⚠️ Ticket Already Admitted / Attended!",
                bn: "⚠️ টিকেট ইতিমধ্যে উপস্থিত / প্রবেশ করেছে!",
              }),
              {
                description: t({
                  en: `${data.recipientName} (${data.code}) was ALREADY checked in earlier!`,
                  bn: `${data.recipientName}-এর টিকেট (${data.code}) ইতিমধ্যে পূর্বে চেক-ইন করা হয়েছে!`,
                }),
                duration: 6000,
              }
            )
            setSessionCount((prev) => ({ ...prev, total: prev.total + 1 }))
          } else {
            playScanSound("success", soundEnabledRef.current)
            setFlashColor("emerald")
            setTimeout(() => setFlashColor(null), 600)

            // AUTO-ADMIT FEATURE: Automatically update to ATTENDED in database
            if (
              autoAdmitRef.current &&
              data.metadata?.registrationId &&
              data.status === EventRegistrationStatus.CONFIRMED
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
                  data.statusLabel = EventRegistrationStatus.ATTENDED

                  setRegistrations((prev) =>
                    prev.map((item) =>
                      item.id === data.metadata?.registrationId
                        ? { ...item, status: EventRegistrationStatus.ATTENDED }
                        : item
                    )
                  )

                  setHighlightedTicketId(data.metadata.registrationId)
                  setTimeout(() => setHighlightedTicketId(null), 4000)

                  toast.success(
                    t({
                      en: `Admitted: ${data.recipientName} checked in!`,
                      bn: `${data.recipientName} উপস্থিতি নিশ্চিত করা হয়েছে!`,
                    })
                  )
                }
              } catch {
                // Ignore auto-admit background network warning
              }
            }

            setSessionCount((prev) => ({
              total: prev.total + 1,
              admitted: prev.admitted + 1,
              issues: prev.issues,
            }))
          }

          setActiveResult(data)

          if (navigator.vibrate) {
            navigator.vibrate(isValidPass ? [60, 40, 60] : [180])
          }
        } else {
          playScanSound("error", soundEnabledRef.current)
          setFlashColor("red")
          setTimeout(() => setFlashColor(null), 600)
          toast.error(t({ en: `Unrecognized code: "${code}"`, bn: `অবৈধ কোড: "${code}"` }))
          setSessionCount((prev) => ({ ...prev, total: prev.total + 1, issues: prev.issues + 1 }))
        }
      } catch {
        playScanSound("error", soundEnabledRef.current)
        toast.error("Network error while scanning code")
      } finally {
        isVerifyingRef.current = false
        setIsVerifying(false)
      }
    },
    [t]
  )

  // Continuous Camera Scanning Engine
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

                  handleScanCode(code)
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
  }, [handleScanCode, isCameraActive])

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [stopCamera])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t({ en: "Ticket code copied!", bn: "টিকেট কোড কপি করা হয়েছে!" }))
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      handleScanCode(manualCode.trim())
      setManualCode("")
    }
  }

  // Filter out any pending, cancelled, or rejected registrations
  const eligibleRegistrations = registrations.filter(
    (item) =>
      item.status === EventRegistrationStatus.CONFIRMED ||
      item.status === EventRegistrationStatus.ATTENDED
  )

  const displayedRegistrations = eligibleRegistrations.filter((item) => {
    if (selectedStatus === EventRegistrationStatus.CONFIRMED) {
      return item.status === EventRegistrationStatus.CONFIRMED
    }
    if (selectedStatus === EventRegistrationStatus.ATTENDED) {
      return item.status === EventRegistrationStatus.ATTENDED
    }
    return true
  })

  return (
    <div className="flex-1 flex flex-col p-2.5 sm:p-4 max-w-4xl mx-auto w-full space-y-3 pb-24">
      {/* ========================================================= */}
      {/* VIEW 1: LIVE CAMERA SCANNER                               */}
      {/* ========================================================= */}
      {activeTab === "scanner" && (
        <div className="space-y-3">
          {/* Subtle Event Scope Indicator if filtered */}
          {selectedEventId !== "ALL" && (
            <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground">
              <span className="truncate">
                {t({ en: "Event Scope:", bn: "ইভেন্ট:" })}{" "}
                <strong className="text-foreground">
                  {events.find((e) => e.id === selectedEventId)?.title || selectedEventId}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="text-primary hover:underline font-semibold text-[11px] shrink-0 ml-2"
              >
                {t({ en: "Change", bn: "পরিবর্তন" })}
              </button>
            </div>
          )}

          {/* Minimal Manual Input Bar */}
          <Card className="border border-border/70 rounded-lg bg-card shadow-none">
            <CardContent className="p-2 sm:p-2.5">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  placeholder={t({
                    en: "Enter code or paste verification link (e.g. EVT-ABCD)...",
                    bn: "কোড লিখুন বা লিংক পেস্ট করুন (যেমন EVT-ABCD)...",
                  })}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="h-8 text-xs font-mono bg-background"
                />
                <Button
                  type="submit"
                  disabled={!manualCode.trim() || isVerifying}
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold gap-1 shrink-0"
                >
                  {isVerifying ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                  <span>{t({ en: "Scan", bn: "স্ক্যান" })}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Minimal Camera Viewport Card */}
          <Card className="border border-border/70 rounded-lg bg-card shadow-none overflow-hidden">
            <CardContent className="p-2.5 sm:p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">
                    {t({ en: "Camera Scanner", bn: "ক্যামেরা স্ক্যানার" })}
                  </span>
                </div>

                {!isCameraActive ? (
                  <Button
                    type="button"
                    onClick={() => startCamera()}
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold gap-1"
                  >
                    <Camera className="size-3.5" />
                    <span>{t({ en: "Start Camera", bn: "ক্যামেরা চালু" })}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold gap-1 text-destructive hover:text-destructive"
                  >
                    <CameraOff className="size-3.5" />
                    <span>{t({ en: "Stop", bn: "বন্ধ" })}</span>
                  </Button>
                )}
              </div>

              {/* Viewport Box */}
              {isCameraActive ? (
                <div className="relative aspect-16/9 max-h-[300px] w-full rounded-md bg-black overflow-hidden flex items-center justify-center border">
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
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                    {hasTorch && (
                      <Button
                        type="button"
                        size="icon"
                        variant={torchEnabled ? "default" : "secondary"}
                        onClick={toggleTorch}
                        className="size-7 rounded-md shadow-xs backdrop-blur-xs"
                        title={torchEnabled ? "Turn off torch" : "Turn on torch"}
                      >
                        {torchEnabled ? <Flashlight className="size-3.5 text-amber-400" /> : <FlashlightOff className="size-3.5" />}
                      </Button>
                    )}

                    {hasMultipleCameras && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={toggleFacingMode}
                        className="size-7 rounded-md shadow-xs backdrop-blur-xs"
                        title={t({ en: "Switch Camera", bn: "ক্যামেরা পরিবর্তন" })}
                      >
                        <SwitchCamera className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Viewfinder Target & Corner Brackets */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                    <div
                      className={`relative size-40 sm:size-48 border rounded-lg overflow-hidden transition-all duration-200 ${
                        flashColor === "emerald"
                          ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                          : flashColor === "amber"
                            ? "border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.7)]"
                            : flashColor === "red"
                              ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)]"
                              : "border-primary/60"
                      }`}
                    >
                      <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-primary" />
                      <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-primary" />
                      <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-primary" />
                      <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-primary" />
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-[bounce_1.8s_infinite]" />
                    </div>
                  </div>

                  {/* Verifying Indicator */}
                  {isVerifying && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-30">
                      <div className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 shadow-md border text-xs font-semibold">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        <span>{t({ en: "Verifying...", bn: "যাচাই হচ্ছে..." })}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center space-y-2 bg-muted/20">
                  <Camera className="size-6 text-muted-foreground mx-auto" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground text-xs">
                      {t({ en: "Camera is on Standby", bn: "ক্যামেরা প্রস্তুত রয়েছে" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t({
                        en: "Click Start Camera to begin scanning attendees.",
                        bn: "স্ক্যান শুরু করতে ক্যামেরা চালু করুন।",
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => startCamera()}
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold"
                  >
                    <Camera className="size-3 mr-1" />
                    <span>{t({ en: "Start Camera", bn: "ক্যামেরা চালু" })}</span>
                  </Button>
                </div>
              )}

              {cameraError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
                  {cameraError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ACTIVE SCANNED ATTENDEE CARD (MINIMAL, NO DEPARTMENT, 1-CHECK TOGGLE) */}
          {activeResult && (
            <Card
              className={cn(
                "border rounded-lg shadow-none transition-all",
                activeResult.status === EventRegistrationStatus.ATTENDED
                  ? "border-teal-500/40 bg-teal-500/[0.03]"
                  : activeResult.isValid
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : "border-red-500/40 bg-red-500/[0.03]"
              )}
            >
              <CardContent className="p-2.5 sm:p-3 space-y-2.5">
                {/* Status & Code Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activeResult.isValid ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <span className="font-bold text-xs text-foreground truncate">
                      {activeResult.status === EventRegistrationStatus.ATTENDED
                        ? t({ en: "Attended", bn: "উপস্থিত" })
                        : activeResult.isValid
                          ? t({ en: "Confirmed Ticket", bn: "নিশ্চিত টিকেট" })
                          : t({ en: "Invalid Pass", bn: "অবৈধ টিকেট" })}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({activeResult.code})
                    </span>
                  </div>

                  <Badge
                    variant={
                      activeResult.status === EventRegistrationStatus.ATTENDED
                        ? "default"
                        : activeResult.isValid
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-[10px] font-semibold py-0 h-4 px-1.5"
                  >
                    {activeResult.status || activeResult.statusLabel}
                  </Badge>
                </div>

                {/* Attendee Details (NO DEPARTMENT) */}
                <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-8 rounded-md shrink-0 border border-border/80">
                      {activeResult.recipientAvatar && (
                        <AvatarImage
                          src={activeResult.recipientAvatar}
                          alt={activeResult.recipientName}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                        {activeResult.recipientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs truncate">
                        {activeResult.recipientName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        {activeResult.studentId && (
                          <span>ID: {activeResult.studentId}</span>
                        )}
                        {activeResult.studentId && <span>•</span>}
                        <span className="truncate">
                          {isBn && activeResult.titleBn ? activeResult.titleBn : activeResult.title}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Single Check Button to Toggle Attend <-> Confirmed */}
                  {activeResult.metadata?.registrationId && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          activeResult.status === EventRegistrationStatus.ATTENDED
                            ? "default"
                            : "outline"
                        }
                        disabled={isUpdatingStatus}
                        onClick={() =>
                          updateTicketStatus(
                            activeResult.metadata!.registrationId!,
                            activeResult.status === EventRegistrationStatus.ATTENDED
                              ? EventRegistrationStatus.CONFIRMED
                              : EventRegistrationStatus.ATTENDED
                          )
                        }
                        className={cn(
                          "h-7 px-2.5 text-xs font-semibold gap-1 transition-all",
                          activeResult.status === EventRegistrationStatus.ATTENDED
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                            : "border-border hover:bg-accent"
                        )}
                        title={
                          activeResult.status === EventRegistrationStatus.ATTENDED
                            ? "Attended! Click to revert to Confirmed"
                            : "Click to mark as Attended"
                        }
                      >
                        <Check
                          className={cn(
                            "size-3.5",
                            activeResult.status === EventRegistrationStatus.ATTENDED
                              ? "stroke-[2.5]"
                              : "text-muted-foreground"
                          )}
                        />
                        <span className="text-[11px]">
                          {activeResult.status === EventRegistrationStatus.ATTENDED
                            ? t({ en: "Attended", bn: "উপস্থিত" })
                            : t({ en: "Admit", bn: "উপস্থিত করুন" })}
                        </span>
                      </Button>

                      {activeResult.metadata?.ticketCode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/events/ticket/${activeResult.metadata.ticketCode}`}
                              target="_blank"
                            />
                          }
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="View Pass"
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: TICKET ROSTER (MINIMAL CARDS LIST)                */}
      {/* ========================================================= */}
      {activeTab === "roster" && (
        <div className="space-y-2.5">
          {/* Subtle Event Scope Indicator if filtered */}
          {selectedEventId !== "ALL" && (
            <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground">
              <span className="truncate">
                {t({ en: "Event Scope:", bn: "ইভেন্ট:" })}{" "}
                <strong className="text-foreground">
                  {events.find((e) => e.id === selectedEventId)?.title || selectedEventId}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="text-primary hover:underline font-semibold text-[11px] shrink-0 ml-2"
              >
                {t({ en: "Change", bn: "পরিবর্তন" })}
              </button>
            </div>
          )}

          {/* Roster Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Ticket className="size-4 text-primary" />
              <h3 className="font-bold text-xs sm:text-sm text-foreground">
                {t({ en: "Attendee Ticket Roster", bn: "টিকেট তালিকা" })}
              </h3>
              <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                {displayedRegistrations.length}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets()}
              disabled={isLoadingList}
              className="h-7 px-2 text-xs gap-1"
            >
              <RefreshCw className={`size-3 ${isLoadingList ? "animate-spin" : ""}`} />
              <span>{t({ en: "Sync", bn: "রিফ্রেশ" })}</span>
            </Button>
          </div>

          {/* Filter Pills (ONLY ALL, CONFIRMED, ATTENDED - NO PENDING, NO CANCELLED) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
            {[
              {
                key: "ALL",
                label: t({ en: "All", bn: "সকল" }),
                count: (stats.confirmed || 0) + (stats.attended || 0),
              },
              {
                key: EventRegistrationStatus.CONFIRMED,
                label: t({ en: "Confirmed", bn: "নিশ্চিত" }),
                count: stats.confirmed || 0,
              },
              {
                key: EventRegistrationStatus.ATTENDED,
                label: t({ en: "Attended", bn: "উপস্থিত" }),
                count: stats.attended || 0,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.key)
                  fetchTickets(selectedEventId, tab.key, searchQuery)
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  selectedStatus === tab.key
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder={t({
                en: "Search by attendee name, student ID, or ticket code...",
                bn: "নাম, আইডি, বা কোড দিয়ে অনুসন্ধান...",
              })}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                fetchTickets(selectedEventId, selectedStatus, e.target.value)
              }}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* Minimal Cards List */}
          <div className="space-y-1.5 sm:space-y-2">
            {isLoadingList ? (
              <div className="p-8 text-center text-xs text-muted-foreground border rounded-lg bg-card">
                <Loader2 className="size-4 animate-spin mx-auto mb-1 text-primary" />
                <span>Loading tickets...</span>
              </div>
            ) : displayedRegistrations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border rounded-lg bg-card">
                {t({ en: "No tickets found.", bn: "কোনো টিকেট পাওয়া যায়নি।" })}
              </div>
            ) : (
              displayedRegistrations.map((ticket) => {
                const isAttended = ticket.status === EventRegistrationStatus.ATTENDED
                const isHighlighted = highlightedTicketId === ticket.id

                return (
                  <Card
                    key={ticket.id}
                    className={cn(
                      "border rounded-lg bg-card transition-all shadow-none py-0",
                      isHighlighted && "ring-2 ring-emerald-500 bg-emerald-500/5",
                      isAttended
                        ? "border-teal-500/30 bg-teal-500/[0.02]"
                        : "border-border/60 hover:border-border"
                    )}
                  >
                    <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-2.5">
                      {/* Left: Attendee Avatar & Info (NO DEPARTMENT) */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-8 rounded-md shrink-0 border border-border/80">
                          {ticket.userAvatar && (
                            <AvatarImage
                              src={ticket.userAvatar}
                              alt={ticket.name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback
                            className={cn(
                              "rounded-md text-[10px] font-bold",
                              isAttended
                                ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {ticket.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground truncate text-xs">
                              {ticket.name}
                            </p>
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-1.5 py-0.2 rounded-full inline-flex items-center",
                                isAttended
                                  ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {isAttended ? "Attended" : "Confirmed"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono font-medium text-foreground/80">
                              {ticket.ticketCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ticket.ticketCode)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Copy code"
                            >
                              <Copy className="size-2.5" />
                            </button>

                            {ticket.studentId && (
                              <>
                                <span>•</span>
                                <span>ID: {ticket.studentId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Single Check Button to Toggle Attend <-> Confirmed + View Pass */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant={isAttended ? "default" : "outline"}
                          disabled={isUpdatingStatus}
                          onClick={() =>
                            updateTicketStatus(
                              ticket.id,
                              isAttended
                                ? EventRegistrationStatus.CONFIRMED
                                : EventRegistrationStatus.ATTENDED
                            )
                          }
                          className={cn(
                            "h-7 px-2.5 text-xs font-semibold gap-1 transition-all",
                            isAttended
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                              : "border-border hover:bg-accent hover:text-accent-foreground"
                          )}
                          title={
                            isAttended
                              ? "Attended! Click to revert to Confirmed"
                              : "Click to mark as Attended"
                          }
                        >
                          <Check
                            className={cn(
                              "size-3.5",
                              isAttended ? "stroke-[2.5]" : "text-muted-foreground"
                            )}
                          />
                          <span className="text-[11px]">
                            {isAttended
                              ? t({ en: "Attended", bn: "উপস্থিত" })
                              : t({ en: "Admit", bn: "উপস্থিত করুন" })}
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/events/ticket/${ticket.ticketCode}`}
                              target="_blank"
                            />
                          }
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="View Pass"
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: SETTINGS TAB (MOVED FROM TOP CONTROL BAR)         */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {t({ en: "Scanner Settings", bn: "স্ক্যানার সেটিংস" })}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t({
                  en: "Configure active event scope, scanner automation, and station counters.",
                  bn: "ইভেন্ট নির্বাচন, স্ক্যানার আচরণ এবং সেশন কাউন্টার পরিবর্তন করুন।",
                })}
              </p>
            </div>
          </div>

          {/* 1. Event Scope Card */}
          <Card className="border border-border/70 rounded-lg bg-card shadow-none">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {t({ en: "Active Event Scope", bn: "বর্তমান ইভেন্ট" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t({
                        en: "Filter roster and ticket lookup to a specific event",
                        bn: "নির্দিষ্ট ইভেন্টের জন্য টিকেট ফিল্টার করুন",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Select
                value={selectedEventId}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedEventId(val)
                    fetchTickets(val, selectedStatus, searchQuery)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background w-full">
                  <SelectValue placeholder={t({ en: "All Events", bn: "সকল ইভেন্ট" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t({ en: "All Events", bn: "সকল ইভেন্ট" })}
                  </SelectItem>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {isBn && evt.titleBn ? evt.titleBn : evt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 2. Scanner Behavior Card (Auto-Admit & Sound) */}
          <Card className="border border-border/70 rounded-lg bg-card shadow-none">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs font-semibold text-foreground">
                {t({ en: "Scanner Automation & Audio", bn: "অটোমেশন ও অডিও" })}
              </p>

              {/* Auto-Admit Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                <div className="flex items-start gap-2">
                  <Zap className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {t({ en: "Auto-Admit on Scan", bn: "স্ক্যানে অটো চেক-ইন" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t({
                        en: "Automatically mark confirmed tickets as Attended when scanned",
                        bn: "স্ক্যান করার সাথে সাথে নিশ্চিত টিকেটকে উপস্থিত হিসেবে চিহ্নিত করে",
                      })}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={autoAdmit ? "default" : "outline"}
                  onClick={() => {
                    setAutoAdmit(!autoAdmit)
                    toast.info(
                      !autoAdmit
                        ? t({ en: "Auto-Admit Activated", bn: "অটো চেক-ইন চালু" })
                        : t({ en: "Auto-Admit Disabled", bn: "অটো চেক-ইন বন্ধ" })
                    )
                  }}
                  className="h-7 px-2.5 text-xs font-semibold shrink-0"
                >
                  {autoAdmit ? t({ en: "Enabled", bn: "চালু" }) : t({ en: "Disabled", bn: "বন্ধ" })}
                </Button>
              </div>

              {/* Sound Audio Chimes Row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <div className="flex items-start gap-2">
                  {soundEnabled ? (
                    <Volume2 className="size-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <VolumeX className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {t({ en: "Sound Chimes", bn: "শব্দ সংকেত" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t({
                        en: "Play audio feedback on valid, duplicate, or invalid scans",
                        bn: "স্ক্যানের ফলাফল অনুযায়ী অডিও সংকেত বাজান",
                      })}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={soundEnabled ? "default" : "outline"}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-7 px-2.5 text-xs font-semibold shrink-0"
                >
                  {soundEnabled ? t({ en: "On", bn: "চালু" }) : t({ en: "Muted", bn: "নীরব" })}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Session Statistics & Reset */}
          <Card className="border border-border/70 rounded-lg bg-card shadow-none">
            <CardContent className="p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {t({ en: "Session Scans Counter", bn: "সেশন স্ক্যান কাউন্টার" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t({
                      en: "Live tally for this active scanning station",
                      bn: "বর্তমান সেশনের স্ক্যান ও উপস্থিতি সংখ্যা",
                    })}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSessionCount({ total: 0, admitted: 0, issues: 0 })
                    toast.success(t({ en: "Session counter reset!", bn: "কাউন্টার রিসেট হয়েছে!" }))
                  }}
                  className="h-6 px-2 text-[10px] font-semibold gap-1"
                >
                  <RotateCcw className="size-2.5" />
                  <span>{t({ en: "Reset", bn: "রিসেট" })}</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-md border border-border/60 p-2 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {t({ en: "Admitted", bn: "উপস্থিত" })}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {sessionCount.admitted}
                  </span>
                </div>
                <div className="rounded-md border border-border/60 p-2 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {t({ en: "Total Scans", bn: "মোট স্ক্যান" })}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {sessionCount.total}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCANNER PAGE DEDICATED BOTTOM NAVIGATION                  */}
      {/* ========================================================= */}
      <nav
        aria-label="Scanner Navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/90 backdrop-blur-xl shadow-lg transform-gpu"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {/* 1. Live Scanner Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("scanner")}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors",
              activeTab === "scanner"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Camera className={cn("size-5 transition-transform", activeTab === "scanner" && "scale-110")} />
              {activeTab === "scanner" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="mt-1 text-[10px] leading-none tracking-tight">
              {t({ en: "Scanner", bn: "স্ক্যানার" })}
            </span>
          </button>

          {/* 2. Ticket Roster Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors",
              activeTab === "roster"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Ticket className={cn("size-5 transition-transform", activeTab === "roster" && "scale-110")} />
              {eligibleRegistrations.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs">
                  {eligibleRegistrations.length > 99 ? "99+" : eligibleRegistrations.length}
                </span>
              )}
              {activeTab === "roster" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="mt-1 text-[10px] leading-none tracking-tight">
              {t({ en: "Roster", bn: "টিকেট তালিকা" })}
            </span>
          </button>

          {/* 3. Settings Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors",
              activeTab === "settings"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Settings className={cn("size-5 transition-transform", activeTab === "settings" && "scale-110")} />
              {activeTab === "settings" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="mt-1 text-[10px] leading-none tracking-tight">
              {t({ en: "Settings", bn: "সেটিংস" })}
            </span>
          </button>

          {/* 4. Account Button (Opens UserDrawer exactly like frontend) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t({ en: "Account & Shortcuts", bn: "অ্যাকাউন্ট ও মেনু" })}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors text-muted-foreground hover:text-foreground",
              drawerOpen && "text-primary font-semibold"
            )}
          >
            {user ? (
              <div className="relative">
                <div
                  className={cn(
                    "size-6 rounded-full overflow-hidden border border-border transition-all",
                    drawerOpen
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : "ring-1 ring-border"
                  )}
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={user.name || user.email || ""}
                      width={24}
                      height={24}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-primary text-[10px] font-bold text-primary-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                {drawerOpen && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                )}
              </div>
            ) : (
              <div className="relative">
                <User
                  className={cn(
                    "size-5 transition-transform",
                    drawerOpen && "scale-110 text-primary"
                  )}
                />
                {drawerOpen && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                )}
              </div>
            )}

            <span className="mt-1 text-[10px] leading-none tracking-tight">
              {t({ en: "Account", bn: "অ্যাকাউন্ট" })}
            </span>
          </button>
        </div>
      </nav>

      {/* User Drawer Component */}
      <UserDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}
