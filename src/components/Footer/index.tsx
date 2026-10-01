"use client"
import { ArrowRight, Mail, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { useLanguage } from "@/components/language-provider"
import { Separator } from "@/components/ui/separator"
import type { LocalizedText, TFn } from "@/lib/i18n"

const BRAND = {
  title: "DPI Computing Society",
  tagline: {
    en: "Learn, build, and grow together",
    bn: "শিখুন, তৈরি করুন, একসাথে এগিয়ে যান",
  } satisfies LocalizedText,
  description: {
    en: "A student-led computing community where we learn, build, and grow together through workshops, events, and collaboration.",
    bn: "একটি শিক্ষার্থী-পরিচালিত কম্পিউটিং কমিউনিটি, যেখানে ওয়ার্কশপ, ইভেন্ট ও সহযোগিতার মাধ্যমে আমরা শিখি, তৈরি করি এবং একসাথে এগিয়ে যাই।",
  } satisfies LocalizedText,
  logo: "/dpicslogo.png",
}

type FooterLink = {
  label: LocalizedText
  href: string
}

const EXPLORE_LINKS: FooterLink[] = [
  { label: { en: "Home", bn: "হোম" }, href: "/" },
  { label: { en: "About", bn: "পরিচিতি" }, href: "/about" },
  { label: { en: "Events", bn: "ইভেন্ট" }, href: "/events" },
  { label: { en: "Committee", bn: "কমিটি" }, href: "/committee" },
  { label: { en: "Resources", bn: "রিসোর্স" }, href: "/resources" },
  { label: { en: "Contact", bn: "যোগাযোগ" }, href: "/contact" },
]

const INVOLVE_LINKS: FooterLink[] = [
  { label: { en: "Join the Society", bn: "সোসাইটিতে যোগ দিন" }, href: "/sign-up" },
  { label: { en: "Membership", bn: "সদস্যপদ" }, href: "/about#membership" },
  { label: { en: "Member Sign in", bn: "সদস্য লগইন" }, href: "/sign-in" },
  { label: { en: "Dashboard", bn: "ড্যাশবোর্ড" }, href: "/dashboard" },
]

const CONTACT = {
  email: "info@dpics.org",
  address: "Dhaka Polytechnic Institute",
}

const SOCIAL_LINKS: { platform: string; url: string }[] = []

const HEADINGS = {
  explore: { en: "Explore", bn: "ঘুরে দেখুন" } satisfies LocalizedText,
  involve: { en: "Get Involved", bn: "যুক্ত হোন" } satisfies LocalizedText,
  contact: { en: "Contact", bn: "যোগাযোগ" } satisfies LocalizedText,
}

const RIGHTS = {
  en: "All rights reserved.",
  bn: "সর্বস্বত্ব সংরক্ষিত।",
} satisfies LocalizedText

const BOTTOM_LINE = {
  en: "Learn, build, and grow together.",
  bn: "শিখুন, তৈরি করুন, একসাথে এগিয়ে যান।",
} satisfies LocalizedText

function FooterLink({ link, t }: { link: FooterLink; t: TFn }) {
  return (
    <Link
      href={link.href}
      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowRight className="size-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      <span>{t(link.label)}</span>
    </Link>
  )
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
      {children}
    </h2>
  )
}

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <Image
                src={BRAND.logo}
                alt={BRAND.title}
                width={32}
                height={32}
                className="size-8 rounded-lg"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-base">{BRAND.title}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {t(BRAND.tagline)}
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-sm text-balance text-muted-foreground">
              {t(BRAND.description)}
            </p>
            {SOCIAL_LINKS.length > 0 && (
              <div className="flex items-center gap-4">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground capitalize transition-colors hover:text-foreground"
                  >
                    {social.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <FooterHeading>{t(HEADINGS.explore)}</FooterHeading>
            <ul className="flex flex-col gap-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} t={t} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <FooterHeading>{t(HEADINGS.involve)}</FooterHeading>
            <ul className="flex flex-col gap-2.5">
              {INVOLVE_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink link={link} t={t} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <FooterHeading>{t(HEADINGS.contact)}</FooterHeading>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="size-3.5 shrink-0" />
                  <span>{CONTACT.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span className="text-balance">{CONTACT.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.title}. {t(RIGHTS)}
          </p>
          <p>{t(BOTTOM_LINE)}</p>
        </div>
      </div>
    </footer>
  )
}
