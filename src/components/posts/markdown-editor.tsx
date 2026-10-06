"use client"

import {
  Bold,
  Braces,
  CheckSquare,
  Code,
  Columns2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Undo2,
} from "lucide-react"
import { undo, redo } from "@codemirror/commands"
import { EditorView } from "@codemirror/view"
import dynamic from "next/dynamic"
import { useCallback, useRef, useState } from "react"

import { MarkdownContent } from "@/components/posts/markdown-content"
import {
  applyBlock,
  insertImage,
  insertLink,
  insertRule,
  insertTable,
  toggleCodeBlock,
  toggleWrap,
} from "@/components/posts/markdown-commands"
import { Button } from "@/components/ui/button"
import { MediaPickerModal } from "@/components/media/media-picker-modal"
import { Separator } from "@/components/ui/separator"
import { countWords, estimateReadingMinutes, MARKDOWN_PLACEHOLDER } from "@/lib/markdown"
import { compressImage } from "@/lib/client-image-compression"
import { cn } from "cn"

// CodeMirror touches `document` while mounting, so it must not render on the
// server. The `loading` state keeps the editor area from collapsing.
const CodeMirrorSurface = dynamic(() => import("@/components/posts/code-mirror-surface"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-72 items-center justify-center text-muted-foreground text-xs">
      Loading editor…
    </div>
  ),
})

type EditorMode = "write" | "preview" | "split"

export type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  id?: string
  disabled?: boolean
  allowMediaLibrary?: boolean
}

type ToolbarAction = {
  key: string
  label: string
  icon: typeof Bold
  run: (view: EditorView) => void
}

const TOOLBAR_GROUPS: { group: string; actions: ToolbarAction[] }[] = [
  {
    group: "blocks",
    actions: [
      {
        key: "h1",
        label: "Heading 1",
        icon: Heading1,
        run: (view) => applyBlock(view, "h1"),
      },
      {
        key: "h2",
        label: "Heading 2",
        icon: Heading2,
        run: (view) => applyBlock(view, "h2"),
      },
      {
        key: "h3",
        label: "Heading 3",
        icon: Heading3,
        run: (view) => applyBlock(view, "h3"),
      },
      {
        key: "quote",
        label: "Blockquote",
        icon: Quote,
        run: (view) => applyBlock(view, "quote"),
      },
    ],
  },
  {
    group: "inline",
    actions: [
      { key: "bold", label: "Bold", icon: Bold, run: (view) => toggleWrap(view, "**", "bold text") },
      {
        key: "italic",
        label: "Italic",
        icon: Italic,
        run: (view) => toggleWrap(view, "_", "italic text"),
      },
      {
        key: "strike",
        label: "Strikethrough",
        icon: Strikethrough,
        run: (view) => toggleWrap(view, "~~", "struck text"),
      },
      {
        key: "code",
        label: "Inline code",
        icon: Code,
        run: (view) => toggleWrap(view, "`", "code"),
      },
    ],
  },
  {
    group: "lists",
    actions: [
      { key: "ul", label: "Bullet list", icon: List, run: (view) => applyBlock(view, "ul") },
      {
        key: "ol",
        label: "Numbered list",
        icon: ListOrdered,
        run: (view) => applyBlock(view, "ol"),
      },
      {
        key: "task",
        label: "Task list",
        icon: CheckSquare,
        run: (view) => applyBlock(view, "task"),
      },
    ],
  },
  {
    group: "insert",
    actions: [
      {
        key: "fence",
        label: "Code block",
        icon: Braces,
        run: (view) => toggleCodeBlock(view),
      },
      { key: "link", label: "Link", icon: LinkIcon, run: insertLink },
      { key: "image", label: "Image", icon: ImageIcon, run: insertImage },
      { key: "table", label: "Table", icon: TableIcon, run: insertTable },
      { key: "rule", label: "Divider", icon: Minus, run: insertRule },
    ],
  },
]

const MODE_TABS: { mode: EditorMode; label: string; icon: typeof PenLine }[] = [
  { mode: "write", label: "Write", icon: PenLine },
  { mode: "split", label: "Split", icon: Columns2 },
  { mode: "preview", label: "Preview", icon: Eye },
]

