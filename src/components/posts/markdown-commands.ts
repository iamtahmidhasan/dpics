import type { EditorView } from "@codemirror/view"

/**
 * The CodeMirror transaction helpers behind the editor toolbar. Each one is a
 * pure dispatch against the current selection, so the toolbar never has to know
 * anything about the document.
 */

export type BlockKind = "h1" | "h2" | "h3" | "quote" | "ul" | "ol" | "task" | "code"

const BLOCK_PREFIXES: Partial<Record<BlockKind, string>> = {
  quote: "> ",
  ul: "- ",
  ol: "1. ",
  task: "- [ ] ",
}

/** Wraps (or unwraps) the selection in `marker`, e.g. `**` or `` ` ``. */
export function toggleWrap(view: EditorView, marker: string, placeholder: string): void {
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)

  const alreadyWrapped =
    selected.length >= marker.length * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)

  const wrapFrom = alreadyWrapped ? from + marker.length : from
  const wrapTo = alreadyWrapped ? to - marker.length : to
  const inner = alreadyWrapped ? selected.slice(marker.length, -marker.length) : selected
  const text = alreadyWrapped || inner.length > 0 ? inner : placeholder
  const insert = `${marker}${text}${marker}`

  view.dispatch({
    changes: { from: wrapFrom, to: wrapTo, insert },
    selection: {
      anchor: wrapFrom + marker.length,
      head: wrapFrom + marker.length + text.length,
    },
    scrollIntoView: true,
  })

  view.focus()
}

/** Puts `prefix` on every line the selection touches, or removes it. */
export function toggleLinePrefix(view: EditorView, prefix: string): void {
  const { state } = view
  const { from, to } = state.selection.main
  const firstLine = state.doc.lineAt(from)
  const lastLine = state.doc.lineAt(to)

  const lines: string[] = []
  let hasPrefix = true

  for (let number = firstLine.number; number <= lastLine.number; number += 1) {
    const line = state.doc.line(number)

    if (!line.text.startsWith(prefix)) hasPrefix = false

    lines.push(line.text)
  }

  const changes = lines.map((line, index) => {
    const start = state.doc.line(firstLine.number + index).from
    const insert = hasPrefix ? line.slice(prefix.length) : `${prefix}${line}`

    return { from: start, to: start + line.length, insert }
  })

  view.dispatch({ changes, scrollIntoView: true })
  view.focus()
}

/** Turns the selected lines into `## Heading`, or back into plain text. */
export function toggleHeading(view: EditorView, level: 1 | 2 | 3): void {
  const { state } = view
  const { from, to } = state.selection.main
  const firstLine = state.doc.lineAt(from)
  const lastLine = state.doc.lineAt(to)

  const lines: string[] = []
  let allPrefixed = true

  for (let number = firstLine.number; number <= lastLine.number; number += 1) {
    const text = state.doc.line(number).text

    if (!/^#{1,6}\s/.test(text)) allPrefixed = false

    lines.push(text)
  }

  const changes = lines.map((line, index) => {
    const start = state.doc.line(firstLine.number + index).from
    const stripped = line.replace(/^#{1,6}\s+/, "")

    return { from: start, to: start + line.length, insert: allPrefixed ? stripped : `${"#".repeat(level)} ${stripped}` }
  })

  view.dispatch({ changes, scrollIntoView: true })
  view.focus()
}

/** Fences the selection as a code block, or lifts an existing fence. */
export function toggleCodeBlock(view: EditorView, language = ""): void {
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)

  const openLine = state.doc.lineAt(Math.max(0, from - 1))
  const closeLine = state.doc.lineAt(Math.min(state.doc.length, to + 1))
  const isFenced =
    (openLine.text.startsWith("```") || openLine.text.startsWith("~~~")) &&
    closeLine.text.trim().startsWith("```")

  if (isFenced) {
    view.dispatch({
      changes: [
        { from: openLine.from, to: openLine.to, insert: openLine.text.replace(/^(```+|~~~+).*$/, "") },
        { from: closeLine.from, to: closeLine.to, insert: "" },
      ],
      selection: { anchor: openLine.from },
      scrollIntoView: true,
    })

    view.focus()
    return
  }

  const body = selected || "code"
  const insert = `\n\`\`\`${language}\n${body}\n\`\`\`\n`

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + language.length + 5 + body.length },
    scrollIntoView: true,
  })

  view.focus()
}

export function insertLink(view: EditorView): void {
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)
  const insert = `[${selected || "link text"}](https://)`

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length - 1, head: from + insert.length },
    scrollIntoView: true,
  })

  view.focus()
}

export function insertImage(view: EditorView): void {
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)

  let url = "https://"
  if (typeof window !== "undefined") {
    const input = window.prompt("Image URL (e.g. https://images.unsplash.com/... or /hero-tech.jpg):", "https://")
    if (input === null) return
    if (input.trim()) url = input.trim()
  }

  const alt = selected || "Image description"
  const insert = `![${alt}](${url})`

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length },
    scrollIntoView: true,
  })

  view.focus()
}

export function insertTable(view: EditorView): void {
  const { state } = view
  const { from } = state.selection.main
  const insert = [
    "",
    "| Column 1 | Column 2 | Column 3 |",
    "| -------- | -------- | -------- |",
    "| Value    | Value    | Value    |",
    "",
  ].join("\n")

  view.dispatch({ changes: { from, insert }, scrollIntoView: true })
  view.focus()
}

export function insertRule(view: EditorView): void {
  const { state } = view
  const { from } = state.selection.main

  view.dispatch({ changes: { from, insert: "\n\n---\n\n" }, scrollIntoView: true })
  view.focus()
}

/** Single entry point the toolbar dispatches through. */
export function applyBlock(view: EditorView, kind: BlockKind): void {
  if (kind === "h1") return toggleHeading(view, 1)
  if (kind === "h2") return toggleHeading(view, 2)
  if (kind === "h3") return toggleHeading(view, 3)
  if (kind === "code") return toggleCodeBlock(view)

  const prefix = BLOCK_PREFIXES[kind]

  if (prefix) toggleLinePrefix(view, prefix)
}