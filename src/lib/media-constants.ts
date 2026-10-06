export const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_ALT_TEXT_LENGTH = 300

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
] as const

export const MEDIA_FOLDERS = [
  { id: "all", name: "All Media", nameBn: "সব মিডিয়া", path: "" },
  { id: "posts", name: "Posts", nameBn: "পোস্ট", path: "/dpics/posts" },
  { id: "achievements", name: "Achievements", nameBn: "অর্জনসমূহ", path: "/dpics/achievements" },
  { id: "courses", name: "Courses", nameBn: "কোর্স", path: "/dpics/courses" },
  { id: "avatars", name: "Avatars", nameBn: "অ্যাভাটার", path: "/dpics/avatars" },
  { id: "documents", name: "Documents", nameBn: "ডকুমেন্টস", path: "/dpics/documents" },
  { id: "general", name: "General", nameBn: "সাধারণ", path: "/dpics/media" },
] as const

export type MediaFolderId = (typeof MEDIA_FOLDERS)[number]["id"]

export interface MediaItemSummary {
  id: string
  fileId: string
  name: string
  url: string
  thumbnailUrl: string | null
  filePath: string | null
  fileType: string | null
  mimeType: string | null
  size: number
  width: number | null
  height: number | null
  alt: string | null
  folder: string | null
  uploadedById: string | null
  uploadedBy?: {
    id: string
    name: string
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface MediaStats {
  totalCount: number
  totalSize: number
  folderCounts?: Record<string, number>
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
