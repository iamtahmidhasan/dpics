import * as fabric from "fabric"
import type {
  CircleElement,
  ImageElement,
  LineElement,
  QRCodeElement,
  RectangleElement,
  TemplateDesign,
  TemplateElement,
  TextElement,
} from "@/lib/template-engine/types"

// Custom metadata interface attached to Fabric objects
export interface CustomFabricData {
  id: string
  type: TemplateElement["type"]
  field?: string
  content?: string
  name?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  objectFit?: "cover" | "contain" | "fill"
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  qrData?: string
}

export type FabricCustomObject = fabric.FabricObject & {
  customData?: CustomFabricData
}

/**
 * Converts a normalized TemplateElement into a Fabric.js object.
 */
export async function createFabricObjectFromElement(
  element: TemplateElement,
  sampleData?: Record<string, string>
): Promise<FabricCustomObject | null> {
  const customData: CustomFabricData = {
    id: element.id,
    type: element.type,
    name: element.name,
    field: "field" in element ? element.field : undefined,
  }

  switch (element.type) {
    case "text": {
      const textEl = element as TextElement
      let displayContent = textEl.content || "Text"
      if (textEl.field) {
        displayContent = sampleData?.[textEl.field] || `{{${textEl.field}}}`
      }

      customData.content = textEl.content
      customData.field = textEl.field

      const textObj = new fabric.IText(displayContent, {
        left: textEl.x,
        top: textEl.y,
        originX: "left",
        originY: "top",
        width: textEl.width,
        fontFamily: textEl.fontFamily || "Inter",
        fontSize: textEl.fontSize || 24,
        fontWeight: String(textEl.fontWeight || 400),
        fill: textEl.color || "#000000",
        textAlign: textEl.textAlign || "left",
        charSpacing: (textEl.letterSpacing || 0) * 10,
        lineHeight: textEl.lineHeight || 1.2,
        angle: textEl.rotation || 0,
        opacity: textEl.opacity ?? 1,
        lockMovementX: textEl.locked,
        lockMovementY: textEl.locked,
        lockRotation: textEl.locked,
        lockScalingX: textEl.locked,
        lockScalingY: textEl.locked,
        visible: !textEl.hidden,
      }) as FabricCustomObject

      textObj.customData = customData
      return textObj
    }

    case "image": {
      const imgEl = element as ImageElement
      let src = imgEl.src || ""
      if (imgEl.field && sampleData?.[imgEl.field]) {
        src = sampleData[imgEl.field]
      }
      if (!src) {
        src =
          "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E"
      }

      customData.borderRadius = imgEl.borderRadius
      customData.borderWidth = imgEl.borderWidth
      customData.borderColor = imgEl.borderColor
      customData.objectFit = imgEl.objectFit

      try {
        const imgObj = await fabric.FabricImage.fromURL(src, {
          crossOrigin: "anonymous",
        }) as FabricCustomObject

        imgObj.set({
          left: imgEl.x,
          top: imgEl.y,
          originX: "left",
          originY: "top",
          scaleX: imgEl.width / (imgObj.width || 1),
          scaleY: imgEl.height / (imgObj.height || 1),
          angle: imgEl.rotation || 0,
          opacity: imgEl.opacity ?? 1,
          lockMovementX: imgEl.locked,
          lockMovementY: imgEl.locked,
          visible: !imgEl.hidden,
        })

        imgObj.customData = customData
        return imgObj
      } catch (err) {
        console.warn("Failed to load fabric image:", src, err)
        const fallbackRect = new fabric.Rect({
          left: imgEl.x,
          top: imgEl.y,
          originX: "left",
          originY: "top",
          width: imgEl.width,
          height: imgEl.height,
          fill: "#e2e8f0",
          stroke: "#94a3b8",
          strokeWidth: 1,
          angle: imgEl.rotation || 0,
          opacity: imgEl.opacity ?? 1,
        }) as FabricCustomObject
        fallbackRect.customData = customData
        return fallbackRect
      }
    }

    case "qr": {
      const qrEl = element as QRCodeElement
      customData.qrData = qrEl.data
      customData.field = qrEl.field
      customData.errorCorrectionLevel = qrEl.errorCorrectionLevel

      const qrGroup = new fabric.Rect({
        left: qrEl.x,
        top: qrEl.y,
        originX: "left",
        originY: "top",
        width: qrEl.width,
        height: qrEl.height,
        fill: qrEl.backgroundColor || "#ffffff",
        stroke: qrEl.color || "#000000",
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        angle: qrEl.rotation || 0,
        opacity: qrEl.opacity ?? 1,
        lockMovementX: qrEl.locked,
        lockMovementY: qrEl.locked,
        visible: !qrEl.hidden,
      }) as FabricCustomObject

      qrGroup.customData = customData
      return qrGroup
    }

    case "rectangle": {
      const rectEl = element as RectangleElement
      const rectObj = new fabric.Rect({
        left: rectEl.x,
        top: rectEl.y,
        originX: "left",
        originY: "top",
        width: rectEl.width,
        height: rectEl.height,
        fill: rectEl.fill || "#3b82f6",
        stroke: rectEl.stroke || undefined,
        strokeWidth: rectEl.strokeWidth || 0,
        rx: rectEl.borderRadius || 0,
        ry: rectEl.borderRadius || 0,
        angle: rectEl.rotation || 0,
        opacity: rectEl.opacity ?? 1,
        lockMovementX: rectEl.locked,
        lockMovementY: rectEl.locked,
        visible: !rectEl.hidden,
      }) as FabricCustomObject

      rectObj.customData = customData
      return rectObj
    }

    case "circle": {
      const circEl = element as CircleElement
      const radius = Math.min(circEl.width, circEl.height) / 2
      const circObj = new fabric.Circle({
        left: circEl.x,
        top: circEl.y,
        originX: "left",
        originY: "top",
        radius,
        fill: circEl.fill || "#3b82f6",
        stroke: circEl.stroke || undefined,
        strokeWidth: circEl.strokeWidth || 0,
        angle: circEl.rotation || 0,
        opacity: circEl.opacity ?? 1,
        lockMovementX: circEl.locked,
        lockMovementY: circEl.locked,
        visible: !circEl.hidden,
      }) as FabricCustomObject

      circObj.customData = customData
      return circObj
    }

    case "line": {
      const lineEl = element as LineElement
      const isVertical = lineEl.orientation === "vertical"
      const x2 = isVertical ? 0 : lineEl.width
      const y2 = isVertical ? lineEl.height : 0

      const lineObj = new fabric.Line([0, 0, x2, y2], {
        left: lineEl.x,
        top: lineEl.y,
        originX: "left",
        originY: "top",
        stroke: lineEl.color || "#000000",
        strokeWidth: lineEl.strokeWidth || 2,
        angle: lineEl.rotation || 0,
        opacity: lineEl.opacity ?? 1,
        lockMovementX: lineEl.locked,
        lockMovementY: lineEl.locked,
        visible: !lineEl.hidden,
      }) as FabricCustomObject

      lineObj.customData = customData
      return lineObj
    }

    default:
      return null
  }
}

