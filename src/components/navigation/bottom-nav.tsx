"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Calendar, Trophy, BookOpen, User } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { UserDrawer } from "@/components/navigation/user-drawer"
import { useSession } from "@/lib/auth-client"
import { resolveUserImage } from "@/lib/user-image"
import { cn } from "cn"

const SCROLL_HIDE_THRESHOLD = 96

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const session = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const onScroll = () => {
      const currentScrollY = window.scrollY
      setIsHidden(currentScrollY > SCROLL_HIDE_THRESHOLD && currentScrollY > lastScrollY)
      lastScrollY = currentScrollY
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const user = session.data?.user
  const initials = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase()
  const avatar = user
    ? resolveUserImage(
        user.image as unknown as string[] | undefined,
        user.selactedImg ?? null
      ).avatar
    : null

  const navItems = [
    {
      label: t("Home", "হোম"),
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: t("Events", "ইভেন্ট"),
      href: "/events",
      icon: Calendar,
      isActive: pathname.startsWith("/events"),
    },
    {
      label: t("Achievements", "অর্জন"),
      href: "/achievements",
      icon: Trophy,
      isActive: pathname.startsWith("/achievements"),
    },
    {
      label: t("Blog", "ব্লগ"),
      href: "/posts",
      icon: BookOpen,
      isActive: pathname.startsWith("/posts"),
    },
  ]

  const hideNav = isHidden && !drawerOpen

  return (
    <>
      <motion.nav
        aria-label="Mobile Bottom Navigation"
        animate={{ y: hideNav ? "100%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
        className="fixed bottom-0 inset-x-0 z-40 block md:hidden border-t border-border/80 bg-background/90 backdrop-blur-xl shadow-lg transform-gpu"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors",
                  item.isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("size-5 transition-transform", item.isActive && "scale-110")} />
                  {item.isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className="mt-1 text-[10px] leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* Account / User Avatar Button triggering Full Screen Drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("Account & Shortcuts", "অ্যাকাউন্ট ও মেনু")}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors text-muted-foreground hover:text-foreground",
              (pathname.startsWith("/profile") || pathname.startsWith("/dashboard") || drawerOpen) &&
                "text-primary font-semibold"
            )}
          >
            {user ? (
              <div className="relative">
                <div
                  className={cn(
                    "size-6 rounded-full overflow-hidden border border-border transition-all",
                    (pathname.startsWith("/profile") || pathname.startsWith("/dashboard") || drawerOpen)
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : "ring-1 ring-border"
                  )}
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={user.name || user.email}
                      width={24}
                      height={24}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-primary text-[10px] font-bold text-primary-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                {(pathname.startsWith("/profile") || pathname.startsWith("/dashboard")) && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                )}
              </div>
            ) : (
              <div className="relative">
                <User
                  className={cn(
                    "size-5 transition-transform",
                    drawerOpen && "scale-110 text-primary"
                  )}
                />
                {drawerOpen && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                )}
              </div>
            )}

            <span className="mt-1 text-[10px] leading-none tracking-tight">
              {user ? t("Account", "অ্যাকাউন্ট") : t("Account", "অ্যাকাউন্ট")}
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Full-Screen / Large User Drawer */}
      <UserDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
