/**
 * Slug helpers shared by the server service and the client composer.
 * Client safe on purpose: the author form previews the slug while typing.
 */
export function toEventSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
