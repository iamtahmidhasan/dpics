import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { JoinForm } from "@/components/join-form"
import { isSetupComplete } from "@/lib/roles"
import { getSession } from "@/lib/session"
import { NOINDEX } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Join | DPI Computing Society",
  description: "Sign in or join DPI Computing Society using Google or GitHub",
  robots: NOINDEX,
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession()

  if (session?.user) {
    if (isSetupComplete(session.user)) {
      redirect("/dashboard")
    } else {
      redirect("/register")
    }
  }

  const { error } = await searchParams

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <JoinForm
          initialError={
            error === "auth_failed"
              ? "Authentication failed. Please try again."
              : error
          }
        />
      </div>
    </div>
  )
}
