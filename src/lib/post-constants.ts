/**
 * Limits shared by the server service and the client composer UI.
 *
 * This module must stay free of `server-only` and Prisma imports so client
 * components can import the limits without pulling the service into the
 * browser bundle.
 */

export const MAX_POST_TITLE_LENGTH = 180
export const MAX_POST_SLUG_LENGTH = 180
export const MAX_POST_EXCERPT_LENGTH = 320
export const MAX_POST_SEO_DESCRIPTION_LENGTH = 200
export const MAX_POST_CONTENT_LENGTH = 120_000
export const MAX_POST_TAGS = 10
export const MAX_POST_TAG_LENGTH = 32
export const MAX_REJECTION_REASON_LENGTH = 1000

export const DEFAULT_POST_PAGE_SIZE = 9
export const MAX_POST_PAGE_SIZE = 50
