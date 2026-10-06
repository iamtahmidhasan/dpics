import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminEventForm } from "@/components/admin/admin-event-form"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { getEventById } from "@/lib/services/event.service"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Edit Event",
}

export default async function AdminEditEventPage({ params }: Props) {
  const { id } = await params
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  let event
  try {
    event = await getEventById(id)
  } catch {
    notFound()
  }

  const categories = await prisma.category.findMany({
    where: { type: "EVENT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Edit Event", "ইভেন্ট সম্পাদনা করুন")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {event.title}
        </p>
      </div>

      <AdminEventForm initialEvent={event} categories={categories} />
    </div>
  )
}
