import React from "react"
import type { ImageElement as ImageElementType } from "../types"

export const DEFAULT_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E"

interface Props {
  element: ImageElementType
  resolvedData: Record<string, string>
}

export function RenderImageElement({ element, resolvedData }: Props) {
  let src = element.src || ""
  if (element.field && resolvedData[element.field]) {
    src = resolvedData[element.field]
  }

  if (!src) {
    src = DEFAULT_AVATAR_PLACEHOLDER
  }

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: element.opacity ?? 1,
    overflow: "hidden",
  }

  if (element.rotation) {
    containerStyle.transform = `rotate(${element.rotation}deg)`
  }
  if (element.borderRadius) {
    containerStyle.borderRadius = `${element.borderRadius}px`
  }
  if (element.borderWidth) {
    containerStyle.borderWidth = `${element.borderWidth}px`
    containerStyle.borderStyle = "solid"
    containerStyle.borderColor = element.borderColor || "transparent"
  }

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: element.objectFit || "cover",
  }
  if (element.borderRadius) {
    imgStyle.borderRadius = `${element.borderRadius}px`
  }

  return (
    <div style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={element.width}
        height={element.height}
        style={imgStyle}
      />
    </div>
  )
}
