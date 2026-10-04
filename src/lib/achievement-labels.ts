import { PostStatus } from "@/generated/prisma/enums"
import type { LocalizedText } from "@/lib/i18n"

export const ACHIEVEMENT_STATUS_LABELS: Record<PostStatus, LocalizedText> = {
  [PostStatus.PUBLISHED]: { en: "Published", bn: "প্রকাশিত" },
  [PostStatus.PENDING]: { en: "In review", bn: "পর্যালোচনায়" },
  [PostStatus.UPDATE]: { en: "Updates", bn: "আপডেট" },
  [PostStatus.DRAFT]: { en: "Draft", bn: "খসড়া" },
  [PostStatus.REJECTED]: { en: "Needs work", bn: "ফেরত" },
  [PostStatus.ARCHIVED]: { en: "Archived", bn: "আর্কাইভ" },
}

export function achievementStatusLabel(status: PostStatus): LocalizedText {
  return ACHIEVEMENT_STATUS_LABELS[status] ?? { en: status, bn: status }
}

export type AchievementBadgeVariant = "default" | "secondary" | "outline" | "destructive"

export function achievementStatusBadgeVariant(status: PostStatus): AchievementBadgeVariant {
  switch (status) {
    case PostStatus.PUBLISHED:
      return "default"
    case PostStatus.PENDING:
    case PostStatus.UPDATE:
      return "secondary"
    case PostStatus.REJECTED:
      return "destructive"
    case PostStatus.DRAFT:
    case PostStatus.ARCHIVED:
    default:
      return "outline"
  }
}
