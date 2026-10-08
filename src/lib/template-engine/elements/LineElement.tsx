import React from "react"
import type { LineElement as LineElementType } from "../types"

interface Props {
  element: LineElementType
}

export function RenderLineElement({ element }: Props) {
  const isVertical = element.orientation === "vertical"

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: isVertical ? `${element.strokeWidth}px` : `${element.width}px`,
    height: isVertical ? `${element.height}px` : `${element.strokeWidth}px`,
    display: "flex",
    backgroundColor: element.color || "#000000",
    opacity: element.opacity ?? 1,
  }

  if (element.rotation) {
    lineStyle.transform = `rotate(${element.rotation}deg)`
  }

  return <div style={lineStyle} />
}
