import type { Metadata } from "next"

import { ProjectComposerForm } from "@/components/projects/project-composer-form"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "New Project | Admin Panel",
}

export default async function AdminNewProjectPage() {
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  // Pre-load project categories
  const categories = await prisma.category.findMany({
    where: { type: "PROJECT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-4">
      <ProjectComposerForm
        scope="admin"
        initialCategories={categories}
        backHref="/admin/projects"
      />
    </div>
  )
}
