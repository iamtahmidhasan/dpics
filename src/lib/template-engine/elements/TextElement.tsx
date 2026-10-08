import React from "react"
import type { TextElement as TextElementType } from "../types"

interface Props {
  element: TextElementType
  resolvedData: Record<string, string>
}

export function RenderTextElement({ element, resolvedData }: Props) {
  // Resolve value: if dynamic field is bound, look up in resolvedData; else use static content
  let text = element.content || ""
  if (element.field && resolvedData[element.field] !== undefined) {
    text = resolvedData[element.field]
  }

  // Handle case where text is empty
  if (!text) text = " "

  // Determine justify/alignment
  let justifyContent = "flex-start"
  if (element.textAlign === "center") justifyContent = "center"
  if (element.textAlign === "right") justifyContent = "flex-end"

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    display: "flex",
    alignItems: "center",
    justifyContent,
    opacity: element.opacity ?? 1,
  }

  if (element.rotation) {
    containerStyle.transform = `rotate(${element.rotation}deg)`
  }

  const spanStyle: React.CSSProperties = {
    fontFamily: element.fontFamily || "Inter",
    fontSize: `${element.fontSize || 24}px`,
    fontWeight: element.fontWeight || 400,
    color: element.color || "#000000",
    textAlign: element.textAlign || "left",
    lineHeight: element.lineHeight || 1.2,
    wordBreak: "break-word",
    overflowWrap: "break-word",
  }

  if (element.letterSpacing) {
    spanStyle.letterSpacing = `${element.letterSpacing}px`
  }
  if (element.textTransform && element.textTransform !== "none") {
    spanStyle.textTransform = element.textTransform
  }

  return (
    <div style={containerStyle}>
      <span style={spanStyle}>{text}</span>
    </div>
  )
}
