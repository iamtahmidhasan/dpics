import type { Metadata } from "next"
import Link from "next/link"
import { FolderGit2, Plus } from "lucide-react"

import { UserProjectsList } from "@/components/projects/user-projects-list"
import { buttonVariants } from "@/components/ui/button"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { requireProjectCreator } from "@/lib/session"
import { ProjectService } from "@/lib/services/project.service"

export const metadata: Metadata = {
  title: "My Projects | DPI Computing Society",
}

export default async function MyProjectsPage() {
  const [session, lang] = await Promise.all([requireProjectCreator(), getLang()])
  const t = makeT(lang)

  const projects = await ProjectService.listUserProjects(session.user.id)

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderGit2 className="size-5 text-primary" />
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {t("My Projects & Portfolios", "আমার প্রজেক্ট ও পোর্টফোলিও")}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "Manage your student hardware, web, robotics, and software project submissions.",
              "আপনার তৈরি প্রজেক্টসমূহের স্ট্যাটাস দেখুন ও নতুন প্রজেক্ট প্রদর্শনীতে জমা দিন।"
            )}
          </p>
        </div>

        <Link
          href="/profile/projects/new"
          className={buttonVariants({ size: "sm", className: "gap-1.5" })}
        >
          <Plus className="size-4" />
          <span>{t("Submit Project", "প্রজেক্ট জমা দিন")}</span>
        </Link>
      </div>

      {/* Interactive Projects List with Approval Lock & Actions */}
      <UserProjectsList initialProjects={projects} />
    </div>
  )
}

