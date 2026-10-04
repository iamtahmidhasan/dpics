'use client'

import { motion } from 'framer-motion'
import { Menu, User, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { DesktopNav, type NavItem } from '@/components/Header/DesktopNav'
import { MobileNav, type MobileNavItem } from '@/components/Header/MobileNav'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-provider'
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
import type { LocalizedText } from '@/lib/i18n'
import { isAdmin as hasAdminRole } from '@/lib/roles'
import { resolveUserImage } from '@/lib/user-image'

const SITE = {
  title: 'DPI Computing Society',
  tagline: {
    en: 'Learn, build, and grow together',
    bn: 'শিখুন, তৈরি করুন, একসাথে এগিয়ে যান',
  } satisfies LocalizedText,
  logo: '/dpicslogo.png',
}

const BANNER = {
  text: {
    en: 'Registration is starting now!',
    bn: 'রেজিস্ট্রেশন শুরু হয়ে গেছে!',
  } satisfies LocalizedText,
  href: '/about',
  links: [
    { label: { en: 'Events', bn: 'ইভেন্ট' }, href: '/events' },
    { label: { en: 'Join', bn: 'যোগদান' }, href: '/join' },
  ],
}

const SOCIAL_LINKS: { platform: string; url: string }[] = []

const NAV_ITEMS: NavItem[] = [
  {
    label: { en: 'Home', bn: 'হোম' },
    href: '/',
    columns: [],
  },
  {
    label: { en: 'About', bn: 'পরিচিতি' },
    href: '/about',
    columns: [
      {
        title: { en: 'The Society', bn: 'সংগঠন' },
        links: [
          {
            label: { en: 'Who We Are', bn: 'আমরা কারা' },
            href: '/about',
            description: {
              en: 'Our mission, vision and story',
              bn: 'আমাদের লক্ষ্য, দৃষ্টিভঙ্গি ও গল্প',
            },
          },
          {
            label: { en: 'Executive Committee', bn: 'কার্যনির্বাহী কমিটি' },
            href: '/committee',
            description: {
              en: 'Leadership, technical and wing panels',
              bn: 'নেতৃত্ব, টেকনিক্যাল ও উইং প্যানেল',
            },
          },
          {
            label: { en: 'Our Team', bn: 'আমাদের টিম' },
            href: '/about#team',
            description: {
              en: 'Advisors and executive panel',
              bn: 'উপদেষ্টা ও কার্যকরী পরিষদ',
            },
          },
          {
            label: { en: 'Membership', bn: 'সদস্যপদ' },
            href: '/about#membership',
            description: {
              en: 'Benefits, rules and how to join',
              bn: 'সুবিধাসমূহ ও যোগদানের নিয়মাবলী',
            },
          },
        ],
      },
      {
        title: { en: 'Community', bn: 'কমিউনিটি' },
        links: [
          {
            label: { en: 'Members Directory', bn: 'সদস্য তালিকা' },
            href: '/members',
            description: {
              en: 'Explore registered society members',
              bn: 'সোসাইটির সক্রিয় সদস্যবৃন্দের তালিকা',
            },
          },
          {
            label: { en: 'Instructors & Mentors', bn: 'ইনস্ট্রাক্টর ও মেন্টর' },
            href: '/instructors',
            description: {
              en: 'Meet our course teachers and mentors',
              bn: 'আমাদের শিক্ষক ও মেন্টরদের সাথে পরিচিত হন',
            },
          },
          {
            label: { en: 'Join Us', bn: 'যোগ দিন' },
            href: '/join',
            description: {
              en: 'Create your member account',
              bn: 'আপনার সদস্য অ্যাকাউন্ট তৈরি করুন',
            },
          },
          {
            label: { en: 'Contact', bn: 'যোগাযোগ' },
            href: '/contact',
            description: {
              en: 'Reach the society executives',
              bn: 'সোসাইটির সাথে যোগাযোগ করুন',
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Courses', bn: 'কোর্স' },
    href: '/courses',
    columns: [
      {
        title: { en: 'Online Courses', bn: 'অনলাইন কোর্স' },
        links: [
          {
            label: { en: 'All Courses', bn: 'সকল কোর্স' },
            href: '/courses',
            description: {
              en: 'Interactive lessons and video lectures',
              bn: 'ইন্টারেক্টিভ পাঠ ও ভিডিও লেকচার',
            },
          },
          {
            label: { en: 'Instructors', bn: 'ইনস্ট্রাক্টরবৃন্দ' },
            href: '/instructors',
            description: {
              en: 'Learn from skilled tech instructors',
              bn: 'দক্ষ ইনস্ট্রাক্টরদের কাছ থেকে শিখুন',
            },
          },
          {
            label: { en: 'Enrolled Classroom', bn: 'আমার ক্লাসরুম' },
            href: '/profile/enrolled',
            description: {
              en: 'Continue your learning progress',
              bn: 'আপনার চলমান কোর্স ও অগ্রগতি দেখুন',
            },
          },
        ],
      },
      {
        title: { en: 'Learning Resources', bn: 'শিক্ষণ রিসোর্স' },
        links: [
          {
            label: { en: 'Curated Roadmaps', bn: 'লার্নিং রোডম্যাপ' },
            href: '/resources#roadmaps',
            description: {
              en: 'Step-by-step career and skill paths',
              bn: 'ধাপে ধাপে প্রযুক্তি শেখার গাইডলাইন',
            },
          },
          {
            label: { en: 'Notes & Slides', bn: 'নোট ও স্লাইড' },
            href: '/resources#notes',
            description: {
              en: 'Materials from past sessions',
              bn: 'অতীতের সেশন ও ক্লাসের উপকরণ',
            },
          },
          {
            label: { en: 'Problem Sets', bn: 'প্রব্লেম সেট' },
            href: '/resources#problems',
            description: {
              en: 'Coding contest practice and problems',
              bn: 'প্রোগ্রামিং অনুশীলন ও কনটেস্ট আর্কাইভ',
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Events', bn: 'ইভেন্ট' },
    href: '/events',
    columns: [
      {
        title: { en: 'What We Run', bn: 'আমাদের আয়োজন' },
        links: [
          {
            label: { en: 'Upcoming Events', bn: 'আসন্ন ইভেন্ট' },
            href: '/events',
            description: {
              en: 'Workshops, sessions and bootcamps',
              bn: 'ওয়ার্কশপ, সেমিনার ও বুটক্যাম্প',
            },
          },
          {
            label: { en: 'Past Events', bn: 'অতীতের ইভেন্ট' },
            href: '/events#past',
            description: {
              en: 'Recap of what we have hosted',
              bn: 'আমাদের আয়োজিত কার্যক্রমের সারসংক্ষেপ',
            },
          },
          {
            label: { en: 'Competitions', bn: 'প্রতিযোগিতা' },
            href: '/events#competitions',
            description: {
              en: 'Programming contests and hackathons',
              bn: 'প্রোগ্রামিং প্রতিযোগিতা ও হ্যাকাথন',
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Blog', bn: 'ব্লগ' },
    href: '/posts',
    columns: [
      {
        title: { en: 'Publications', bn: 'প্রকাশনা' },
        links: [
          {
            label: { en: 'All Articles', bn: 'সকল নিবন্ধ' },
            href: '/posts',
            description: {
              en: 'Tech articles, tutorials and guides',
              bn: 'প্রযুক্তি নিবন্ধ, টিউটোরিয়াল ও গাইড',
            },
          },
          {
            label: { en: 'Write an Article', bn: 'নিবন্ধ লিখুন' },
            href: '/profile/write',
            description: {
              en: 'Publish insights for the community',
              bn: 'কমিউনিটির জন্য আপনার লেখা প্রকাশ করুন',
            },
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Achievements', bn: 'অর্জন' },
    href: '/achievements',
    columns: [],
  },
]

const MOBILE_ITEMS: MobileNavItem[] = NAV_ITEMS.map(
  ({ label, href, columns }) => ({
    label,
    href,
    children: columns.flatMap((col) =>
      col.links.map((link) => ({ label: link.label, href: link.href }))
    ),
  })
)

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
  const { t } = useLanguage()
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
              {t(banner.text)}
            </Link>
          ) : (
            <span>{t(banner.text)}</span>
          )}
          {banner.links.length > 0 && (
            <div className="flex items-center gap-4">
              {banner.links.map((link) => (
                <Link
                  key={`${link.label.en}-${link.href}`}
                  href={link.href}
                  className="transition-colors hover:text-muted-foreground"
                >
                  {t(link.label)}
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
  const isAdmin = hasAdminRole(user)
  const initials = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase()
  // `User.image` is a list, so the session hands back an array where
  // `next/image` expects a single url.
  const avatar = resolveUserImage(
    user?.image as unknown as string[] | undefined,
    user?.selactedImg ?? null
  ).avatar

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
              className="size-8 rounded-lg"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm hidden sm:block">{SITE.title}</span>
              <span className="text-sm sm:hidden">DPICS</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {t(SITE.tagline)}
              </span>
            </span>
          </Link>

          <DesktopNav items={NAV_ITEMS} hidden={isHidden} />

          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <LanguageSwitcher />

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
                  {avatar ? (
                    <Image
                      src={avatar}
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
                    {t("Dashboard", "ড্যাশবোর্ড")}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    {t("Profile", "প্রোফাইল")}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      {t("Admin Panel", "অ্যাডমিন প্যানেল")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    {t("Sign out", "সাইন আউট")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon-lg"
                nativeButton={false}
                render={<Link href="/join" aria-label="Join" />}
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
                      {t("Navigation", "নেভিগেশন")}
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
