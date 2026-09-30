import type { Metadata } from "next"

import { SignupWizard } from "@/components/signup/signup-wizard"
import { isOnboarded } from "@/lib/roles"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
}

export default async function SignUpPage() {
  const session = await getSession()

  // An account that exists but never picked a role — a Google sign up landing
  // back here, or someone who refreshed mid-flow — resumes on the role step
  // instead of being asked to create an account that is already there.
  const startStep = session?.user && !isOnboarded(session.user) ? 1 : 0

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupWizard startStep={startStep} />
      </div>
    </div>
  )
}