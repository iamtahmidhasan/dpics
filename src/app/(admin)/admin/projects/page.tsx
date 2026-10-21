import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { AdminProjectsTable } from "@/components/admin/admin-projects-table"
import { buttonVariants } from "@/components/ui/button"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireAdmin } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

export const metadata: Metadata = {
  title: "Projects & Portfolios | Admin Panel",
}

export default async function AdminProjectsPage() {
  const [lang] = await Promise.all([getLang(), requireAdmin()])
  const t = makeT(lang)

  const initialData = await ProjectService.listAdminProjects({
    page: 1,
    pageSize: 20,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold">
            {t("Student Projects & Portfolios", "শিক্ষার্থীদের প্রজেক্ট ও পোর্টফোলিও")}
          </h1>
          <p className="text-xs/relaxed text-muted-foreground">
            {t(
              "Review, approve, and curate student hardware, software, and robotics projects.",
              "শিক্ষার্থীদের তৈরি সফটওয়্যার ও হার্ডওয়্যার প্রজেক্টসমূহ পর্যালোচনা ও অনুমোদন করুন।"
            )}
          </p>
        </div>

        <Link
          href="/admin/projects/new"
          className={buttonVariants({ size: "sm", className: "gap-1.5" })}
        >
          <Plus className="size-4" />
          <span>{t("New Project", "নতুন প্রজেক্ট")}</span>
        </Link>
      </div>

      <AdminProjectsTable initialData={initialData} />
    </div>
  )
}
