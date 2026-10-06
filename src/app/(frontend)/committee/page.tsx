import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import {
  getActiveCommitteeForAbout,
  listCommittees,
  type AboutLeader,
} from "@/lib/services/committee.service"
import { websiteMetadata } from "@/lib/seo"
import { cn } from "cn"

const DESCRIPTION =
  "Meet the executive committee of DPI Computing Society — the students and mentors who plan our workshops, competitions, and community programs."

export const metadata: Metadata = websiteMetadata({
  title: "Committee",
  description: DESCRIPTION,
  path: "/committee",
})

export default async function CommitteePage() {
  const [lang, activeCommittee, committees] = await Promise.all([
    getLang(),
    getActiveCommitteeForAbout(),
    listCommittees(),
  ])
  const t = makeT(lang)

  // Keep role order from the service and group members under each role.
  const roleGroups: { role: string; members: AboutLeader[] }[] = []
  for (const member of activeCommittee?.members ?? []) {
    const existing = roleGroups.find((group) => group.role === member.role)
    if (existing) {
      existing.members.push(member)
    } else {
      roleGroups.push({ role: member.role, members: [member] })
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <Badge
          variant="outline"
          className="gap-1.5 border-primary/30 bg-primary/10 text-primary text-xs"
        >
          {t("Leadership", "নেতৃত্ব")}
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("Executive Committee", "কার্যনির্বাহী কমিটি")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t(
            "The committee plans our workshops, competitions, mentorship programs, and everything DPICS runs across the semester.",
            "কমিটি আমাদের ওয়ার্কশপ, প্রতিযোগিতা, মেন্টরশিপ প্রোগ্রামসহ ডিপিসিএসের সকল কার্যক্রম পরিকল্পনা করে।"
          )}
        </p>
      </header>

      {/* Active committee */}
      {activeCommittee && roleGroups.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {activeCommittee.committeeName}
            </h2>
            {activeCommittee.committeeDescription ? (
              <p className="text-sm text-muted-foreground">
                {activeCommittee.committeeDescription}
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            {roleGroups.map((group) => (
              <div key={group.role} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {group.role}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.members.map((member) => (
                    <Card key={member.id} className="border-border/60 shadow-xs">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar className="size-11">
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {t(
              "The new committee hasn't been announced yet. Check back soon — or meet the society on the About page.",
              "নতুন কমিটির ঘোষণা এখনো হয়নি। শীঘ্রই দেখুন — অথবা পরিচিতি পৃষ্ঠায় সোসাইটির সাথে পরিচিত হোন।"
            )}
          </CardContent>
        </Card>
      )}

      {/* Committee records (current + past) */}
      {committees.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("Committee Records", "কমিটির তালিকা")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {committees.map((committee) => (
              <Card key={committee.id} className="border-border/60 shadow-xs">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {committee.name}
                    </p>
                    {committee.isActive ? (
                      <Badge className="shrink-0 text-[10px]">
                        {t("Active", "সক্রিয়")}
                      </Badge>
                    ) : null}
                  </div>
                  {committee.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {committee.description}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">
                    {t(
                      `${committee.membersCount} members · ${committee.rolesCount} roles`,
                      `${committee.membersCount} সদস্য · ${committee.rolesCount} ভূমিকা`
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link href="/about" className={cn(buttonVariants({ size: "sm" }))}>
          {t("About the society", "সোসাইটি পরিচিতি")}
        </Link>
        <Link
          href="/join"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("Join DPICS", "ডিপিসিএসে যোগ দিন")}
        </Link>
      </div>
    </div>
  )
}
