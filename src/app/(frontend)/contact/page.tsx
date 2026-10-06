import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Mail, MapPin, Users } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { websiteMetadata } from "@/lib/seo"
import { cn } from "cn"

const DESCRIPTION =
  "Contact DPI Computing Society (DPICS) — email the team, find us on campus, or jump to the quick links for joining, committees, and courses."

export const metadata: Metadata = websiteMetadata({
  title: "Contact Us | DPI Computing Society",
  description: DESCRIPTION,
  path: "/contact",
})

// Keep in sync with the footer's contact block.
const EMAIL = "info@dpics.org"
const ADDRESS = "Dhaka Polytechnic Institute"

const QUICK_LINKS = [
  { href: "/about", en: "About the society", bn: "সোসাইটি পরিচিতি" },
  { href: "/committee", en: "Executive committee", bn: "কার্যনির্বাহী কমিটি" },
  { href: "/join", en: "Join DPICS", bn: "ডিপিসিএসে যোগ দিন" },
  { href: "/courses", en: "Browse courses", bn: "কোর্স দেখুন" },
]

export default async function ContactPage() {
  const lang = await getLang()
  const t = makeT(lang)

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8 space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("Contact Us", "যোগাযোগ")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t(
            "Questions about membership, events, or courses? Reach the DPICS team — we usually reply within a couple of days.",
            "সদস্যপদ, ইভেন্ট বা কোর্স সম্পর্কে প্রশ্ন আছে? ডিপিসিএস টিমের সাথে যোগাযোগ করুন — আমরা সাধারণত কয়েক দিনের মধ্যে উত্তর দিই।"
          )}
        </p>
      </header>

      {/* Contact cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 shadow-xs">
          <CardContent className="space-y-3 p-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                {t("Email", "ইমেইল")}
              </h2>
              <a
                href={`mailto:${EMAIL}`}
                className="text-sm text-primary hover:underline"
              >
                {EMAIL}
              </a>
              <p className="text-xs text-muted-foreground">
                {t(
                  "For membership, collaboration, and press enquiries.",
                  "সদস্যপদ, অংশীদারিত্ব ও গণমাধ্যমের জন্য।"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="space-y-3 p-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="size-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                {t("Campus", "ক্যাম্পাস")}
              </h2>
              <p className="text-sm text-foreground">{ADDRESS}</p>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Find us during lab breaks and event days.",
                  "ল্যাব বিরতি ও ইভেন্ট দিনে আমাদের খুঁজে দেখুন।"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick links */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("Quick Links", "দ্রুত লিংক")}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:text-primary"
            >
              {t(link.en, link.bn)}
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* Member note */}
      <Card className="border-dashed">
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p>
            {t(
              "Already a member? Announcements, event tickets, and support happen inside your dashboard after you sign in.",
              "ইতিমধ্যে সদস্য? সাইন ইন করার পর ঘোষণা, ইভেন্ট টিকিট ও সহায়তা সব আপনার ড্যাশবোর্ডের মধ্যে পাবেন।"
            )}
          </p>
          <Link
            href="/join"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}
          >
            {t("Sign in", "সাইন ইন")}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
