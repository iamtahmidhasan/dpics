import React from "react"
import type { QRCodeElement, TemplateDesign, TemplateElement } from "./types"
import { RenderTextElement } from "./elements/TextElement"
import { RenderImageElement } from "./elements/ImageElement"
import { RenderQRCodeElement } from "./elements/QRCodeElement"
import { RenderShapeElement } from "./elements/ShapeElement"
import { RenderLineElement } from "./elements/LineElement"
import { generateQRCodeDataUrl } from "./qr"

export interface PreparedTemplate {
  design: TemplateDesign
  resolvedData: Record<string, string>
  qrCodes: Map<string, string>
  fontFamilies: string[]
}

/**
 * Pre-processes a template by resolving async QR codes and extracting required fonts.
 */
export async function prepareTemplate(
  design: TemplateDesign,
  resolvedData: Record<string, string>
): Promise<PreparedTemplate> {
  const qrCodes = new Map<string, string>()
  const fontFamilies = new Set<string>(["Inter", "Hind Siliguri"])

  // Process all elements
  const qrTasks: Promise<void>[] = []

  for (const el of design.elements || []) {
    if (el.type === "text" && el.fontFamily) {
      fontFamilies.add(el.fontFamily)
    }

    if (el.type === "qr") {
      const qrEl = el as QRCodeElement
      let text = qrEl.data || ""
      if (qrEl.field && resolvedData[qrEl.field]) {
        text = resolvedData[qrEl.field]
      }
      if (!text) text = "https://dgpics.org"

      qrTasks.push(
        (async () => {
          const dataUrl = await generateQRCodeDataUrl(text, {
            color: qrEl.color,
            backgroundColor: qrEl.backgroundColor,
            errorCorrectionLevel: qrEl.errorCorrectionLevel,
            width: qrEl.width * 2,
          })
          qrCodes.set(qrEl.id, dataUrl)
        })()
      )
    }
  }

  await Promise.all(qrTasks)

  return {
    design,
    resolvedData,
    qrCodes,
    fontFamilies: Array.from(fontFamilies),
  }
}

/**
 * Pure Satori-compatible JSX root component for Next.js ImageResponse.
 */
export function TemplateRootView({ prepared }: { prepared: PreparedTemplate }) {
  const { design, resolvedData, qrCodes } = prepared

  const allElements = [...(design.elements || [])]
    .filter((el) => !el.hidden)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  const underElements = allElements.filter((el) => el.behindTemplate === true)
  const overElements = allElements.filter((el) => !el.behindTemplate)

  const renderSingleElement = (el: TemplateElement) => {
    switch (el.type) {
      case "text":
        return (
          <RenderTextElement
            key={el.id}
            element={el}
            resolvedData={resolvedData}
          />
        )
      case "image":
        return (
          <RenderImageElement
            key={el.id}
            element={el}
            resolvedData={resolvedData}
          />
        )
      case "qr":
        return (
          <RenderQRCodeElement
            key={el.id}
            element={el}
            qrDataUrl={qrCodes.get(el.id) || ""}
          />
        )
      case "rectangle":
      case "circle":
        return <RenderShapeElement key={el.id} element={el} />
      case "line":
        return <RenderLineElement key={el.id} element={el} />
      default:
        return null
    }
  }

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: `${design.width}px`,
        height: `${design.height}px`,
        backgroundColor: design.backgroundColor || "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* 1. Layers placed BEHIND the template frame (e.g. member photos under transparent PNG cutouts) */}
      {underElements.map(renderSingleElement)}

      {/* 2. Main Template Frame Asset */}
      {design.backgroundMediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={design.backgroundMediaUrl}
          alt="Template Frame"
          width={design.width}
          height={design.height}
          style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            width: `${design.width}px`,
            height: `${design.height}px`,
            objectFit: "cover",
          }}
        />
      ) : null}

      {/* 3. Layers placed IN FRONT OF the template frame (e.g. text labels, badges on top) */}
      {overElements.map(renderSingleElement)}
    </div>
  )
}

