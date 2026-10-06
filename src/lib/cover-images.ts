export interface CoverImageOption {
  id: string // "1", "2", ... "10"
  path: string
  name: {
    en: string
    bn: string
  }
  accentColor: string
}

export const COVER_IMAGES: readonly CoverImageOption[] = [
  {
    id: "1",
    path: "/covers/cover-1.svg",
    name: { en: "Cyber Circuit", bn: "সাইবার সার্কিট" },
    accentColor: "#00f2fe",
  },
  {
    id: "2",
    path: "/covers/cover-2.svg",
    name: { en: "Neon Synth", bn: "নিয়ন সিন্থ" },
    accentColor: "#ec4899",
  },
  {
    id: "3",
    path: "/covers/cover-3.svg",
    name: { en: "Emerald Matrix", bn: "এমারেল্ড ম্যাট্রিক্স" },
    accentColor: "#10b981",
  },
  {
    id: "4",
    path: "/covers/cover-4.svg",
    name: { en: "Amber Horizon", bn: "অ্যাম্বার দিগন্ত" },
    accentColor: "#f59e0b",
  },
  {
    id: "5",
    path: "/covers/cover-5.svg",
    name: { en: "Sapphire Ocean", bn: "স্যাফায়ার ওশান" },
    accentColor: "#2563eb",
  },
  {
    id: "6",
    path: "/covers/cover-6.svg",
    name: { en: "Quantum Aurora", bn: "কোয়ান্টাম অরোরা" },
    accentColor: "#14b8a6",
  },
  {
    id: "7",
    path: "/covers/cover-7.svg",
    name: { en: "Crimson Ruby", bn: "ক্রিমসন রুবি" },
    accentColor: "#f43f5e",
  },
  {
    id: "8",
    path: "/covers/cover-8.svg",
    name: { en: "Cosmic Obsidian", bn: "কসমিক অবসিডিয়ান" },
    accentColor: "#818cf8",
  },
  {
    id: "9",
    path: "/covers/cover-9.svg",
    name: { en: "Teal Prism", bn: "টিল প্রিজম" },
    accentColor: "#22d3ee",
  },
  {
    id: "10",
    path: "/covers/cover-10.svg",
    name: { en: "Golden Sovereign", bn: "গোল্ডেন সোভেরিন" },
    accentColor: "#fbbf24",
  },
] as const

/**
 * Given a `coverImg` string/number index (e.g. "1", 1, "2", etc.) or URL,
 * returns the absolute path to the cover image. Defaults to cover-1.svg.
 */
export function resolveCoverImage(coverImg: string | number | null | undefined): string {
  if (!coverImg) return COVER_IMAGES[0].path

  const str = String(coverImg).trim()
  // Direct url or relative path
  if (str.startsWith("/") || /^https?:\/\//.test(str)) {
    return str
  }

  const found = COVER_IMAGES.find((c) => c.id === str)
  if (found) return found.path

  const num = Number.parseInt(str, 10)
  if (!Number.isNaN(num) && num >= 1 && num <= COVER_IMAGES.length) {
    return COVER_IMAGES[num - 1].path
  }

  return COVER_IMAGES[0].path
}
