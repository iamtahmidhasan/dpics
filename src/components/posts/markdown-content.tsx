"use client"

import ReactMarkdown, { type Components } from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

/**
 * Sanitisation runs *before* `rehypeSlug` and `rehypeHighlight` so the heading
 * ids and the highlight.js classes those two add survive. Everything before it
 * (the markdown itself, plus GFM) is still treated as fully untrusted, and
 * `defaultSchema` already drops `script`, `style`, event handlers and
 * `javascript:` urls.
 */
const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "input"],
  attributes: {
    ...defaultSchema.attributes,
    // `rehype-highlight` puts its token classes on these four only.
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: ["className"],
    pre: ["className"],
    div: ["className"],
    // GFM tables emit `align` / inline styles for column alignment.
    th: ["align", "style"],
    td: ["align", "style"],
    // GFM task lists render as disabled checkboxes.
    input: ["type", "checked", "disabled"],
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
  },
}

/**
 * react-markdown hands every renderer the raw hast node it is rendering. Spreading
 * that onto a DOM element makes React stringify it into `node="[object Object]"`,
 * so it is dropped here rather than in each of the ~20 renderers below.
 */
function domProps<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const rest: T = { ...props }
  delete rest.node

  return rest
}

const components: Components = {
  h1: ({ className, ...props }) => (
    <h1 className={`mt-8 mb-3 font-heading text-2xl font-semibold tracking-tight first:mt-0 ${className ?? ""}`} {...domProps(props)} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={`mt-8 mb-3 border-b pb-1 font-heading text-xl font-semibold tracking-tight first:mt-0 ${className ?? ""}`} {...domProps(props)} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={`mt-6 mb-2 font-heading text-base font-semibold first:mt-0 ${className ?? ""}`} {...domProps(props)} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={`mt-5 mb-2 font-heading text-sm font-semibold first:mt-0 ${className ?? ""}`} {...domProps(props)} />
  ),
  h5: ({ className, ...props }) => (
    <h5 className={`mt-4 mb-2 text-sm font-semibold first:mt-0 ${className ?? ""}`} {...domProps(props)} />
  ),
  h6: ({ className, ...props }) => (
    <h6 className={`mt-4 mb-2 text-muted-foreground text-xs font-semibold tracking-wide uppercase first:mt-0 ${className ?? ""}`} {...domProps(props)} />
  ),
  p: ({ className, ...props }) => (
    <p className={`leading-relaxed ${className ?? ""}`} {...domProps(props)} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={`my-4 list-disc space-y-1 pl-6 marker:text-muted-foreground ${className ?? ""}`} {...domProps(props)} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={`my-4 list-decimal space-y-1 pl-6 marker:text-muted-foreground ${className ?? ""}`} {...domProps(props)} />
  ),
  li: ({ className, ...props }) => (
    <li className={`leading-relaxed [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 ${className ?? ""}`} {...domProps(props)} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote className={`my-4 border-primary border-l-2 pl-4 text-muted-foreground italic ${className ?? ""}`} {...domProps(props)} />
  ),
  hr: ({ className, ...props }) => (
    <hr className={`my-6 border-border ${className ?? ""}`} {...domProps(props)} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={`font-semibold ${className ?? ""}`} {...domProps(props)} />
  ),
  a: ({ className, href, ...props }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//.test(href)

    return (
      <a
        className={`font-medium text-primary underline underline-offset-4 hover:opacity-80 ${className ?? ""}`}
        href={href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...domProps(props)}
      />
    )
  },
  // Inline code only: a `pre` child means the block renderer below took over.
  code: ({ className, children, ...props }) => {
    if (className) {
      return <code className={`font-mono text-[0.8125rem] ${className}`} {...domProps(props)}>{children}</code>
    }

    return (
      <code className={`rounded bg-muted px-1 py-0.5 font-mono text-[0.8125rem] ${className ?? ""}`} {...domProps(props)}>
        {children}
      </code>
    )
  },
  pre: ({ className, children, ...props }) => (
    <pre
      className={`my-4 overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-[0.8125rem] leading-relaxed ${className ?? ""}`}
      {...domProps(props)}
    >
      {children}
    </pre>
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 w-full overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${className ?? ""}`} {...domProps(props)} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={`bg-muted/50 ${className ?? ""}`} {...domProps(props)} />
  ),
  th: ({ className, ...props }) => (
    <th className={`border px-3 py-2 text-left font-semibold ${className ?? ""}`} {...domProps(props)} />
  ),
  td: ({ className, ...props }) => (
    <td className={`border px-3 py-2 align-top ${className ?? ""}`} {...domProps(props)} />
  ),
  img: ({ className, alt, src, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element -- author supplied urls are arbitrary, so they cannot go through the image optimizer
    <img
      className={`my-4 h-auto max-w-full rounded-md border ${className ?? ""}`}
      alt={alt ?? ""}
      src={src}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const target = e.currentTarget
        if (target.dataset.failed) return
        target.dataset.failed = "true"
        target.src = "/placeholder.svg"
      }}
      {...domProps(props)}
    />
  ),
  input: ({ className, ...props }) => (
    <input
      className={`mr-1 size-3.5 translate-y-0.5 accent-primary ${className ?? ""}`}
      type="checkbox"
      disabled
      {...domProps(props)}
    />
  ),
}

export type MarkdownContentProps = {
  children: string
  className?: string
}

/**
 * The single markdown renderer, shared by the public post page and the live
 * preview inside the editor so both always agree on what an author sees.
 */
export function MarkdownContent({ children, className }: MarkdownContentProps) {
  return (
    <div className={`space-y-4 text-sm/relaxed ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema], rehypeSlug, [rehypeHighlight, { detect: false }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}