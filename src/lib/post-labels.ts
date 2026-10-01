import type { VariantProps } from "class-variance-authority"

import { PostStatus } from "@/generated/prisma/enums"
import type { badgeVariants } from "@/components/ui/badge"
import type { LocalizedText, TFn } from "@/lib/i18n"
import { humanize } from "@/lib/profile-labels"

type BadgeVariants = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

const POST_STATUS_LABELS: Record<PostStatus, LocalizedText> = {
  [PostStatus.DRAFT]: { en: "Draft", bn: "খসড়া" },
  [PostStatus.PENDING]: { en: "Pending review", bn: "পর্যালোচনার অপেক্ষায়" },
  [PostStatus.PUBLISHED]: { en: "Published", bn: "প্রকাশিত" },
  [PostStatus.REJECTED]: { en: "Changes requested", bn: "পরিবর্তন প্রয়োজন" },
  [PostStatus.ARCHIVED]: { en: "Archived", bn: "আর্কাইভ" },
}

export function postStatusLabel(t: TFn): (value: PostStatus) => string {
  return (value) => {
    const label = POST_STATUS_LABELS[value]

    return label ? t(label) : humanize(value)
  }
}

export function categoryLabel(
  category: { name: string; nameBn?: string | null } | null | undefined,
  lang: string
): string {
  if (!category) return ""
  return lang === "bn" && category.nameBn ? category.nameBn : category.name
}

export function postCategoryLabel(
  t: TFn
): (category: { name: string; nameBn?: string | null } | string | null | undefined) => string {
  return (cat) => {
    if (!cat) return ""
    if (typeof cat === "string") return cat
    return cat.nameBn ? t(cat.name, cat.nameBn) : cat.name
  }
}

/** Maps a workflow state onto the existing `Badge` variants. */
export function postStatusBadgeVariant(value: PostStatus): BadgeVariants {
  switch (value) {
    case PostStatus.PUBLISHED:
      return "success"
    case PostStatus.PENDING:
      return "warning"
    case PostStatus.REJECTED:
      return "destructive"
    case PostStatus.ARCHIVED:
      return "muted"
    default:
      return "secondary"
  }
}