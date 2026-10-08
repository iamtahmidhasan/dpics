import React from "react"
import type { QRCodeElement as QRCodeElementType } from "../types"

interface Props {
  element: QRCodeElementType
  qrDataUrl: string
}

export function RenderQRCodeElement({ element, qrDataUrl }: Props) {
  if (!qrDataUrl) {
    return null
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
    backgroundColor: element.backgroundColor || "#ffffff",
    borderRadius: "8px",
    padding: "4px",
  }

  if (element.rotation) {
    containerStyle.transform = `rotate(${element.rotation}deg)`
  }

  return (
    <div style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="QR Code"
        width={element.width}
        height={element.height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  )
}
