export function isImageSource(value: string): boolean {
  return value.startsWith("/") || /^https?:\/\//.test(value)
}

/**
 * `User.image` is a `String[]` so a member can keep several pictures and pick
 * one as their avatar; `selactedImg` holds the index into that array.
 * Falls back to the first picture (then to a direct url) when the stored value
 * is missing or out of range.
 */
export function resolveUserImage(
  images: string[] | null | undefined,
  selactedImg: string | null | undefined
): { avatar: string | null; selectedImageIndex: number | null } {
  const list = Array.isArray(images) ? images : []

  if (list.length === 0) {
    return {
      avatar: isImageSource(selactedImg ?? "") ? (selactedImg as string) : null,
      selectedImageIndex: null,
    }
  }

  const index = Number.parseInt(selactedImg ?? "", 10)

  if (Number.isInteger(index) && index >= 0 && index < list.length) {
    return { avatar: list[index], selectedImageIndex: index }
  }

  if (isImageSource(selactedImg ?? "")) {
    return { avatar: selactedImg as string, selectedImageIndex: null }
  }

  return { avatar: list[0], selectedImageIndex: 0 }
}

/**
 * Better Auth models `image` as a single string, but this schema stores a list.
 * Social providers (Google) hand over one avatar url, so every value Better Auth
 * produces has to be widened to a list before it reaches Prisma.
 */
export function normalizeImageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
  }

  if (typeof value === "string" && value.length > 0) {
    return [value]
  }

  return []
}