export function MarkdownEditor({
  value,
  onChange,
  id,
  disabled,
  allowMediaLibrary = true,
}: MarkdownEditorProps) {
  const viewRef = useRef<EditorView | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<EditorMode>("split")
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleReady = useCallback((view: EditorView) => {
    viewRef.current = view
  }, [])

  const handleMediaSelected = useCallback((url: string, alt?: string) => {
    const view = viewRef.current
    if (!view) return
    const { state } = view
    const { from, to } = state.selection.main
    const selected = state.sliceDoc(from, to)
    const imageAlt = alt || selected || "Image description"
    const insert = `![${imageAlt}](${url})`
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
      scrollIntoView: true,
    })
    view.focus()
  }, [])

  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const compressedFile = await compressImage(file)
      const formData = new FormData()
      formData.append("file", compressedFile)
      formData.append("folder", "posts")

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload image")

      const defaultAlt = file.name.replace(/\.[^/.]+$/, "")
      handleMediaSelected(data.url, defaultAlt)
    } catch (err) {
      console.error("Direct image upload failed:", err)
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const runAction = useCallback((run: (view: EditorView) => void) => {
    const view = viewRef.current

    if (view) run(view)
  }, [])

  const undoAction = useCallback(() => {
    const view = viewRef.current

    if (!view) return

    undo(view)
    view.focus()
  }, [])

  const redoAction = useCallback(() => {
    const view = viewRef.current

    if (!view) return

    redo(view)
    view.focus()
  }, [])

  const words = countWords(value)

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs/relaxed font-medium" id={id ? `${id}-label` : undefined}>
          Content
        </span>

        <div
          className="flex items-center gap-0.5 rounded-md border p-0.5"
          role="tablist"
          aria-label="Editor mode"
        >
          {MODE_TABS.map(({ mode: tabMode, label, icon: Icon }) => (
            <button
              key={tabMode}
              type="button"
              role="tab"
              aria-selected={mode === tabMode}
              onClick={() => setMode(tabMode)}
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[0.625rem] font-medium transition-colors",
                mode === tabMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <div
          className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1"
          role="toolbar"
          aria-label="Formatting"
        >
          {TOOLBAR_GROUPS.map((group, groupIndex) => (
            <div key={group.group} className="flex items-center gap-0.5">
              {groupIndex > 0 ? (
                <Separator orientation="vertical" className="mx-1 h-4" />
              ) : null}

              {group.actions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => {
                    if (action.key === "image") {
                      if (allowMediaLibrary) {
                        setMediaPickerOpen(true)
                      } else {
                        fileInputRef.current?.click()
                      }
                    } else {
                      runAction(action.run)
                    }
                  }}
                  title={action.label}
                  aria-label={action.label}
                >
                  <action.icon className="size-3.5" />
                </Button>
              ))}
            </div>
          ))}

          <Separator orientation="vertical" className="mx-1 h-4" />

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={undoAction}
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={redoAction}
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>

        <div
          className={cn(
            "grid",
            mode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}
        >
          <div
            className={cn(
              "flex flex-col min-h-72",
              mode === "preview" && "hidden",
              mode === "split" && "border-b lg:border-b-0 lg:border-r"
            )}
          >
            <CodeMirrorSurface
              value={value}
              onChange={onChange}
              onReady={handleReady}
              placeholder={MARKDOWN_PLACEHOLDER}
              editable={!disabled}
            />
          </div>

          <div
            className={cn(
              "min-h-72 p-3 sm:p-4",
              mode === "write" && "hidden"
            )}
          >
            {value.trim() ? (
              <MarkdownContent>{value}</MarkdownContent>
            ) : (
              <p className="text-muted-foreground text-xs italic">
                {mode === "split"
                  ? "Nothing to preview yet — start writing on the left."
                  : "Nothing to preview yet — start writing in Write mode."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-2.5 py-1.5 text-[0.625rem] text-muted-foreground">
          <span>{value.length.toLocaleString()} characters</span>
          <span>
            {words.toLocaleString()} words · {estimateReadingMinutes(value)} min read
          </span>
        </div>
      </div>

      {allowMediaLibrary && (
        <MediaPickerModal
          open={mediaPickerOpen}
          onOpenChange={setMediaPickerOpen}
          onSelect={handleMediaSelected}
          title="Insert Image into Content"
          defaultFolder="posts"
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploadingImage}
        onChange={handleDirectImageUpload}
      />
    </div>
  )
}