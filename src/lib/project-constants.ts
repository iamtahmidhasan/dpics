import { PostStatus } from "@/generated/prisma/enums"

export const MAX_PROJECT_TITLE_LENGTH = 150
export const MAX_PROJECT_SLUG_LENGTH = 160
export const MAX_PROJECT_EXCERPT_LENGTH = 300
export const MAX_PROJECT_DESCRIPTION_LENGTH = 50000
export const MAX_PROJECT_TAGS = 10
export const MAX_PROJECT_TAG_LENGTH = 30
export const MAX_PROJECT_TECH_STACK = 15
export const MAX_PROJECT_IMAGES = 8

export const DEFAULT_PROJECT_PAGE_SIZE = 12
export const MAX_PROJECT_PAGE_SIZE = 50

export const PROJECT_STATUSES = Object.values(PostStatus) as PostStatus[]

export const COMMON_TECH_STACK = [
  "Next.js",
  "React",
  "Node.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "C++",
  "Arduino",
  "ESP32",
  "Raspberry Pi",
  "Flutter",
  "React Native",
  "PostgreSQL",
  "MongoDB",
  "Tailwind CSS",
  "Docker",
  "TensorFlow",
  "PyTorch",
  "FastAPI",
  "Prisma",
] as const
