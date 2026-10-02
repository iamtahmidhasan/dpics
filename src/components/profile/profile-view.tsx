"use client"

import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { ProfileForm, type ProfileSection } from "@/components/profile/profile-form"
import { ProfileOverview } from "@/components/profile/profile-overview"
import { useProfile } from "@/components/profile/use-profile"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Profile, ProfileInput } from "@/lib/services/profile.service"

export function ProfileView({
  initialData,
  section,
}: {
  initialData: Profile
  section: ProfileSection
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: profile, isLoading, error: loadError } = useProfile(initialData, refreshKey)

  const [savedVersion, setSavedVersion] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const isGeneral = section === "general"

  async function handleSubmit(input: ProfileInput) {
    setIsSaving(true)
    setSaveError(null)
    setIsSaved(false)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Request failed")
      }

      // Re-read so the form shows exactly what was stored, and remount it to
      // pick up any value the server normalised.
      setSavedVersion((current) => current + 1)
      setRefreshKey((current) => current + 1)
      setIsSaved(true)
      router.refresh()
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Request failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {isSaved && !saveError ? (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs/relaxed text-emerald-700 dark:text-emerald-400"
        >
          {t("Your profile has been updated.", "আপনার প্রোফাইল আপডেট হয়েছে।")}
        </p>
      ) : null}

      <ProfileForm
        key={`${profile.id}-${section}-${savedVersion}`}
        profile={profile}
        section={section}
        isPending={isSaving}
        error={saveError ?? loadError}
        onSubmit={handleSubmit}
      />

      {isGeneral ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-sm font-medium">
              {t("Record status", "রেকর্ডের অবস্থা")}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={isLoading || isSaving}
              aria-label={t("Refresh", "রিফ্রেশ")}
            >
              {isLoading ? <Spinner className="size-3.5" /> : <RefreshCw />}
            </Button>
          </div>

          <div className={isLoading ? "opacity-60" : undefined}>
            <ProfileOverview profile={profile} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
