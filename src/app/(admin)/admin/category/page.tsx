import type { Metadata } from "next"

import { AdminCategoryManager } from "@/components/admin/admin-category-manager"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { listCategories } from "@/lib/services/category.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Categories",
}

export default async function AdminCategoryPage() {
  await requireAdmin()

  const [lang, categories] = await Promise.all([
    getLang(),
    listCategories(),
  ])
  const t = makeT(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-lg font-semibold">
          {t("Categories", "ক্যাটাগরি")}
        </h1>
        <p className="text-xs/relaxed text-muted-foreground">
          {t(
            "Manage categories for posts, achievements, projects, events, and future modules.",
            "পোস্ট, অর্জন, প্রজেক্ট, ইভেন্ট এবং ভবিষ্যৎ মডিউলের জন্য ক্যাটাগরি পরিচালনা করুন।"
          )}
        </p>
      </div>

      <AdminCategoryManager initialCategories={categories} />
    </div>
  )
}
