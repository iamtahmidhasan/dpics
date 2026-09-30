'use client'

import { motion } from 'framer-motion'
import { Menu, User, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { DesktopNav } from '@/components/Header/DesktopNav'
import { MobileNav } from '@/components/Header/MobileNav'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { signOut, useSession } from '@/lib/auth-client'
import {
  BANNER,
  MOBILE_ITEMS,
  NAV_ITEMS,
  SITE,
  SOCIAL_LINKS,
} from '@/lib/site-config'

const BANNER_STORAGE_KEY = 'banner-dismissed'
const BANNER_EVENT = 'banner-dismissed-change'
const SCROLL_HIDE_THRESHOLD = 96

function subscribeBanner(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(BANNER_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(BANNER_EVENT, onStoreChange)
  }
}

function getBannerDismissed() {
  try {
    return localStorage.getItem(BANNER_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const bannerDismissed = useSyncExternalStore(
    subscribeBanner,
    getBannerDismissed,
    () => false
  )


  useEffect(() => {
    let lastScrollY = window.scrollY
    const onScroll = () => {
      const currentScrollY = window.scrollY
      setIsHidden(currentScrollY > SCROLL_HIDE_THRESHOLD && currentScrollY > lastScrollY)
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const banner = bannerDismissed ? null : BANNER

  const renderBanner = () =>
    banner ? (
      <div className="relative border-b border-border bg-background text-[11px] font-medium text-foreground sm:text-xs">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          {banner.href ? (
            <Link href={banner.href} className="transition-colors hover:text-muted-foreground">
              {banner.text}
            </Link>
          ) : (
            <span>{banner.text}</span>
          )}
          {banner.links.length > 0 && (
            <div className="flex items-center gap-4">
              {banner.links.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : null

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const user = session?.user
  const initials = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <>
      {banner && (
        <div className="relative z-50 w-full overflow-hidden">{renderBanner()}</div>
      )}

      <motion.header
        animate={{ y: isHidden ? '-100%' : '0%' }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
        className="sticky top-0 z-50 w-full transform-gpu border-b border-border bg-background"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight text-foreground"
          >
            <Image
              src={SITE.logo}
              alt={SITE.title}
              width={32}
              height={32}
              className="h-8 w-auto rounded-lg"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-lg">{SITE.title}</span>
              {SITE.tagline && (
                <span className="hidden text-[10px] font-normal text-muted-foreground sm:block">
                  {SITE.tagline}
                </span>
              )}
            </span>
          </Link>

          <DesktopNav items={NAV_ITEMS} hidden={isHidden} />

          <div className="flex items-center gap-1">
            <ThemeSwitcher />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      className="relative size-8 overflow-hidden rounded-full p-0"
                    />
                  }
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.email || SITE.title}
                      width={32}
                      height={32}
                      unoptimized
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuItem render={<Link href="/dashboard" />}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon-lg"
                render={<Link href="/sign-in" aria-label="Sign in" />}
              >
                <User className="size-5" />
              </Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-lg" className="md:hidden" />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-80 flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground"
                showCloseButton={false}
              >
                <div className="relative flex flex-row items-center gap-3 border-b border-sidebar-border p-4">
                  <SheetClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        className="absolute right-3 top-3"
                      />
                    }
                  >
                    <X className="size-5" />
                  </SheetClose>
                  <Image
                    src={SITE.logo}
                    alt={SITE.title}
                    width={28}
                    height={28}
                    className="size-7 rounded-lg"
                  />
                  <div>
                    <SheetTitle className="text-base font-bold text-sidebar-foreground">
                      {SITE.title}
                    </SheetTitle>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-1">
                    <p className="px-2 pb-2 pt-3 text-xs font-semibold text-sidebar-foreground/60">
                      Navigation
                    </p>
                    <MobileNav
                      items={MOBILE_ITEMS}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                </div>

                {SOCIAL_LINKS.length > 0 && (
                  <div className="border-t border-sidebar-border p-4">
                    <div className="my-2 h-px bg-sidebar-border" />
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {SOCIAL_LINKS.map((social) => (
                        <a
                          key={social.platform}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs capitalize text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
                        >
                          {social.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>
    </>
  )
}
