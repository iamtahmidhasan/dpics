import type { Metadata } from "next"
import Link from "next/link"

import { SignupWizard, type SignupPolicy } from "@/components/signup/signup-wizard"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Role } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { isOnboarded, type SelfAssignableRole } from "@/lib/roles"
import { getSettings } from "@/lib/services/settings.service"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
}

export default async function SignUpPage() {
  const [session, settings, lang] = await Promise.all([
    getSession(),
    getSettings(),
    getLang(),
  ])
  const user = session?.user

  // Master toggle blocks new account creation only. If registration is disabled
  // and the visitor is not logged in (or already onboarded), show the closed notice.
  // Existing accounts mid-flow (including Google users) can still finish onboarding.
  if (!settings.isSignupEnabled && (!user || isOnboarded(user))) {
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

  // An account that exists but never picked a role — a Google sign up landing
  // back here, or someone who refreshed mid-flow — resumes on the basic
  // information step instead of being asked to create an account that is
  // already there. Google only hands over a name and a picture, so the rest of
  // the profile still needs collecting.
  const startStep = user && !isOnboarded(user) ? 1 : 0

  const availableRoles: SelfAssignableRole[] = []
  if (settings.isMemberSignupEnabled) availableRoles.push(Role.MEMBER)
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
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupWizard
          startStep={startStep}
          initialUser={
            user
              ? { name: user.name, email: user.email, phone: user.phone ?? "" }
              : null
          }
          signupPolicy={signupPolicy}
        />
      </div>
    </div>
  )
}