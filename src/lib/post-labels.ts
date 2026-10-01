import type { VariantProps } from "class-variance-authority"

import { PostCategory, PostStatus } from "@/generated/prisma/enums"
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

const POST_CATEGORY_LABELS: Record<PostCategory, LocalizedText> = {
  [PostCategory.ANNOUNCEMENT]: { en: "Announcement", bn: "ঘোষণা" },
  [PostCategory.TUTORIAL]: { en: "Tutorial", bn: "টিউটোরিয়াল" },
  [PostCategory.WORKSHOP]: { en: "Workshop", bn: "ওয়ার্কশপ" },
  [PostCategory.EVENT_RECAP]: { en: "Event recap", bn: "ইভেন্ট রিক্যাপ" },
  [PostCategory.TECHNICAL]: { en: "Technical", bn: "টেকনিক্যাল" },
  [PostCategory.RESEARCH]: { en: "Research", bn: "গবেষণা" },
  [PostCategory.ACHIEVEMENT]: { en: "Achievement", bn: "অর্জন" },
  [PostCategory.GENERAL]: { en: "General", bn: "সাধারণ" },
}

export function postStatusLabel(t: TFn): (value: PostStatus) => string {
  return (value) => {
    const label = POST_STATUS_LABELS[value]

    return label ? t(label) : humanize(value)
  }
}

export function postCategoryLabel(t: TFn): (value: PostCategory) => string {
  return (value) => {
    const label = POST_CATEGORY_LABELS[value]

    return label ? t(label) : humanize(value)
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

export { POST_CATEGORY_LABELS, POST_STATUS_LABELS, humanize }