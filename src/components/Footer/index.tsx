import { ArrowRight, Mail, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"
import {
  CONTACT,
  INVOLVE_LINKS,
  NAV_ITEMS,
  SITE,
  SOCIAL_LINKS,
  type NavLink,
} from "@/lib/site-config"

function FooterLink({ link }: { link: NavLink }) {
  return (
    <Link
      href={link.href}
      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>{link.label}</span>
      <ArrowRight className="size-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
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
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <Image
                src={SITE.logo}
                alt={SITE.title}
                width={32}
                height={32}
                className="size-8 w-auto"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-base">{SITE.title}</span>
                {SITE.tagline && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {SITE.tagline}
                  </span>
                )}
              </span>
            </Link>
            <p className="max-w-xs text-sm text-balance text-muted-foreground">
              {SITE.description}
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
            <FooterHeading>Explore</FooterHeading>
            <ul className="flex flex-col gap-2.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <FooterLink link={{ label: item.label, href: item.href }} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <FooterHeading>Get Involved</FooterHeading>
            <ul className="flex flex-col gap-2.5">
              {INVOLVE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <FooterHeading>Contact</FooterHeading>
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
            &copy; {new Date().getFullYear()} {SITE.title}. All rights reserved.
          </p>
          <p>Learn, build, and grow together.</p>
        </div>
      </div>
    </footer>
  )
}
