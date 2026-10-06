"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"

export function DashboardSignOutButton({
  variant = "ghost",
  size = "sm",
  className,
}: {
  variant?: "ghost" | "outline" | "default" | "secondary"
  size?: "sm" | "default" | "lg" | "icon"
  className?: string
}) {
  const router = useRouter()
  const { t } = useLanguage()

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className="size-3.5 mr-1 text-destructive" />
      <span className="text-destructive font-medium">{t("Sign Out", "সাইন আউট")}</span>
    </Button>
  )
}
