"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const { t } = useLanguage()

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      <LogOut data-icon="inline-start" />
      {t("Sign out", "সাইন আউট")}
    </Button>
  )
}
