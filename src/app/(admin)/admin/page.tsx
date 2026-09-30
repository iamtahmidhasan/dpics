import type { Metadata } from "next"
import { ArrowRight, ShieldCheck, UserCheck, Users, UserX, Wrench } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { getUserCounts } from "@/lib/services/user.service"

export const metadata: Metadata = {
  title: "Overview",
}

export default async function AdminOverviewPage() {
  const [counts, lang] = await Promise.all([getUserCounts(), getLang()])
  const t = makeT(lang)

  const stats = [
    {
      label: t("Total users", "মোট ব্যবহারকারী"),
      value: counts.total,
      icon: Users,
    },
    {
      label: t("Admins", "অ্যাডমিন"),
      value: counts.admins,
      icon: ShieldCheck,
    },
    {
      label: t("Members", "সদস্য"),
      value: counts.members,
      icon: UserCheck,
    },
    {
      label: t("Instructors", "শিক্ষক"),
      value: counts.instructors,
      icon: Wrench,
    },
    {
      label: t("Inactive", "নিষ্ক্রিয়"),
      value: counts.inactive,
      icon: UserX,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Overview", "ওভারভিউ")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Manage the society platform, members and permissions.",
            "সোসাইটি প্ল্যাটফর্ম, সদস্য ও permissions পরিচালনা করুন।"
          )}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <li key={label}>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-3.5" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Users", "ব্যবহারকারী")}</CardTitle>
          <CardDescription>
            {t(
              "Search, filter and review every registered account.",
              "সকল নিবন্ধিত অ্যাকাউন্ট খুঁজুন, ফিল্টার করুন এবং পর্যালোচনা করুন।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-xs/relaxed font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("Open user table", "ইউজার টেবিল খুলুন")}
            <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{t("Admin only", "শুধুমাত্র অ্যাডমিন")}</Badge>
        <Badge variant="muted">/admin</Badge>
        <Badge variant="muted">/api/admin/*</Badge>
      </div>
    </div>
  )
}
