import React from "react"
import type { CircleElement, RectangleElement } from "../types"

interface Props {
  element: RectangleElement | CircleElement
}

export function RenderShapeElement({ element }: Props) {
  const isCircle = element.type === "circle"
  const borderRadius = isCircle
    ? "50%"
    : "borderRadius" in element && element.borderRadius
    ? `${element.borderRadius}px`
    : undefined

  const shapeStyle: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    display: "flex",
    backgroundColor: element.fill || "transparent",
    opacity: element.opacity ?? 1,
  }

  if (borderRadius) {
    shapeStyle.borderRadius = borderRadius
  }
  if (element.strokeWidth) {
    shapeStyle.borderWidth = `${element.strokeWidth}px`
    shapeStyle.borderStyle = "solid"
    shapeStyle.borderColor = element.stroke || "transparent"
  }
  if (element.rotation) {
    shapeStyle.transform = `rotate(${element.rotation}deg)`
  }

  return <div style={shapeStyle} />
}
