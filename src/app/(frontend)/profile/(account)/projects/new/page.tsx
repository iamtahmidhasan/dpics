import type { Metadata } from "next"

import { ProjectComposerForm } from "@/components/projects/project-composer-form"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { requireProjectCreator } from "@/lib/session"

export const metadata: Metadata = {
  title: "Submit New Project | DPI Computing Society",
}

export default async function NewProjectPage() {
  const [lang] = await Promise.all([getLang(), requireProjectCreator()])
  const t = makeT(lang)

  // Pre-load project categories
  const categories = await prisma.category.findMany({
    where: { type: "PROJECT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <ProjectComposerForm
        scope="author"
        initialCategories={categories}
        backHref="/profile/projects"
      />
    </div>
  )
}
