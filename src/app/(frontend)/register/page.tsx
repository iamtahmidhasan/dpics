import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { SignupWizard, type SignupPolicy } from "@/components/signup/signup-wizard"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Role } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { isOnboarded, isSetupComplete, type SelfAssignableRole } from "@/lib/roles"
import { getBatchMemberStats } from "@/lib/services/member-id.service"
import { getSettings } from "@/lib/services/settings.service"
import { getSession } from "@/lib/session"
import { normalizeImageList } from "@/lib/user-image"

export const metadata: Metadata = {
  title: "Complete Registration",
  description: "Set up your profile, role, and details to join DPI Computing Society",
}

export default async function RegisterPage() {
  const [session, settings, batchStats, lang] = await Promise.all([
    getSession(),
    getSettings(),
    getBatchMemberStats(),
    getLang(),
  ])
  const user = session?.user

  // User must sign in first via Google or GitHub
  if (!user) {
    redirect("/join")
  }

  // Already onboarded users shouldn't re-register
  if (isSetupComplete(user)) {
    redirect("/dashboard")
  }

  // If registration is disabled and account isn't onboarded yet
  if (!settings.isSignupEnabled && !isOnboarded(user)) {
    const t = makeT(lang)

    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-md">
          <Card className="p-6 text-center space-y-4">
            <CardHeader className="space-y-1.5 p-0">
              <CardTitle className="text-xl font-bold">
                {t("Registration is closed", "নিবন্ধন সাময়িকভাবে বন্ধ আছে")}
              </CardTitle>
              <CardDescription>
                {t(
                  "New account registration is currently paused. Please check back later or contact an administrator.",
                  "নতুন অ্যাকাউন্ট নিবন্ধন বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন অথবা প্রশাসকের সাথে যোগাযোগ করুন।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2 flex justify-center">
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                {t("Back to home", "হোমে ফিরুন")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isMemberBatchFull = Boolean(
    settings.isAutoStudentIdEnabled && batchStats.isLimitReached
  )

  const availableRoles: SelfAssignableRole[] = []
  if (settings.isMemberSignupEnabled && !isMemberBatchFull) availableRoles.push(Role.MEMBER)
  if (settings.isInstructorSignupEnabled) availableRoles.push(Role.INSTRUCTOR)

  const signupPolicy: SignupPolicy = {
    isSignupEnabled: settings.isSignupEnabled,
    isMemberSignupEnabled: settings.isMemberSignupEnabled,
    isInstructorSignupEnabled: settings.isInstructorSignupEnabled,
    availableRoles,
    payment: {
      isRegistrationFeeRequired: settings.isRegistrationFeeRequired,
      fee: settings.registrationFee,
      bkashPersonalNumber: settings.bkashPersonalNumber,
      bkashAgentNumber: settings.bkashAgentNumber,
      nagadPersonalNumber: settings.nagadPersonalNumber,
      nagadAgentNumber: settings.nagadAgentNumber,
      rocketPersonalNumber: settings.rocketPersonalNumber,
      rocketAgentNumber: settings.rocketAgentNumber,
    },
    studentId: {
      isAutoEnabled: settings.isAutoStudentIdEnabled,
      prefix: settings.studentIdPrefix,
      batch: settings.studentIdBatch,
      isLimitReached: isMemberBatchFull,
      limit: batchStats.limit,
      totalMembers: batchStats.totalMembers,
    },
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupWizard
          startStep={0}
          initialUser={{
            name: user.name || "",
            email: user.email || "",
            phone: user.phone ?? "",
            images: normalizeImageList(user.image),
          }}
          signupPolicy={signupPolicy}
        />
      </div>
    </div>
  )
}