/**
 * Extracts a normalized TemplateElement from a Fabric.js object.
 */
export function extractElementFromFabricObject(
  obj: FabricCustomObject,
  zIndex: number
): TemplateElement | null {
  const custom = obj.customData || {
    id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: "rectangle" as const,
  }

  const base = {
    id: custom.id,
    name: custom.name,
    x: Math.round(obj.left || 0),
    y: Math.round(obj.top || 0),
    width: Math.round((obj.width || 100) * (obj.scaleX || 1)),
    height: Math.round((obj.height || 100) * (obj.scaleY || 1)),
    rotation: Math.round(obj.angle || 0),
    opacity: obj.opacity ?? 1,
    zIndex,
    locked: Boolean(obj.lockMovementX),
    hidden: !obj.visible,
  }

  if (obj instanceof fabric.IText || obj instanceof fabric.Textbox || custom.type === "text") {
    const textObj = obj as fabric.IText
    const weightNum = Number.parseInt(String(textObj.fontWeight || "400"), 10)
    const fontWeight = [400, 500, 600, 700].includes(weightNum)
      ? (weightNum as 400 | 500 | 600 | 700)
      : 400

    return {
      ...base,
      type: "text",
      content: custom.content || textObj.text || "Text",
      field: custom.field || undefined,
      fontFamily: textObj.fontFamily || "Inter",
      fontSize: Math.round((textObj.fontSize || 24) * (textObj.scaleY || 1)),
      fontWeight,
      color: String(textObj.fill || "#000000"),
      textAlign: (textObj.textAlign as "left" | "center" | "right") || "left",
      letterSpacing: Math.round((textObj.charSpacing || 0) / 10),
      lineHeight: textObj.lineHeight || 1.2,
    }
  }

  if (obj instanceof fabric.FabricImage || custom.type === "image") {
    const imgObj = obj as fabric.FabricImage
    return {
      ...base,
      type: "image",
      src: imgObj.getSrc ? imgObj.getSrc() : undefined,
      field: custom.field || undefined,
      objectFit: custom.objectFit || "cover",
      borderRadius: custom.borderRadius || 0,
      borderWidth: custom.borderWidth || 0,
      borderColor: custom.borderColor || undefined,
    }
  }

  if (custom.type === "qr") {
    return {
      ...base,
      type: "qr",
      data: custom.qrData || undefined,
      field: custom.field || undefined,
      color: String(obj.stroke || "#000000"),
      backgroundColor: String(obj.fill || "#ffffff"),
      errorCorrectionLevel: custom.errorCorrectionLevel || "M",
    }
  }

  if (obj instanceof fabric.Circle || custom.type === "circle") {
    return {
      ...base,
      type: "circle",
      fill: String(obj.fill || "transparent"),
      stroke: obj.stroke ? String(obj.stroke) : undefined,
      strokeWidth: obj.strokeWidth || 0,
    }
  }

  if (obj instanceof fabric.Line || custom.type === "line") {
    return {
      ...base,
      type: "line",
      color: String(obj.stroke || "#000000"),
      strokeWidth: obj.strokeWidth || 2,
    }
  }

  // Default rectangle
  const rectObj = obj as fabric.Rect
  return {
    ...base,
    type: "rectangle",
    fill: String(rectObj.fill || "transparent"),
    stroke: rectObj.stroke ? String(rectObj.stroke) : undefined,
    strokeWidth: rectObj.strokeWidth || 0,
    borderRadius: rectObj.rx || custom.borderRadius || 0,
  }
}

/**
 * Synchronizes the entire Fabric canvas into a normalized TemplateDesign schema.
 */
export function exportCanvasToDesign(
  canvas: fabric.Canvas,
  meta: {
    width: number
    height: number
    backgroundMediaId?: string
    backgroundMediaUrl?: string
    backgroundColor?: string
  }
): TemplateDesign {
  const objects = canvas.getObjects() as FabricCustomObject[]
  const elements: TemplateElement[] = []

  objects.forEach((obj, index) => {
    if ((obj as unknown as { isGuide?: boolean }).isGuide) return

    const el = extractElementFromFabricObject(obj, index + 1)
    if (el) {
      elements.push(el)
    }
  })

  return {
    version: 1,
    width: meta.width,
    height: meta.height,
    backgroundMediaId: meta.backgroundMediaId,
    backgroundMediaUrl: meta.backgroundMediaUrl,
    backgroundColor: meta.backgroundColor,
    elements,
  }
}
