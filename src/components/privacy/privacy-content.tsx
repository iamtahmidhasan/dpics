"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Cookie,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
} from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "cn"

interface SectionItem {
  id: string
  titleEn: string
  titleBn: string
  icon: typeof Shield
}

const SECTIONS: SectionItem[] = [
  {
    id: "overview",
    titleEn: "1. Overview & Commitment",
    titleBn: "১. ভূমিকা ও অঙ্গীকার",
    icon: Shield,
  },
  {
    id: "information-collected",
    titleEn: "2. Information We Collect",
    titleBn: "২. যে তথ্যগুলো আমরা সংগ্রহ করি",
    icon: Database,
  },
  {
    id: "usage",
    titleEn: "3. How We Use Information",
    titleBn: "৩. তথ্য ব্যবহারের উদ্দেশ্য",
    icon: Eye,
  },
  {
    id: "third-party",
    titleEn: "4. Third-Party Services & Auth",
    titleBn: "৪. তৃতীয় পক্ষের সেবা ও প্রমাণীকরণ",
    icon: ExternalLink,
  },
  {
    id: "cookies",
    titleEn: "5. Cookies & Local Storage",
    titleBn: "৫. কুকিজ ও লোকাল স্টোরেজ",
    icon: Cookie,
  },
  {
    id: "security",
    titleEn: "6. Data Security & Storage",
    titleBn: "৬. তথ্য নিরাপত্তা ও সুরক্ষা",
    icon: Lock,
  },
  {
    id: "rights",
    titleEn: "7. Your Rights & Control",
    titleBn: "৭. আপনার অধিকার ও নিয়ন্ত্রণ",
    icon: UserCheck,
  },
  {
    id: "changes",
    titleEn: "8. Changes to This Policy",
    titleBn: "৮. নীতিমালা পরিবর্তন",
    icon: FileText,
  },
  {
    id: "contact",
    titleEn: "9. Contact Us",
    titleBn: "৯. আমাদের সাথে যোগাযোগ",
    icon: Mail,
  },
]

