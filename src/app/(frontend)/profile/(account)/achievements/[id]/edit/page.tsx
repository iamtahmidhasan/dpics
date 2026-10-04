import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AchievementComposer } from "@/components/achievements/achievement-composer"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { getAchievementById } from "@/lib/services/achievement.service"
import { requireAchievementCreator } from "@/lib/session"
import { isAdmin } from "@/lib/roles"

type EditAchievementPageProps = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Edit achievement",
}

export default async function EditAchievementPage({
  params,
}: EditAchievementPageProps) {
  const { id } = await params
  const [session, lang] = await Promise.all([
    requireAchievementCreator(),
    getLang(),
  ])
  const t = makeT(lang)

  let achievement
  try {
    achievement = await getAchievementById(id)
  } catch {
    notFound()
  }

  // Author can only edit their own achievement unless admin
  if (!isAdmin(session.user) && achievement.author.id !== session.user.id) {
    notFound()
  }

  // Pre-load categories
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">
          {t("Edit Achievement", "অর্জন সম্পাদনা করুন")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t(
            "Update your submission and submit it for review.",
            "আপনার জমাদানকৃত তথ্য আপডেট করুন এবং পর্যালোচনার জন্য জমা দিন।"
          )}
        </p>
      </div>

      <AchievementComposer
        scope="author"
        achievementId={achievement.id}
        initialValues={initialValues}
        initialCategories={categories}
        status={achievement.status}
        massageForAuthor={achievement.massageForAuthor}
        locked={!isAdmin(session.user) && achievement.status === "PUBLISHED"}
        backHref="/profile/achievements"
      />
    </div>
  )
}
