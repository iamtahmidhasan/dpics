import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, Code2, FileText, Map, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { websiteMetadata } from "@/lib/seo"

const DESCRIPTION =
  "Curated roadmaps, session notes, and problem archives for DPI Computing Society members — learn structured tracks alongside the community."

export const metadata: Metadata = websiteMetadata({
  title: "Resources | DPI Computing Society",
  description: DESCRIPTION,
  path: "/resources",
})

export default async function ResourcesPage() {
  const lang = await getLang()
  const t = makeT(lang)

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8 space-y-12">
      {/* Hero */}
      <header className="space-y-3">
        <Badge
          variant="outline"
          className="gap-1.5 border-primary/30 bg-primary/10 text-primary text-xs"
        >
          {t("Learn with us", "আমাদের সাথে শিখুন")}
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("Member Resources", "সদস্যদের রিসোর্স")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t(
            "Curated roadmaps, notes, slides, and problem archives from our sessions — available to every member, and a taste of them for everyone else.",
            "আমাদের সেশন থেকে সাজানো রোডম্যাপ, নোট, স্লাইড ও সমস্যার আর্কাইভ — প্রতিটি সদস্যের জন্য উন্মুক্ত, এবং বাকিদের জন্য একটি ঝলক।"
          )}
        </p>
      </header>

      {/* Roadmaps */}
      <section id="roadmaps" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <Map className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("Learning Roadmaps", "শেখার রোডম্যাপ")}
          </h2>
        </div>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(
                "Step-by-step paths through web development, competitive programming, and modern engineering skills — start with a course and follow the track to the end.",
                "ওয়েব ডেভেলপমেন্ট, কম্পিটিটিভ প্রোগ্রামিং ও আধুনিক ইঞ্জিনিয়ারিং দক্ষতার ধাপে ধাপে পথনির্দেশনা — একটি কোর্স দিয়ে শুরু করুন এবং ট্র্যাকটি শেষ পর্যন্ত অনুসরণ করুন।"
              )}
            </p>
            <Link
              href="/courses"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <BookOpen className="size-4" />
              {t("Explore DPICS Academy courses", "ডিপিসিএস অ্যাকাডেমির কোর্স দেখুন")}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Notes */}
      <section id="notes" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("Notes & Session Slides", "নোট ও সেশন স্লাইড")}
          </h2>
        </div>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(
                "Write-ups, tutorials, and slides from workshops and bootcamps — published on the blog so anyone can read them, and members get them first.",
                "ওয়ার্কশপ ও বুটক্যাম্পের লেখা, টিউটোরিয়াল ও স্লাইড — ব্লগে প্রকাশিত, যাতে যে কেউ পড়তে পারে এবং সদস্যরা সবার আগে পায়।"
              )}
            </p>
            <Link
              href="/posts"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <BookOpen className="size-4" />
              {t("Read the blog", "ব্লগ পড়ুন")}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Problems */}
      <section id="problems" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("Problem Archives", "সমস্যার আর্কাইভ")}
          </h2>
        </div>
        <Card className="border-border/60 shadow-xs">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(
                "Practice problems from past code sprints, contests, and hackathons — replay the events, then sharpen up with the competitive programming track.",
                "অতীত কোড স্প্রিন্ট, প্রতিযোগিতা ও হ্যাকাথনের অনুশীলনী — ইভেন্টগুলো দেখে নিন, তারপর কম্পিটিটিভ প্রোগ্রামিং ট্র্যাক দিয়ে দক্ষতা বাড়ান।"
              )}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href="/events?timeframe=past"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Trophy className="size-4" />
                {t("Past contests & events", "অতীত প্রতিযোগিতা ও ইভেন্ট")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/courses"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <BookOpen className="size-4" />
                {t("Competitive programming course", "কম্পিটিটিভ প্রোগ্রামিং কোর্স")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Member access */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("Member access", "সদস্যদের জন্য")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              "Sign in to unlock the full archives, enrolled courses, and everything else behind your dashboard.",
              "সম্পূর্ণ আর্কাইভ, ভর্তি করা কোর্স ও ড্যাশবোর্ডের সবকিছু আনলক করতে সাইন ইন করুন।"
            )}
          </p>
          <Link
            href="/join"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t("Sign in to DPICS", "ডিপিসিএসে সাইন ইন")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
