export { CategoryType } from "@/generated/prisma/enums"
import { CategoryType } from "@/generated/prisma/enums"

export const MAX_CATEGORY_NAME_LENGTH = 100
export const MAX_CATEGORY_SLUG_LENGTH = 100
export const MAX_CATEGORY_DESCRIPTION_LENGTH = 1000

export const CATEGORY_TYPES = Object.values(CategoryType) as CategoryType[]

export const CATEGORY_TYPE_META: Record<
  CategoryType,
  { label: { en: string; bn: string }; description: { en: string; bn: string } }
> = {
  [CategoryType.POST]: {
    label: { en: "Posts", bn: "পোস্ট" },
    description: {
      en: "Categories for blog articles, tutorials and announcements",
      bn: "ব্লগ নিবন্ধ, টিউটোরিয়াল এবং ঘোষণার জন্য ক্যাটাগরি",
    },
  },
  [CategoryType.ACHIEVEMENT]: {
    label: { en: "Achievements", bn: "অর্জন" },
    description: {
      en: "Categories for competition wins, awards and milestones",
      bn: "প্রতিযোগিতা বিজয়, পুরস্কার এবং মাইলফলকের জন্য ক্যাটাগরি",
    },
  },
  [CategoryType.PROJECT]: {
    label: { en: "Projects", bn: "প্রজেক্ট" },
    description: {
      en: "Categories for showcase projects and repositories",
      bn: "শোকেস প্রজেক্ট এবং রিপোজিটরির জন্য ক্যাটাগরি",
    },
  },
  [CategoryType.EVENT]: {
    label: { en: "Events", bn: "ইভেন্ট" },
    description: {
      en: "Categories for workshops, seminars, and contests",
      bn: "ওয়ার্কশপ, সেমিনার এবং প্রতিযোগিতার জন্য ক্যাটাগরি",
    },
  },
}

export type CategorySummary = {
  id: string
  type: CategoryType
  name: string
  nameBn: string | null
  slug: string
  description: string | null
  isActive: boolean
  postsCount: number
  createdAt: string
  updatedAt: string
}

export type CategoryInput = {
  type: CategoryType
  name: string
  nameBn: string | null
  slug: string
  description: string | null
  isActive: boolean
}

export function toCategorySlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
