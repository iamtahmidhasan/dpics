"use client"

import { useSyncExternalStore, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ChevronDown,
  ExternalLink,
  Globe,
  Languages,
  LayoutDashboard,
  LogOut,
  Moon,
  Shield,
  Sun,
  User as UserIcon,
} from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/auth-client"
import { normalizeImageList, resolveUserImage } from "@/lib/user-image"

const emptySubscribe = () => () => {}

export function AdminUserMenu({
  user,
  isSuperAdmin,
}: {
  user: {
    id: string
    name: string
    email: string
    image?: unknown
    selactedImg?: string | null
  }
  isSuperAdmin?: boolean
}) {
  const router = useRouter()
  const { lang, setLang, t } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const isDark = mounted && resolvedTheme === "dark"

  const { avatar } = resolveUserImage(
    normalizeImageList(user.image),
    user.selactedImg ?? null
  )

  const initials = (user.name || user.email || "A")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push("/")
      router.refresh()
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="group flex items-center gap-2 rounded-full p-1 border border-border/80 bg-background hover:bg-muted/70 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("Admin user menu", "অ্যাডমিন মেনু")}
          />
        }
      >
        <div className="relative size-7 rounded-full ring-1 ring-border overflow-hidden bg-muted shrink-0">
          {avatar ? (
            <Image
              src={avatar}
              alt={user.name || user.email}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary text-[10px] font-bold text-primary-foreground">
              {initials}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
        {/* User Identity Header */}
        <div className="p-2 font-normal">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 rounded-full ring-1 ring-border overflow-hidden bg-muted">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={user.name || user.email}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="font-heading text-xs font-bold text-foreground truncate">
                  {user.name || t("Admin", "অ্যাডমিন")}
                </p>
                <Badge
                  variant={isSuperAdmin ? "default" : "secondary"}
                  className="text-[9px] px-1 py-0 h-4 shrink-0 font-medium"
                >
                  {isSuperAdmin ? t("Super Admin", "সুপার অ্যাডমিন") : t("Admin", "অ্যাডমিন")}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Header Action Links */}
        <DropdownMenuItem
          render={<Link href="/" className="cursor-pointer" />}
        >
          <Globe className="size-4 text-muted-foreground" />
          <span className="flex-1">{t("View Public Site", "সাইট দেখুন")}</span>
          <ExternalLink className="size-3 text-muted-foreground/60" />
        </DropdownMenuItem>

        <DropdownMenuItem
          render={<Link href="/profile" className="cursor-pointer" />}
        >
          <UserIcon className="size-4 text-muted-foreground" />
          <span>{t("My Profile", "আমার প্রোফাইল")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          render={<Link href="/admin/overview" className="cursor-pointer" />}
        >
          <LayoutDashboard className="size-4 text-muted-foreground" />
          <span>{t("Overview Dashboard", "ওভারভিউ ড্যাশবোর্ড")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme & Language Controls */}
        <DropdownMenuItem
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="cursor-pointer justify-between"
        >
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="size-4 text-purple-400" />
            ) : (
              <Sun className="size-4 text-amber-500" />
            )}
            <span>{t("Theme", "থিম")}</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {isDark ? t("Dark", "ডার্ক") : t("Light", "লাইট")}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setLang(lang === "en" ? "bn" : "en")}
          className="cursor-pointer justify-between"
        >
          <div className="flex items-center gap-2">
            <Languages className="size-4 text-primary" />
            <span>{t("Language", "ভাষা")}</span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {lang === "en" ? "বাংলা" : "English"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out Action */}
        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>
            {isSigningOut
              ? t("Signing out...", "সাইন আউট হচ্ছে...")
              : t("Sign out", "সাইন আউট")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
