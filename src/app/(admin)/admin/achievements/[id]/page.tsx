import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { AchievementComposer } from "@/components/achievements/achievement-composer"
import { AdminAchievementStatusSelect } from "@/components/admin/admin-achievement-status-select"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { getAchievementById } from "@/lib/services/achievement.service"
import { requireAdmin } from "@/lib/session"

type AdminAchievementDetailPageProps = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Achievement detail",
}

export default async function AdminAchievementDetailPage({
  params,
}: AdminAchievementDetailPageProps) {
  const { id } = await params
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  let achievement
  try {
    achievement = await getAchievementById(id)
  } catch {
    notFound()
  }

  const categories = await prisma.category.findMany({
    where: { type: "ACHIEVEMENT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  const initialValues = {
    title: achievement.title,
    titleBn: achievement.titleBn ?? "",
    slug: achievement.slug,
    organization: achievement.organization ?? "",
    organizationBn: achievement.organizationBn ?? "",
    eventDate: achievement.eventDate ? achievement.eventDate.split("T")[0] : "",
    certificateUrl: achievement.certificateUrl ?? "",
    excerpt: achievement.excerpt ?? "",
    excerptBn: achievement.excerptBn ?? "",
    content: achievement.content,
    contentBn: achievement.contentBn ?? "",
    coverImage: achievement.coverImage ?? "",
    images: achievement.images,
    categoryId: achievement.categoryId,
    tags: achievement.tags,
    isFeatured: achievement.isFeatured,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold">
            {t("Review & Edit Achievement", "অর্জন পর্যালোচনা ও সম্পাদনা")}
          </h1>
          <p className="text-xs/relaxed text-muted-foreground">
            {t(
              "Authored by",
              "লেখক:"
            )}{" "}
            <span className="font-semibold text-foreground">{achievement.author.name}</span>{" "}
            ({achievement.author.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminAchievementStatusSelect
            achievementId={achievement.id}
            initialStatus={achievement.status}
          />

          {achievement.status === PostStatus.PUBLISHED ? (
            <a
              href={`/achievements/${achievement.slug}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              {t("View live", "লাইভ দেখুন")}
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      </div>

      <AchievementComposer
        scope="admin"
        achievementId={achievement.id}
        initialValues={initialValues}
        initialCategories={categories}
        status={achievement.status}
        massageForAuthor={achievement.massageForAuthor}
        backHref="/admin/achievements"
      />
    </div>
  )
}
