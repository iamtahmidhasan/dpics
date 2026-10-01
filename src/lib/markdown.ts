/**
 * Markdown helpers shared by the editor (client) and the post service
 * (server). Deliberately free of `server-only` and of any Prisma import so the
 * exact same pure functions can run in both places and stay in sync.
 */

import GithubSlugger from "github-slugger"

/** Average adult reading speed for technical prose, in words per minute. */
const WORDS_PER_MINUTE = 220

const FENCE_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~/g
const INLINE_CODE_PATTERN = /`[^`\n]*`/g
const IMAGE_PATTERN = /!\[[^\]]*\]\([^)]*\)/g
const LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g
const HTML_TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/g
const HEADING_PATTERN = /^#{1,6}\s+/gm
const BLOCKQUOTE_PATTERN = /^>\s?/gm
const LIST_MARKER_PATTERN = /^\s*([-*+]|\d+[.)])\s+/gm
const RULE_PATTERN = /^\s*(?:\*{3,}|-{3,}|_{3,})\s*$/gm
const EMPHASIS_PATTERN = /[*_~]{1,3}/g
const TABLE_DELIMITER_PATTERN = /^\s*\|?[\s:|-]+\|[\s:|-]*$/gm

/**
 * Fenced code blocks are replaced by a single placeholder before counting, so a
 * 200 line snippet does not inflate the word count of the surrounding prose.
 */
function neutraliseFences(markdown: string): string {
  return markdown.replace(FENCE_PATTERN, " ")
}

/**
 * Flattens markdown to plain text. Used to derive an excerpt and the meta
 * description when the author left those blank, and to count words.
 */
export function stripMarkdown(markdown: string): string {
  return neutraliseFences(markdown)
    .replace(IMAGE_PATTERN, "")
    .replace(LINK_PATTERN, "$1")
    .replace(INLINE_CODE_PATTERN, " ")
    .replace(TABLE_DELIMITER_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(HEADING_PATTERN, "")
    .replace(BLOCKQUOTE_PATTERN, "")
    .replace(LIST_MARKER_PATTERN, "")
    .replace(RULE_PATTERN, "")
    .replace(EMPHASIS_PATTERN, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim()
}

export function countWords(markdown: string): number {
  const text = stripMarkdown(markdown)

  return text ? text.split(/\s+/).filter(Boolean).length : 0
}

/** At least one minute, so a short post never advertises "0 min read". */
export function estimateReadingMinutes(markdown: string): number {
  return Math.max(1, Math.round(countWords(markdown) / WORDS_PER_MINUTE))
}

/** Collapses to a single line and cuts on a word boundary at `max`. */
export function truncateWords(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim()

  if (collapsed.length <= max) return collapsed

  const cut = collapsed.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * The excerpt an author can see and override: their own, else the first words
 * of the body. Bounded to `max` so it always fits a card and a meta tag.
 */
export function deriveExcerpt(markdown: string, excerpt: string | null, max: number): string | null {
  if (excerpt) return excerpt

  const text = stripMarkdown(markdown)

  return text ? truncateWords(text, max) : null
}

/** Heading outline for the editor sidebar / table of contents. */
export function extractHeadings(markdown: string): { depth: number; text: string }[] {
  const headings: { depth: number; text: string }[] = []

  for (const line of markdown.split("\n")) {
    const match = /^(#{1,4})\s+(.+?)\s*#*$/.exec(line)

    if (!match) continue

    const text = stripMarkdown(match[2])

    if (text) headings.push({ depth: match[1].length, text })
  }

  return headings
}

/**
 * Slug for a heading anchor.
 *
 * Uses the same `github-slugger` instance `rehype-slug` relies on, so a table
 * of contents built from `extractHeadings` always points at the id the
 * renderer actually emitted. Duplicated headings get a `-1`, `-2` suffix, which
 * is also how `rehype-slug` disambiguates them.
 */
export function headingAnchors(markdown: string): { depth: number; text: string; id: string }[] {
  const slugger = new GithubSlugger()

  return extractHeadings(markdown).map((heading) => ({
    ...heading,
    id: slugger.slug(heading.text),
  }))
}

export const MARKDOWN_PLACEHOLDER = `Start writing your post in **markdown**…

## Heading

Paragraph text, *italics*, ~~strikethrough~~, \`inline code\`.

- Bullet list
- [x] Task list (GFM)

1. Numbered list

> Blockquote

\`\`\`ts
const hello: string = "world"
\`\`\`

| Column | Column |
| --- | --- |
| a | b |

[Link](https://example.com)
`