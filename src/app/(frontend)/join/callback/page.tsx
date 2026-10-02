import { redirect } from "next/navigation"

import { isSetupComplete } from "@/lib/roles"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function JoinCallbackPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/join?error=auth_failed")
  }

  if (isSetupComplete(session.user)) {
    redirect("/dashboard")
  }

  redirect("/register")
}
