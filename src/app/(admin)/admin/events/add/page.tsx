import type { Metadata } from "next"

import { AdminEventForm } from "@/components/admin/admin-event-form"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "New Event",
}

export default async function AdminNewEventPage() {
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  const categories = await prisma.category.findMany({
    where: { type: "EVENT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Create New Event", "নতুন ইভেন্ট তৈরি করুন")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Schedule a new bootcamp, workshop, or hackathon with registrations and ticketing.",
            "রেজিস্ট্রেশন ও টিকেটিংসহ নতুন বুটক্যাম্প, ওয়ার্কশপ বা হ্যাকাথন তৈরি করুন।"
          )}
        </p>
      </div>

      <AdminEventForm categories={categories} />
    </div>
  )
}
