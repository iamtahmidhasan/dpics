"use client"

import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleRow } from "./toggle-row"
import { AdminSettingsSaveCard } from "./admin-settings-save-card"
import { useAdminSettings } from "./admin-settings-context"

export function AdminSignupsTab() {
  const { t } = useLanguage()
  const {
    isSignupEnabled,
    setIsSignupEnabled,
    isMemberSignupEnabled,
    setIsMemberSignupEnabled,
    isInstructorSignupEnabled,
    setIsInstructorSignupEnabled,
  } = useAdminSettings()

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Signup availability", "নিবন্ধন প্রাপ্যতা")}</CardTitle>
          <CardDescription>
            {t(
              "Control who can create accounts and register for society roles.",
              "সমিতির বিভিন্ন ভূমিকায় কারা অ্যাকাউন্ট তৈরি ও নিবন্ধন করতে পারবেন তা নিয়ন্ত্রণ করুন।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            id="signup-enabled"
            label={t("General user registration", "সাধারণ ব্যবহারকারী নিবন্ধন")}
            description={t(
              "When disabled, new users cannot register accounts on the platform.",
              "নিষ্ক্রিয় থাকলে প্ল্যাটফর্মে নতুন ব্যবহারকারীরা অ্যাকাউন্ট তৈরি করতে পারবেন না।"
            )}
            checked={isSignupEnabled}
            onChange={setIsSignupEnabled}
          />

          <ToggleRow
            id="member-signup-enabled"
            label={t("Member registration", "সদস্য নিবন্ধন")}
            description={t(
              "When disabled, users cannot apply for society membership.",
              "নিষ্ক্রিয় থাকলে ব্যবহারকারীরা সমিতির সদস্যপদের জন্য আবেদন করতে পারবেন না।"
            )}
            checked={isMemberSignupEnabled}
            disabled={!isSignupEnabled}
            onChange={setIsMemberSignupEnabled}
          />

          <ToggleRow
            id="instructor-signup-enabled"
            label={t("Instructor onboarding", "শিক্ষক নিবন্ধন")}
            description={t(
              "When disabled, users cannot apply for an instructor profile.",
              "নিষ্ক্রিয় থাকলে ব্যবহারকারীরা শিক্ষক প্রোফাইলের জন্য আবেদন করতে পারবেন না।"
            )}
            checked={isInstructorSignupEnabled}
            disabled={!isSignupEnabled}
            onChange={setIsInstructorSignupEnabled}
          />
        </CardContent>
      </Card>

      <AdminSettingsSaveCard />
    </div>
  )
}
