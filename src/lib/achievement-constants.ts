import { PostStatus } from "@/generated/prisma/enums"

export const MAX_ACHIEVEMENT_TITLE_LENGTH = 150
export const MAX_ACHIEVEMENT_SLUG_LENGTH = 160
export const MAX_ACHIEVEMENT_EXCERPT_LENGTH = 300
export const MAX_ACHIEVEMENT_CONTENT_LENGTH = 50000
export const MAX_ACHIEVEMENT_ORGANIZATION_LENGTH = 120
export const MAX_ACHIEVEMENT_TAGS = 8
export const MAX_ACHIEVEMENT_TAG_LENGTH = 30
export const MAX_ACHIEVEMENT_IMAGES = 6

export const DEFAULT_ACHIEVEMENT_PAGE_SIZE = 12
export const MAX_ACHIEVEMENT_PAGE_SIZE = 50

export const ACHIEVEMENT_STATUSES = Object.values(PostStatus) as PostStatus[]