export function PrivacyContent() {
  const { t, lang } = useLanguage()
  const isBn = lang === "bn"
  const [activeId, setActiveId] = useState<string>("overview")

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-background">
      {/* Decorative subtle background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -left-40 size-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Hero Header */}
      <header className="border-b border-border/60 bg-muted/20 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-6 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/" />}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span>{t("Back to Home", "হোমে ফিরে যান")}</span>
            </Button>
          </div>

          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  <ShieldCheck className="size-3.5" />
                  {t("Privacy & Data Protection", "গোপনীয়তা ও তথ্য সুরক্ষা")}
                </Badge>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {t("Last updated: October 2026", "সর্বশেষ পরিমার্জন: অক্টোবর ২০২৬")}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {t("Privacy Policy", "গোপনীয়তা নীতিমালা")}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {t(
                  "We value your trust and are committed to protecting the personal data of our members, students, instructors, and visitors.",
                  "আমরা আপনার আস্থার মর্যাদা রাখি এবং আমাদের সদস্য, শিক্ষার্থী, শিক্ষক ও পরিদর্শকদের ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা নিশ্চিতে অঙ্গীকারবদ্ধ।"
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("Security Standard", "নিরাপত্তা মানদণ্ড")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {t("TLS Encryption & Role-Based RBAC", "TLS এনক্রিপশন ও রোল-ভিত্তিক RBAC")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content & Sticky TOC */}
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("Table of Contents", "সুচিপত্র")}
              </div>
              <nav className="space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeId === section.id
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("size-3.5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{isBn ? section.titleBn : section.titleEn}</span>
                    </a>
                  )
                })}
              </nav>

              <Separator className="my-4" />

              <Card className="border-border/60 bg-muted/30 p-4 text-xs">
                <p className="font-semibold text-foreground">
                  {t("Questions about privacy?", "গোপনীয়তা নিয়ে কোনো প্রশ্ন আছে?")}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {t(
                    "You can reach out directly to the Society technical team anytime.",
                    "যেকোনো সময় সরাসরি সোসাইটির টেকনিক্যাল টিমের সাথে যোগাযোগ করতে পারেন।"
                  )}
                </p>
                <a
                  href="mailto:info@dpics.org"
                  className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Mail className="size-3" />
                  <span>info@dpics.org</span>
                </a>
              </Card>
            </div>
          </aside>

          {/* Policy Body */}
          <main className="space-y-12">
            {/* Section 1 */}
            <section id="overview" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "১. ভূমিকা ও অঙ্গীকার" : "1. Overview & Commitment"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "Dhaka Polytechnic Institute Computing Society (DPICS) is an educational, student-led computing organization affiliated with Dhaka Polytechnic Institute. We operate this web platform to empower polytechnic students through coding workshops, competitive programming, tech write-ups, and collaborative software projects.",
                  "ঢাকা পলিটেকনিক ইনস্টিটিউট কম্পিউটিং সোসাইটি (ডিপিআইসিএস) একটি শিক্ষার্থী-পরিচালিত শিক্ষামূলক কম্পিউটিং সংগঠন, যা ঢাকা পলিটেকনিক ইনস্টিটিউটের অধিভুক্ত। শিক্ষার্থীদের কোডিং কর্মশালা, প্রোগ্রামিং প্রতিযোগিতা, প্রযুক্তি প্রবন্ধ ও প্রজেক্টের মাধ্যমে দক্ষ করে তোলার উদ্দেশ্যে এই প্ল্যাটফর্মটি পরিচালিত হয়।"
                )}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "This Privacy Policy explains what information we collect when you use our website, join as a member, participate in workshops, or publish articles, and describes how that data is protected and handled with complete confidentiality and transparency.",
                  "এই গোপনীয়তা নীতিমালায় উল্লেখ করা হয়েছে যে আমাদের ওয়েবসাইট ব্যবহার করার সময়, সদস্যপদে নিবন্ধনকালে বা আর্টিকেলে অংশ নেওয়ার সময় আমরা কী তথ্য সংগ্রহ করি এবং সেগুলোর সুরক্ষা কীভাবে নিশ্চিত করি।"
                )}
              </p>
            </section>

            <Separator />

            {/* Section 2 */}
            <section id="information-collected" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Database className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "২. যে তথ্যগুলো আমরা সংগ্রহ করি" : "2. Information We Collect"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "We believe in data minimization. We only collect information essential for managing student membership, verifying campus identities, and delivering community platform services:",
                  "আমরা অপ্রয়োজনীয় তথ্য সংগ্রহ পরিহার করি। শুধুমাত্র শিক্ষার্থী সদস্যপদ ব্যবস্থাপনা, পলিটেকনিক পরিচয় যাচাই ও কমিউনিটি কার্যক্রমের জন্য প্রয়োজনীয় তথ্যই সংগ্রহ করা হয়:"
                )}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>{t("Account & Authentication Data", "অ্যাকাউন্ট ও অথেন্টিকেশন তথ্য")}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "Your full name, email address, and profile picture provided via Google or GitHub OAuth authentication.",
                      "গুগল বা গিটহাব ওঅ্যাথের মাধ্যমে প্রাপ্ত আপনার পূর্ণ নাম, ইমেইল ঠিকানা ও প্রোফাইল ছবি।"
                    )}
                  </p>
                </Card>

                <Card className="border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>{t("Student Academic Profile", "শিক্ষার্থী একাডেমিক তথ্য")}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "Student Roll number, Registration number, Technology/Department (e.g. Computer), Shift, and Academic Session for verifying DPI membership.",
                      "ডিপিআই সদস্যপদ যাচাইয়ের জন্য প্রয়োজনীয় রোল নম্বর, রেজিস্ট্রেশন নম্বর, বিভাগ/টেকনোলজি, শিফট এবং শিক্ষাবর্ষ।"
                    )}
                  </p>
                </Card>

                <Card className="border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>{t("Public Portfolio & Bio", "পাবলিক পোর্টফোলিও ও বায়ো")}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "Optional personal biography, technical skills tags, GitHub profile, LinkedIn URL, and portfolio links you choose to display on your member profile.",
                      "ঐচ্ছিক পরিচিতি বায়ো, টেকনিক্যাল স্কিল, গিটহাব ও লিংকডইন লিংক যা আপনি সদস্য প্রোফাইলে প্রদর্শন করতে পারেন।"
                    )}
                  </p>
                </Card>

                <Card className="border-border/60 bg-card/60 p-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>{t("Community Contributions", "কমিউনিটি কনটেন্ট ও প্রকাশনা")}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "Articles, tutorials, technical blogs, workshop submissions, and contest participations that you author and publish on the platform.",
                      "আপনার রচিত প্রযুক্তি ব্লগ, টিউটোরিয়াল, ওয়ার্কশপ আবেদন এবং প্রোগ্রামিং প্রতিযোগিতায় অংশগ্রহণের রেকর্ড।"
                    )}
                  </p>
                </Card>
              </div>
            </section>

            <Separator />

            {/* Section 3 */}
            <section id="usage" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Eye className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৩. তথ্য ব্যবহারের উদ্দেশ্য" : "3. How We Use Information"}
                </h2>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground sm:text-base">
                <li className="flex items-start gap-3">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">{t("Authentication & Security", "অথেন্টিকেশন ও নিরাপত্তা")}:</strong>{" "}
                    {t(
                      "To authenticate you securely, maintain your login sessions, and protect your account from unauthorized access.",
                      "সুরক্ষিতভাবে আপনাকে লগইন করানো, সেশন বজায় রাখা এবং অননুমোদিত অ্যাক্সেস থেকে অ্যাকাউন্ট রক্ষা করা।"
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">{t("Membership Verification", "সদস্যপদ যাচাইকরণ")}:</strong>{" "}
                    {t(
                      "To confirm student status at Dhaka Polytechnic Institute and grant appropriate privileges (member portal, executive committee roles).",
                      "ঢাকা পলিটেকনিক ইনস্টিটিউটের শিক্ষার্থী হিসেবে পরিচয় নিশ্চিত করা এবং নির্ধারিত সুবিধা ও দায়িত্ব প্রদান।"
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">{t("Event & Workshop Coordination", "ইভেন্ট ও ওয়ার্কশপ সমন্বয়")}:</strong>{" "}
                    {t(
                      "To register attendees, allocate laboratory seats, issue digital participation certificates, and organize competitive programming contests.",
                      "অংশগ্রহণকারীদের আসন বরাদ্দ, ডিজিটাল সার্টিফিকেট প্রদান এবং প্রতিযোগিতা সুষ্ঠুভাবে আয়োজন করা।"
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="text-foreground">{t("Author Attribution", "লেখক স্বীকৃতি")}:</strong>{" "}
                    {t(
                      "To credit authors with their name, photo, and bio when publishing technical tutorials and community articles.",
                      "ব্লগ বা টিউটোরিয়াল প্রকাশের সময় লেখকের নাম, ছবি এবং বায়ো প্রদর্শনের মাধ্যমে যথাযথ স্বীকৃতি দেওয়া।"
                    )}
                  </span>
                </li>
              </ul>
            </section>

            <Separator />

            {/* Section 4 */}
            <section id="third-party" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ExternalLink className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৪. তৃতীয় পক্ষের সেবা ও প্রমাণীকরণ" : "4. Third-Party Services & Authentication"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "We integrate only trusted, industry-standard third-party providers. We do not sell, rent, or trade your personal data with any advertisers or third-party marketing companies.",
                  "আমরা কেবল বিশ্বস্ত ও স্বীকৃত সেবা প্রদানকারীদের সাথে কাজ করি। আপনার কোনো ব্যক্তিগত তথ্য কোনো বিজ্ঞাপনী সংস্থা বা তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করা হয় না।"
                )}
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground text-sm">
                    {t("Google & GitHub OAuth", "গুগল ও গিটহাব ওঅ্যাথ")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      "Used exclusively for secure identity verification. We only request basic public profile information (name, email, avatar). We never request or have access to your passwords, private repositories, or personal Google drive files.",
                      "শুধুমাত্র সুরক্ষিত লগইনের জন্য ব্যবহৃত হয়। আমরা কেবল আপনার নাম, ইমেইল ও প্রোফাইল ছবি গ্রহণ করি। আমরা কখনো আপনার পাসওয়ার্ড বা ব্যক্তিগত তথ্যে অ্যাক্সেস করি না।"
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground text-sm">
                    {t("Database & Cloud Hosting (Neon & Vercel)", "ডাটাবেজ ও ক্লাউড হোস্টিং")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      "Our PostgreSQL database is hosted on secure, isolated cloud servers with automated encrypted backups and TLS connection requirements.",
                      "আমাদের ক্লাউড ডাটাবেজ সর্বাধুনিক এনক্রিপশন ও ব্যাকআপ ব্যবস্থার মাধ্যমে সুরক্ষিত।"
                    )}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 5 */}
            <section id="cookies" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cookie className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৫. কুকিজ ও লোকাল স্টোরেজ" : "5. Cookies & Local Storage"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "Our platform uses only strictly necessary cookies and local storage tokens for functionality:",
                  "আমাদের প্ল্যাটফর্মে কেবল অপরিহার্য কার্যকরী কুকিজ ও লোকাল স্টোরেজ ব্যবহার করা হয়:"
                )}
              </p>

              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-muted/40 font-semibold text-foreground">
                    <tr>
                      <th className="p-3">{t("Name", "নাম")}</th>
                      <th className="p-3">{t("Type", "ধরন")}</th>
                      <th className="p-3">{t("Purpose", "ব্যবহারের কারণ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-muted-foreground">
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">better-auth.session_token</td>
                      <td className="p-3">{t("Secure Cookie (HTTP-only)", "সিকিউর কুকি")}</td>
                      <td className="p-3">{t("Maintains user login session safely", "লগইন সেশন সচল রাখা")}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">lang</td>
                      <td className="p-3">{t("Preference Cookie", "পছন্দ কুকি")}</td>
                      <td className="p-3">{t("Stores your selected language (en / bn)", "নির্বাচিত ভাষা সংরক্ষণ")}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">theme</td>
                      <td className="p-3">{t("Local Storage", "লোকাল স্টোরেজ")}</td>
                      <td className="p-3">{t("Stores light or dark appearance mode", "ডার্ক বা লাইট থিম সংরক্ষণ")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <Separator />

            {/* Section 6 */}
            <section id="security" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৬. তথ্য নিরাপত্তা ও সুরক্ষা" : "6. Data Security & Storage"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "We adopt modern cybersecurity measures to protect your personal details against unauthorized access, modification, or disclosure:",
                  "অননুমোদিত অ্যাক্সেস বা তথ্য ফাঁস প্রতিরোধে আমরা আধুনিক সাইবার নিরাপত্তা নীতি অনুসরণ করি:"
                )}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/40 p-3.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{t("HTTPS / TLS Everywhere", "সর্বত্র HTTPS/TLS")}</strong>:{" "}
                    {t("All communication between your browser and our servers is strictly encrypted.", "ব্রাউজার ও সার্ভারের মধ্যকার সকল ডেটা আদান-প্রদান এনক্রিপ্টেড।")}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/40 p-3.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{t("Role-Based Access Control", "রোল-ভিত্তিক অ্যাক্সেস")}</strong>:{" "}
                    {t("Only verified system administrators and designated committee leads can access administrative dashboards.", "শুধুমাত্র অনুমোদিত অ্যাডমিন ও কমিটি পরিচালকরা নির্দিষ্ট ডেটা দেখতে পারেন।")}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Section 7 */}
            <section id="rights" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৭. আপনার অধিকার ও নিয়ন্ত্রণ" : "7. Your Rights & Control"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "As a member of DPICS, you retain full rights over your data:",
                  "ডিপিআইসিএস এর সদস্য হিসেবে আপনার তথ্যের ওপর আপনার পূর্ণ নিয়ন্ত্রণ রয়েছে:"
                )}
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground sm:text-base">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-foreground">{t("Profile Update", "প্রোফাইল পরিবর্তন")}:</strong>{" "}
                    {t(
                      "You can review and modify your biography, skills, and contact details anytime from your Profile Settings.",
                      "আপনার প্রোফাইল সেটিংস থেকে যেকোনো সময় আপনার তথ্য হালনাগাদ করতে পারেন।"
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    <strong className="text-foreground">{t("Data Deletion Request", "অ্যাকাউন্ট ও তথ্য মুছে ফেলা")}:</strong>{" "}
                    {t(
                      "You can request deletion of your account and personal profile data by contacting info@dpics.org.",
                      "আপনার অ্যাকাউন্ট বা ব্যক্তিগত তথ্য মুছে ফেলতে info@dpics.org ঠিকানায় যোগাযোগ করতে পারেন।"
                    )}
                  </span>
                </li>
              </ul>
            </section>

            <Separator />

            {/* Section 8 */}
            <section id="changes" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৮. নীতিমালা পরিবর্তন" : "8. Changes to This Policy"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "We may update our Privacy Policy periodically to reflect new features, workshops, or community offerings. Any updates will be posted here with an updated revision date. For substantial changes, notice will be highlighted on the platform banner.",
                  "সোসাইটির কার্যক্রম ও ফিচারের উন্নতির সাথে সাথে এই নীতিমালায় কোনো পরিমার্জন এলে তা এই পৃষ্ঠায় প্রকাশ করা হবে। বড় কোনো পরিবর্তনের ক্ষেত্রে ওয়েবসাইটে নোটিশের মাধ্যমে অবগত করা হবে।"
                )}
              </p>
            </section>

            <Separator />

            {/* Section 9 */}
            <section id="contact" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isBn ? "৯. আমাদের সাথে যোগাযোগ" : "9. Contact Us"}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(
                  "If you have any questions, concerns, or requests regarding this Privacy Policy or your data protection, please get in touch with us:",
                  "এই নীতিমালা বা তথ্যের নিরাপত্তা সংক্রান্ত যেকোনো প্রশ্ন থাকলে নির্দ্বিধায় আমাদের সাথে যোগাযোগ করুন:"
                )}
              </p>

              <Card className="border-border/60 bg-muted/20 p-5">
                <div className="space-y-2 text-sm text-foreground">
                  <p className="font-semibold text-base">DPI Computing Society</p>
                  <p className="text-muted-foreground">
                    Dhaka Polytechnic Institute, Tejgaon I/A, Dhaka-1208, Bangladesh
                  </p>
                  <p className="flex items-center gap-2 pt-1 text-sm text-primary">
                    <Mail className="size-4" />
                    <a href="mailto:info@dpics.org" className="underline hover:text-primary/80">
                      info@dpics.org
                    </a>
                  </p>
                </div>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
