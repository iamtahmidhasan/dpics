import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ExternalLink, Lock, ShieldAlert } from "lucide-react"

import { ProjectComposerForm } from "@/components/projects/project-composer-form"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PostStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import prisma from "@/lib/prisma"
import { isAdmin, requireProjectCreator } from "@/lib/session"
import type { TeamMember } from "@/lib/services/project.service"

type EditProjectPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    select: { title: true },
  })

  return {
    title: project ? `Edit ${project.title} | DPI Computing Society` : "Edit Project",
  }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  const [session, lang] = await Promise.all([requireProjectCreator(), getLang()])
  const t = makeT(lang)

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, nameBn: true, slug: true } },
    },
  })

  if (!project) {
    notFound()
  }

  const isAdminUser = isAdmin(session.user)

  // Verify authorship
  if (!isAdminUser && project.authorId !== session.user.id) {
    redirect("/profile/projects")
  }

  // Enforce approved project immutability for profile page
  const isApproved = project.status === PostStatus.PUBLISHED

  if (isApproved && !isAdminUser) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Link
            href="/profile/projects"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            {t("Back to My Projects", "আমার প্রজেক্ট তালিকায় ফিরুন")}
          </Link>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <Lock className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold text-foreground">
                {t(
                  "This Project is Approved & Published (Locked)",
                  "এই প্রজেক্টটি অনুমোদিত ও প্রকাশিত (লক করা)"
                )}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  `"${project.title}" has been reviewed, approved, and published in the society's official project directory. As per community security guidelines, once a project is approved, it cannot be modified or deleted from the student profile page.`,
                  `"${project.title}" সোসাইটির অ্যাডমিন কর্তৃক পর্যালোচিত, অনুমোদিত ও প্রজেক্ট প্রদর্শনীতে প্রকাশিত হয়েছে। প্রাতিষ্ঠানিক নিয়ম অনুযায়ী অনুমোদিত প্রজেক্ট প্রোফাইল পেজ থেকে এডিট বা ডিলিট করা যায় না।`
                )}
              </p>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {t(
                  "Only Admins and Super Admins can edit or delete this project from the Admin Panel. If you need any corrections, please contact a society administrator.",
                  "শুধুমাত্র অ্যাডমিন ও সুপার অ্যাডমিনরা অ্যাডমিন প্যানেল থেকে এই প্রজেক্ট সম্পাদনা বা মুছে ফেলতে পারবেন। কোনো সংশোধনের প্রয়োজন হলে অ্যাডমিনদের সাথে যোগাযোগ করুন।"
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-amber-500/20">
            <Link
              href={`/projects/${project.slug}`}
              className={buttonVariants({ size: "sm", className: "gap-1.5" })}
            >
              <span>{t("View Public Showcase", "পাবলিক প্রদর্শনী দেখুন")}</span>
              <ExternalLink className="size-3.5" />
            </Link>
            <Link
              href="/profile/projects"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("Return to My Projects", "প্রজেক্ট তালিকায় ফিরে যান")}
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Pre-load active project categories
  const categories = await prisma.category.findMany({
    where: { type: "PROJECT", isActive: true },
    select: { id: true, name: true, nameBn: true, slug: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <ProjectComposerForm
        scope="author"
        projectId={project.id}
        status={project.status}
        massageForAuthor={project.massageForAuthor}
        initialCategories={categories}
        initialValues={{
          title: project.title,
          titleBn: project.titleBn ?? "",
          slug: project.slug,
          categoryId: project.categoryId ?? project.category?.id ?? null,
          excerpt: project.excerpt ?? "",
          excerptBn: project.excerptBn ?? "",
          description: project.description,
          descriptionBn: project.descriptionBn ?? "",
          coverImage: project.coverImage ?? "",
          images: project.images ?? [],
          liveUrl: project.liveUrl ?? "",
          githubUrl: project.githubUrl ?? "",
          youtubeUrl: project.youtubeUrl ?? "",
          techStack: project.techStack ?? [],
          tags: project.tags ?? [],
          teamMembers: (project.teamMembers as unknown as TeamMember[]) ?? [],
          isFeatured: project.isFeatured ?? false,
        }}
        backHref="/profile/projects"
      />
    </div>
  )
}
