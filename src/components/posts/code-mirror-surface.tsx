"use client"

import CodeMirror from "@uiw/react-codemirror"
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { markdown } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search"
import { drawSelection, EditorView, keymap, lineNumbers } from "@codemirror/view"
import { useTheme } from "next-themes"

const EXTENSIONS = [
  lineNumbers(),
  history(),
  drawSelection(),
  highlightSelectionMatches(),
  closeBrackets(),
  // No `override` list: `markdown({ codeLanguages })` already contributes
  // completions for the language of a fenced block, which is all we need.
  autocompletion(),
  markdown({ codeLanguages: languages }),
  keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
  EditorView.lineWrapping,
]

export type CodeMirrorSurfaceProps = {
  value: string
  onChange: (value: string) => void
  onReady: (view: EditorView) => void
  placeholder?: string
  editable?: boolean
}

/**
 * The raw CodeMirror 6 instance. Loaded through `next/dynamic` with
 * `ssr: false` by `MarkdownEditor`, because CodeMirror reads `document` while
 * mounting and would break hydration otherwise.
 */
export default function CodeMirrorSurface({
  value,
  onChange,
  onReady,
  placeholder,
  editable = true,
}: CodeMirrorSurfaceProps) {
  const { resolvedTheme } = useTheme()

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onCreateEditor={onReady}
      extensions={[...EXTENSIONS, EditorView.editable.of(editable)]}
      placeholder={placeholder}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: false,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
      }}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      className="h-full"
      height="100%"
    />
  )
}