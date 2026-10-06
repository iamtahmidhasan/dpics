"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface AboutStats {
  membersCount: number
  eventsCount: number
  coursesCount: number
  achievementsCount: number
}

export interface CommitteeLeaderItem {
  id: string
  name: string
  role: string
  avatar: string | null
  initials: string
}

export interface CommitteeData {
  committeeName: string
  committeeDescription: string | null
  members: CommitteeLeaderItem[]
}

interface AboutViewProps {
  stats: AboutStats
  committee?: CommitteeData | null
}

export function AboutView({ stats, committee }: AboutViewProps) {
  const { t } = useLanguage()

  const fallbackLeaders: CommitteeLeaderItem[] = [
    {
      id: "leader-1",
      name: "Engr. Advisor Panel",
      role: t("Chief Faculty Advisor", "প্রধান শিক্ষক উপদেষ্টা"),
      avatar: "/dpicslogo.png",
      initials: "FA",
    },
    {
      id: "leader-2",
      name: "Tahmid Hasan",
      role: t("President & Lead Architect", "সভাপতি ও প্রধান স্থপতি"),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      initials: "TH",
    },
    {
      id: "leader-3",
      name: "Sabbir Ahmed",
      role: t("General Secretary", "সাধারণ সম্পাদক"),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      initials: "SA",
    },
    {
      id: "leader-4",
      name: "Naimur Rahman",
      role: t("Competitive Programming Lead", "কম্পিটিটিভ প্রোগ্রামিং লিড"),
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      initials: "NR",
    },
    {
      id: "leader-5",
      name: "Farhana Akter",
      role: t("Web & Software Wing Lead", "ওয়েব ও সফটওয়্যার উইং লিড"),
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      initials: "FA",
    },
    {
      id: "leader-6",
      name: "Ariful Islam",
      role: t("IoT & Robotics Coordinator", "আইওটি ও রোবোটিক্স সমন্বয়ক"),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
      initials: "AI",
    },
    {
      id: "leader-7",
      name: "Mahfuzur Rahman",
      role: t("Event & Logistics Manager", "ইভেন্ট ও লজিস্টিকস ম্যানেজার"),
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
      initials: "MR",
    },
    {
      id: "leader-8",
      name: "Sumaiya Jahan",
      role: t("Community & Media Lead", "কমিউনিটি ও মিডিয়া লিড"),
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
      initials: "SJ",
    },
  ]

  const leaders = (committee?.members && committee.members.length > 0)
    ? committee.members
    : fallbackLeaders

  const pillars = [
    {
      title: t("Competitive Programming", "কম্পিটিটিভ প্রোগ্রামিং"),
      content: t(
        "Structured algorithm study circles, weekly problem solving sprints, and contest preparation for regional and national collegiate programming competitions.",
        "অ্যালগরিদম প্রশিক্ষণ, সাপ্তাহিক সমস্যা সমাধান সেশন এবং জাতীয় ও আঞ্চলিক প্রোগ্রামিং প্রতিযোগিতার প্রস্তুতি।"
      ),
    },
    {
      title: t("Modern Web & Software", "আধুনিক ওয়েব ও সফটওয়্যার"),
      content: t(
        "Hands-on full-stack development with Next.js, Node.js, PostgreSQL, Docker, Git version control, and production deployments.",
        "নেক্সট.জেএস, নোড.জেএস, ডেটাবেস, গিট এবং ক্লাউড আর্কিটেকচার দিয়ে বাস্তবমুখী সফটওয়্যার ও ওয়েব অ্যাপ্লিকেশন তৈরি।"
      ),
    },
    {
      title: t("Peer Mentorship & Community", "সহপাঠী মেন্টরশিপ ও কমিউনিটি"),
      content: t(
        "A warm collaborative space uniting students across all polytechnic departments and semesters to build portfolio projects together.",
        "সকল সেমিস্টার ও প্রকৌশল বিভাগের শিক্ষার্থীদের একটি উন্মুক্ত প্ল্যাটফর্ম যেখানে দলগতভাবে শেখা ও প্রজেক্ট তৈরি করা হয়।"
      ),
    },
  ]

  return (
    <div className="flex w-full flex-col">
      {/* 1. About29 Block: Hero, Photo Grid, Mission Statement & 3 Pillars */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-12 lg:gap-20">
            {/* Header Titles */}
            <div className="flex flex-col gap-4 lg:gap-6">
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tighter text-foreground sm:text-5xl lg:text-7xl">
                {t("About DPI Computing Society", "ডিপিআই কম্পিউটিং সোসাইটি পরিচিতি")}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
                {t(
                  "We are the student-led computing and technology community of Dhaka Polytechnic Institute. We build practical software, practice competitive programming, and empower the next generation of engineers.",
                  "আমরা ঢাকা পলিটেকনিক ইনস্টিটিউটের শিক্ষার্থী-পরিচালিত প্রযুক্তি সংগঠন। আমরা বাস্তব সফটওয়্যার তৈরি করি, প্রোগ্রামিং চর্চা করি এবং ভবিষ্যৎ প্রকৌশলীদের গড়ে তুলি।"
                )}
              </p>
            </div>

            {/* Visual Grid: Local Image + Mission Box */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-muted">
                <Image
                  src="/hackathon.jpg"
                  alt="DPI Computing Society community workshop"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div
                className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-2xl bg-muted bg-cover bg-center p-8 sm:p-10"
                style={{ backgroundImage: `url('/hero-tech.jpg')` }}
              >
                <div className="absolute inset-0 bg-foreground/60 backdrop-blur-[2px]" />
                <div className="relative flex h-full flex-col justify-between gap-8 text-primary-foreground">
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary-foreground/90">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    {t("Our Mission", "আমাদের মূল লক্ষ্য")}
                  </p>
                  <p className="text-base sm:text-xl font-medium leading-relaxed">
                    {t(
                      "To bridge classroom theory and industry reality for every polytechnic student — creating world-class software engineers, competitive problem solvers, and innovators.",
                      "শ্রেণিকক্ষের তাত্ত্বিক শিক্ষার সাথে প্রযুক্তি শিল্পের সেতুবন্ধন তৈরি করা — যাতে প্রতিটি ডিপ্লোমা শিক্ষার্থী আত্মবিশ্বাসের সাথে দেশ ও বিশ্বের দরবারে নিজেদের মেধার প্রমাণ রাখতে পারে।"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Values & 3-Column Pillars */}
            <div className="flex flex-col gap-8 lg:gap-12">
              <div className="flex max-w-2xl flex-col gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-5xl">
                  {t("Code. Build. Grow Together.", "কোড করুন। তৈরি করুন। একসাথে এগিয়ে যান।")}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t(
                    "Founded by passionate students, DPICS is built on clarity of purpose, hands-on engineering, and generous peer-to-peer mentorship across all diploma batches.",
                    "উদ্যমী শিক্ষার্থীদের দ্বারা প্রতিষ্ঠিত ডিপিসিএস বাস্তবধর্মী জ্ঞানচর্চা এবং পরস্পরের সহযোগিতায় বিশ্বাসী।"
                  )}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3 md:gap-10">
                {pillars.map((pillar, i) => (
                  <div key={i} className="flex flex-col gap-2.5 border-t border-border pt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">{pillar.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{pillar.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Team56 Block: Leadership & Team (#team) */}
      <section id="team" className="border-t border-border/80 bg-muted/30 py-16 md:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-10 lg:gap-14">
            <div className="flex flex-col gap-3">
              <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {committee?.committeeName
                  ? `${committee.committeeName} — ${t("Leadership Panel", "নেতৃত্ব প্যানেল")}`
                  : t("Leadership & Executive Panel", "কার্যনির্বাহী প্যানেল ও নেতৃত্ব")}
              </h2>
              <p className="max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                {committee?.committeeDescription ||
                  t(
                    "Meet the student leaders, wing coordinators, and faculty advisors driving the society forward.",
                    "আমাদের নিবেদিতপ্রাণ শিক্ষার্থী সমন্বয়ক এবং শ্রদ্ধেয় শিক্ষক উপদেষ্টাবৃন্দ।"
                  )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {leaders.map((member) => (
                <Card
                  key={member.id}
                  className="items-center border-0 bg-card text-center shadow-none ring-1 ring-border/80"
                >
                  <CardContent className="flex flex-col items-center gap-3 p-6">
                    <Avatar className="size-16 sm:size-20 border border-border">
                      <AvatarImage src={member.avatar || undefined} alt={member.name} />
                      <AvatarFallback className="font-semibold text-sm">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium text-sm text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/committee" />}>
                <span>{t("Full Committee Details", "পূর্ণাঙ্গ কমিটি তালিকা")}</span>
                <ArrowRight className="size-3.5" />
              </Button>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/members" />}>
                <span>{t("Browse All Members", "সকল সদস্যের তালিকা")}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats8 Block: Big Performance Insights */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold md:text-4xl text-foreground">
              {t("Community Impact & Growth", "কমিউনিটির অগ্রগতি ও প্রভাব")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              {t(
                "Ensuring active learning, high participation, and continuous skill advancement across Dhaka Polytechnic Institute.",
                "নিয়মিত সেশন, ওয়ার্কশপ এবং প্রতিভার বিকাশ ঘটিয়ে ডিপিআই শিক্ষার্থীদের এগিয়ে নিয়ে যাওয়া।"
              )}
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline mt-1"
            >
              <span>{t("Explore all hosted events & workshops", "অনুষ্ঠিত সকল ইভেন্ট ও ওয়ার্কশপ দেখুন")}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: "stat-1",
                value: `${Math.max(stats.membersCount, 250)}+`,
                label: t("Active registered student members", "নিবন্ধিত সক্রিয় শিক্ষার্থী সদস্য"),
              },
              {
                id: "stat-2",
                value: `${Math.max(stats.eventsCount, 30)}+`,
                label: t("Workshops, bootcamps & contests hosted", "আয়োজিত কর্মশালা, বুটক্যাম্প ও প্রতিযোগিতা"),
              },
              {
                id: "stat-3",
                value: `${Math.max(stats.coursesCount, 8)}+`,
                label: t("Hands-on curriculum tracks & courses", "বাস্তবধর্মী লার্নিং ট্র্যাক ও কোর্স"),
              },
              {
                id: "stat-4",
                value: `${Math.max(stats.achievementsCount, 40)}+`,
                label: t("Student awards & competitive milestones", "শিক্ষার্থীদের প্রতিযোগিতা সাফল্য ও স্বীকৃতি"),
              },
            ].map((stat) => (
              <div key={stat.id} className="flex flex-col gap-2">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Membership Block (#membership) */}
      <section id="membership" className="border-t border-border/80 bg-muted/20 py-16 md:py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold md:text-3xl text-foreground">
              {t("Membership Tiers", "সদস্যপদ ও ক্যাটাগরি")}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              {t(
                "Open to all students of Dhaka Polytechnic Institute. Choose your path to get involved.",
                "ঢাকা পলিটেকনিকের সকল শিক্ষার্থীর জন্য উন্মুক্ত। আপনার প্রয়োজনীয় ক্যাটাগরি বেছে নিন।"
              )}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* General Member */}
            <Card className="bg-card p-6 flex flex-col justify-between border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {t("Tier 1", "স্তর ১")}
                  </Badge>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {t("Free", "বিনামূল্যে")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t("General Member", "সাধারণ সদস্য")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Available to any student registering an account.", "ওয়েবসাইটে ফ্রি অ্যাকাউন্ট তৈরি করা যেকোনো শিক্ষার্থীর জন্য।")}
                  </p>
                </div>

                <Separator />

                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    <span>{t("Attend public workshops & seminars", "উন্মুক্ত কর্মশালা ও সেমিনারে অংশগ্রহণ")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    <span>{t("Access free digital courses and tutorials", "ফ্রি কোর্স ও টিউটোরিয়ালে প্রবেশাধিকার")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    <span>{t("Community discussion & updates", "কমিউনিটি নোটিশ ও আপডেট")}</span>
                  </li>
                </ul>
              </div>

              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/join" />} className="mt-6 w-full text-xs">
                {t("Register Account", "নিবন্ধন করুন")}
              </Button>
            </Card>

            {/* Verified Member */}
            <Card className="bg-card p-6 flex flex-col justify-between border-primary/50 ring-1 ring-primary/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    {t("Recommended", "প্রস্তাবিত")}
                  </Badge>
                  <span className="text-xs font-bold text-primary">
                    {t("Verified Badge", "যাচাইকৃত ব্যাজ")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t("Verified Student Member", "যাচাইকৃত শিক্ষার্থী সদস্য")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("For enrolled DPI students who verify their roll and department in profile.", "প্রোফাইলে ডিপিআই রোল, শিফট ও বিভাগ যাচাইকৃত শিক্ষার্থী।")}
                  </p>
                </div>

                <Separator />

                <ul className="space-y-2.5 text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>{t("Verified student badge on profile", "প্রোফাইলে অফিসিয়াল ভেরিফাইড ব্যাজ")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>{t("Certificates for workshops & contests", "কর্মশালা ও প্রতিযোগিতার অফিসিয়াল সনদ")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>{t("Publish posts & tutorial write-ups", "ব্লগ ও টিউটোরিয়াল প্রকাশ করার সুযোগ")}</span>
                  </li>
                </ul>
              </div>

              <Button size="sm" nativeButton={false} render={<Link href="/profile/member" />} className="mt-6 w-full text-xs font-semibold">
                {t("Verify Profile", "প্রোফাইল যাচাই করুন")}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Cta10 Block: Simple Call to Action */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex w-full flex-col gap-8 overflow-hidden rounded-2xl bg-muted/60 border border-border p-8 md:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                {t("Ready to Level Up Your Skills?", "আপনার প্রযুক্তি দক্ষতা বাড়াতে প্রস্তুত?")}
              </h2>
              <p className="max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t(
                  "Join Dhaka Polytechnic Institute Computing Society today. Learn from seniors, build real projects, and compete together.",
                  "আজই যুক্ত হোন ডিপিআই কম্পিউটিং সোসাইটিতে। বন্ধুদের সাথে শিখুন, তৈরি করুন বাস্তব প্রজেক্ট এবং এগিয়ে যান আত্মবিশ্বাসে।"
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button size="lg" nativeButton={false} render={<Link href="/join" />} className="font-semibold">
                <span>{t("Join Society", "সোসাইটিতে যোগ দিন")}</span>
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/contact" />}>
                <span>{t("Contact Us", "যোগাযোগ করুন")}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
