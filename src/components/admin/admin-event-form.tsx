"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Calendar,
  Check,
  ExternalLink,
  Globe,
  ImageIcon,
  ImageOff,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaPickerModal } from "@/components/media/media-picker-modal"
import { MarkdownEditor } from "@/components/posts/markdown-editor"
import { EventStatus, EventType } from "@/generated/prisma/enums"
import { toEventSlug } from "@/lib/event-slug"
import type { EventDetail, GuestSpeaker } from "@/lib/services/event.service"
import { cn } from "cn"

type CategoryOption = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

type UserSpeakerOption = {
  id: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
  role: string
  company: string
  studentId: string | null
  instructorId: string | null
}

export function AdminEventForm({
  initialEvent,
  categories = [],
}: {
  initialEvent?: EventDetail
  categories: CategoryOption[]
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const isEdit = Boolean(initialEvent)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = useState(initialEvent?.title ?? "")
  const [titleBn, setTitleBn] = useState(initialEvent?.titleBn ?? "")
  const [slug, setSlug] = useState(initialEvent?.slug ?? "")
  const [excerpt, setExcerpt] = useState(initialEvent?.excerpt ?? "")
  const [excerptBn, setExcerptBn] = useState(initialEvent?.excerptBn ?? "")
  const [content, setContent] = useState(initialEvent?.content ?? "")
  const [contentBn, setContentBn] = useState(initialEvent?.contentBn ?? "")
  const [contentTab, setContentTab] = useState<"en" | "bn">("en")

  // Cover Image & Media Modal
  const [coverImage, setCoverImage] = useState(initialEvent?.coverImage ?? "")
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const [eventType, setEventType] = useState<EventType>(
    initialEvent?.eventType ?? EventType.IN_PERSON
  )
  const [status, setStatus] = useState<EventStatus>(
    initialEvent?.status ?? EventStatus.UPCOMING
  )

  // Dates
  const toLocalInput = (dateStr?: string | null) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`
  }

  const [startDate, setStartDate] = useState(
    initialEvent ? toLocalInput(initialEvent.startDate) : ""
  )
  const [endDate, setEndDate] = useState(
    initialEvent?.endDate ? toLocalInput(initialEvent.endDate) : ""
  )
  const [registrationDeadline, setRegistrationDeadline] = useState(
    initialEvent?.registrationDeadline
      ? toLocalInput(initialEvent.registrationDeadline)
      : ""
  )

  const [venue, setVenue] = useState(initialEvent?.venue ?? "")
  const [venueBn, setVenueBn] = useState(initialEvent?.venueBn ?? "")
  const [locationMapUrl, setLocationMapUrl] = useState(
    initialEvent?.locationMapUrl ?? ""
  )
  const [onlineJoinUrl, setOnlineJoinUrl] = useState(
    initialEvent?.onlineJoinUrl ?? ""
  )

  const [categoryId, setCategoryId] = useState(initialEvent?.categoryId ?? "")
  const [tagsInput, setTagsInput] = useState(initialEvent?.tags.join(", ") ?? "")

  const [isFeatured, setIsFeatured] = useState(initialEvent?.isFeatured ?? false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(
    initialEvent?.isRegistrationOpen ?? true
  )
  const [isFree, setIsFree] = useState(initialEvent?.isFree ?? true)
  const [registrationFee, setRegistrationFee] = useState(
    String(initialEvent?.registrationFee ?? 0)
  )
  const [maxParticipants, setMaxParticipants] = useState(
    initialEvent?.maxParticipants ? String(initialEvent.maxParticipants) : ""
  )

  // Speakers
  const [guestSpeakers, setGuestSpeakers] = useState<GuestSpeaker[]>(
    initialEvent?.guestSpeakers ?? []
  )

  // User Import Modal State
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userOptions, setUserOptions] = useState<UserSpeakerOption[]>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEdit && !slug) {
      setSlug(toEventSlug(val))
    }
  }

  const addSpeaker = () => {
    setGuestSpeakers([
      ...guestSpeakers,
      {
        name: "",
        nameBn: "",
        role: "",
        roleBn: "",
        company: "",
        avatar: "",
        bio: "",
      },
    ])
  }

  const updateSpeaker = (index: number, field: keyof GuestSpeaker, value: string) => {
    const updated = [...guestSpeakers]
    updated[index] = { ...updated[index], [field]: value }
    setGuestSpeakers(updated)
  }

  const removeSpeaker = (index: number) => {
    setGuestSpeakers(guestSpeakers.filter((_, i) => i !== index))
  }

  // Search users for import
  const fetchUserOptions = async (query = "") => {
    setUserSearchLoading(true)
    try {
      const res = await fetch(
        `/api/admin/events/speaker-options?q=${encodeURIComponent(query)}`
      )
      if (res.ok) {
        const json = await res.json()
        setUserOptions(json.users || [])
      }
    } finally {
      setUserSearchLoading(false)
    }
  }

  useEffect(() => {
    if (userModalOpen) {
      fetchUserOptions(userSearchQuery)
    }
  }, [userModalOpen])

  const handleSearchUser = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUserOptions(userSearchQuery)
  }

  const importUserAsSpeaker = (user: UserSpeakerOption) => {
    setGuestSpeakers([
      ...guestSpeakers,
      {
        name: user.name,
        nameBn: "",
        role: user.role || "Speaker",
        roleBn: "",
        company: user.company || "",
        avatar: user.avatar || "",
        bio: user.bio || "",
      },
    ])
    setUserModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        title,
        titleBn: titleBn || null,
        slug: slug || toEventSlug(title),
        excerpt: excerpt || null,
        excerptBn: excerptBn || null,
        content,
        contentBn: contentBn || null,
        coverImage: coverImage || null,
        eventType,
        status,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
        venue: venue || null,
        venueBn: venueBn || null,
        locationMapUrl: locationMapUrl || null,
        onlineJoinUrl: onlineJoinUrl || null,
        categoryId: categoryId || null,
        tags,
        isFeatured,
        isRegistrationOpen,
        isFree,
        registrationFee: isFree ? 0 : Number(registrationFee) || 0,
        maxParticipants: maxParticipants ? Number(maxParticipants) || null : null,
        guestSpeakers: guestSpeakers.filter((s) => s.name.trim().length > 0),
      }

      const url = isEdit
        ? `/api/admin/events/${initialEvent!.id}`
        : `/api/admin/events`

      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to save event")
      }

      router.push("/admin/events")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/events" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t({ en: "Back to Events List", bn: "ইভেন্ট তালিকায় ফিরুন" })}
        </Button>

        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isEdit
            ? t({ en: "Update Event", bn: "ইভেন্ট আপডেট করুন" })
            : t({ en: "Publish / Create Event", bn: "ইভেন্ট তৈরি করুন" })}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t({ en: "Basic Information", bn: "সাধারণ তথ্য" })}
        </h2>

        {/* Cover Image with Media Model Picker */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            {t({ en: "Cover Banner Image", bn: "কভার ব্যানার ইমেজ" })}
          </Label>

          {coverImage ? (
            <div className="group relative aspect-[16/9] w-full max-w-xl overflow-hidden rounded-xl border border-border bg-muted shadow-xs">
              <Image
                src={coverImage}
                alt={title || "Cover banner"}
                fill
                className="object-cover"
              />
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMediaPickerOpen(true)}
                  className="h-7 text-xs bg-background/90 backdrop-blur-xs"
                >
                  <ImageIcon className="size-3.5 mr-1" />
                  {t({ en: "Change", bn: "পরিবর্তন" })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setCoverImage("")}
                  className="h-7 text-xs"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  {t({ en: "Remove", bn: "মুছুন" })}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center max-w-xl">
              <ImageIcon className="size-10 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground mb-3">
                {t({
                  en: "Select from media library or upload a high-resolution banner image.",
                  bn: "মিডিয়া লাইব্রেরি থেকে নির্বাচন করুন অথবা নতুন ব্যানার আপলোড করুন।",
                })}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMediaPickerOpen(true)}
                className="gap-1.5 text-xs"
              >
                <ImageIcon className="size-3.5" />
                {t({ en: "Open Media Library", bn: "মিডিয়া লাইব্রেরি খুলুন" })}
              </Button>
            </div>
          )}

          {/* Media Picker Modal */}
          <MediaPickerModal
            open={mediaPickerOpen}
            onOpenChange={setMediaPickerOpen}
            onSelect={(url) => {
              setCoverImage(url)
              setMediaPickerOpen(false)
            }}
            title={t({ en: "Select Event Cover Banner", bn: "ইভেন্ট কভার ব্যানার নির্বাচন করুন" })}
            defaultFolder="general"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">
              {t({ en: "Event Title (English) *", bn: "ইভেন্ট শিরোনাম (ইংরেজি) *" })}
            </Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Intro to Competitive Programming"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="titleBn" className="text-xs font-semibold">
              {t({ en: "Event Title (Bangla)", bn: "ইভেন্ট শিরোনাম (বাংলা)" })}
            </Label>
            <Input
              id="titleBn"
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: কম্পিটিটিভ প্রোগ্রামিং পরিচিতি"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug" className="text-xs font-semibold">
            {t({ en: "URL Slug *", bn: "ইউআরএল স্লাগ *" })}
          </Label>
          <Input
            id="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. intro-to-competitive-programming"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="excerpt" className="text-xs font-semibold">
              {t({ en: "Short Excerpt (English)", bn: "সংক্ষিপ্ত বিবরণ (ইংরেজি)" })}
            </Label>
            <Textarea
              id="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 1-2 sentence overview..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="excerptBn" className="text-xs font-semibold">
              {t({ en: "Short Excerpt (Bangla)", bn: "সংক্ষিপ্ত বিবরণ (বাংলা)" })}
            </Label>
            <Textarea
              id="excerptBn"
              rows={2}
              value={excerptBn}
              onChange={(e) => setExcerptBn(e.target.value)}
              placeholder="সংক্ষিপ্ত সারসংক্ষেপ..."
            />
          </div>
        </div>

        {/* Bilingual Markdown Content Editor with Tabs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Globe className="text-primary size-4" />
              <Label className="text-xs font-semibold">
                {t({ en: "Event Description & Agenda", bn: "ইভেন্ট বিবরণ ও এজেন্ডা" })}
              </Label>
            </div>

            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setContentTab("en")}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  contentTab === "en"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                English {content ? "✓" : ""}
              </button>
              <button
                type="button"
                onClick={() => setContentTab("bn")}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  contentTab === "bn"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                বাংলা {contentBn ? "✓" : ""}
              </button>
            </div>
          </div>

          {contentTab === "en" ? (
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">
                Write description, prerequisites, and schedule in Markdown:
              </span>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                allowMediaLibrary
              />
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">
                বাংলায় ইভেন্ট বিবরণ এবং সময়সূচি লিখুন:
              </span>
              <MarkdownEditor
                value={contentBn}
                onChange={setContentBn}
                allowMediaLibrary
              />
            </div>
          )}
        </div>
      </div>

      {/* Date, Time & Venue */}
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t({ en: "Date, Time & Venue", bn: "তারিখ, সময় ও স্থান" })}
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs font-semibold">
              {t({ en: "Start Date & Time *", bn: "শুরুর তারিখ ও সময় *" })}
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-xs font-semibold">
              {t({ en: "End Date & Time", bn: "শেষের তারিখ ও সময়" })}
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline" className="text-xs font-semibold">
              {t({ en: "Registration Deadline", bn: "নিবন্ধনের শেষ তারিখ" })}
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="eventType" className="text-xs font-semibold">
              {t({ en: "Event Type", bn: "ইভেন্ট ধরণ" })}
            </Label>
            <select
              id="eventType"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            >
              <option value={EventType.IN_PERSON}>In-Person (সশরীরে)</option>
              <option value={EventType.ONLINE}>Online (অনলাইন)</option>
              <option value={EventType.HYBRID}>Hybrid (হাইব্রিড)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold">
              {t({ en: "Event Status", bn: "ইভেন্ট স্ট্যাটাস" })}
            </Label>
            <select
              id="status"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
            >
              <option value={EventStatus.UPCOMING}>Upcoming (আসন্ন)</option>
              <option value={EventStatus.ONGOING}>Ongoing (চলমান)</option>
              <option value={EventStatus.COMPLETED}>Completed (সম্পন্ন)</option>
              <option value={EventStatus.DRAFT}>Draft (খসড়া)</option>
              <option value={EventStatus.CANCELLED}>Cancelled (বাতিল)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="venue" className="text-xs font-semibold">
              {t({ en: "Venue (English)", bn: "স্থান (ইংরেজি)" })}
            </Label>
            <Input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Auditorium 302, DPI"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venueBn" className="text-xs font-semibold">
              {t({ en: "Venue (Bangla)", bn: "স্থান (বাংলা)" })}
            </Label>
            <Input
              id="venueBn"
              value={venueBn}
              onChange={(e) => setVenueBn(e.target.value)}
              placeholder="যেমন: মিলনায়তন ৩০২, ডিপিআই"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="locationMapUrl" className="text-xs font-semibold">
              {t({ en: "Google Maps URL", bn: "গুগল ম্যাপ লিংক" })}
            </Label>
            <Input
              id="locationMapUrl"
              value={locationMapUrl}
              onChange={(e) => setLocationMapUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onlineJoinUrl" className="text-xs font-semibold">
              {t({ en: "Online Stream / Meeting URL", bn: "অনলাইন মিটিং লিংক" })}
            </Label>
            <Input
              id="onlineJoinUrl"
              value={onlineJoinUrl}
              onChange={(e) => setOnlineJoinUrl(e.target.value)}
              placeholder="https://meet.google.com/... or zoom.us"
            />
          </div>
        </div>
      </div>

      {/* Category, Fees & Capacity */}
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t({ en: "Category & Registration Settings", bn: "ক্যাটাগরি ও নিবন্ধন সেটিংস" })}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold">
              {t({ en: "Category", bn: "ক্যাটাগরি" })}
            </Label>
            <select
              id="category"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t({ en: "None", bn: "কোনটি নয়" })}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-semibold">
              {t({ en: "Tags (comma separated)", bn: "ট্যাগসমূহ (কমা দিয়ে পৃথক)" })}
            </Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="workshop, c++, contest"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-xs font-semibold block">
                {t({ en: "Free Event?", bn: "ফ্রি ইভেন্ট?" })}
              </Label>
              <span className="text-[11px] text-muted-foreground">No fee required</span>
            </div>
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="size-4"
            />
          </div>

          {!isFree && (
            <div className="space-y-1.5">
              <Label htmlFor="regFee" className="text-xs font-semibold">
                {t({ en: "Fee (BDT ৳)", bn: "রেজিস্ট্রেশন ফি" })}
              </Label>
              <Input
                id="regFee"
                type="number"
                min="0"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="maxParticipants" className="text-xs font-semibold">
              {t({ en: "Seat Limit (Empty for unlimited)", bn: "সর্বোচ্চ সিট" })}
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-xs font-semibold block">
                {t({ en: "Registration Open", bn: "নিবন্ধন উন্মুক্ত" })}
              </Label>
              <span className="text-[11px] text-muted-foreground">Accept participants</span>
            </div>
            <input
              type="checkbox"
              checked={isRegistrationOpen}
              onChange={(e) => setIsRegistrationOpen(e.target.checked)}
              className="size-4"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-xs font-semibold block">
                {t({ en: "Featured Event", bn: "ফিচার্ড ইভেন্ট" })}
              </Label>
              <span className="text-[11px] text-muted-foreground">Highlight on home page</span>
            </div>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4"
            />
          </div>
        </div>
      </div>

      {/* Guest Speakers & Mentors with Import from Users */}
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t({ en: "Guest Speakers & Mentors", bn: "বক্তা ও মেন্টরবৃন্দ" })}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add custom speakers or import members & instructors directly from the database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserModalOpen(true)}
              className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/5"
            >
              <UserPlus className="size-3.5" />
              {t({ en: "Import from Users", bn: "ইউজার থেকে ইম্পোর্ট" })}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSpeaker}
              className="gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              {t({ en: "Add Custom", bn: "নতুন যোগ করুন" })}
            </Button>
          </div>
        </div>

        {guestSpeakers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-6 text-center text-xs text-muted-foreground">
            No guest speakers added yet. Click &quot;Import from Users&quot; or &quot;Add Custom&quot; above.
          </div>
        ) : (
          <div className="space-y-4">
            {guestSpeakers.map((speaker, index) => (
              <div
                key={index}
                className="relative rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
              >
                <button
                  type="button"
                  onClick={() => removeSpeaker(index)}
                  className="absolute top-3 right-3 text-destructive hover:opacity-80 p-1"
                  title="Remove speaker"
                >
                  <Trash2 className="size-4" />
                </button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Name (EN) *</Label>
                    <Input
                      required
                      value={speaker.name}
                      onChange={(e) => updateSpeaker(index, "name", e.target.value)}
                      placeholder="e.g. John Doe"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Role / Designation (EN) *</Label>
                    <Input
                      required
                      value={speaker.role}
                      onChange={(e) => updateSpeaker(index, "role", e.target.value)}
                      placeholder="e.g. Lead Instructor, Senior Engineer"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Company / Institution</Label>
                    <Input
                      value={speaker.company || ""}
                      onChange={(e) => updateSpeaker(index, "company", e.target.value)}
                      placeholder="e.g. Dhaka Polytechnic Institute"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Avatar URL</Label>
                    <Input
                      value={speaker.avatar || ""}
                      onChange={(e) => updateSpeaker(index, "avatar", e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Short Bio</Label>
                  <Input
                    value={speaker.bio || ""}
                    onChange={(e) => updateSpeaker(index, "bio", e.target.value)}
                    placeholder="Short 1-sentence bio..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Search & Import Dialog */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t({ en: "Import Speaker from Users", bn: "ব্যবহারকারীদের মধ্য থেকে স্পিকার যুক্ত করুন" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                en: "Search members, instructors, or admins to add them as speakers.",
                bn: "স্পিকার হিসেবে যুক্ত করতে নাম বা ইমেইল দিয়ে খুঁজুন।",
              })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearchUser} className="flex items-center gap-2 mb-3">
            <Input
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by name, email..."
              className="text-xs h-9"
            />
            <Button type="submit" size="sm" disabled={userSearchLoading} className="h-9">
              <Search className="size-4" />
            </Button>
          </form>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {userSearchLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Loading users...
              </div>
            ) : userOptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No users found matching query.
              </div>
            ) : (
              userOptions.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 rounded-full shrink-0">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {user.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {user.role}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => importUserAsSpeaker(user)}
                    className="h-7 text-xs ml-2 shrink-0 gap-1"
                  >
                    <Plus className="size-3" />
                    Import
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/events" />}
        >
          {t({ en: "Cancel", bn: "বাতিল" })}
        </Button>

        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isEdit
            ? t({ en: "Save Changes", bn: "পরিবর্তন সংরক্ষণ করুন" })
            : t({ en: "Publish Event", bn: "ইভেন্ট প্রকাশ করুন" })}
        </Button>
      </div>
    </form>
  )
}
