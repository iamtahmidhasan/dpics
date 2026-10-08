import type { TemplateType } from "@/generated/prisma/enums"

export { TemplateType }

export type ElementType = "text" | "image" | "qr" | "rectangle" | "circle" | "line"

export interface BaseElement {
  id: string
  type: ElementType
  name?: string
  x: number           // Left position in canvas pixels
  y: number           // Top position in canvas pixels
  width: number       // Element width in canvas pixels
  height: number      // Element height in canvas pixels
  rotation?: number   // Degrees 0-360
  opacity?: number    // 0 to 1
  zIndex: number      // Stacking order
  behindTemplate?: boolean // If true, renders underneath the main template PNG image (for transparent cutouts)
  locked?: boolean    // Prevent accidental move/resize in editor
  hidden?: boolean    // Hide from canvas/rendering
}

export interface TextElement extends BaseElement {
  type: "text"
  content: string            // Default text / preview placeholder
  field?: string             // Dynamic data binding (e.g. "member.name")
  fontFamily: string         // "Inter" | "Poppins" | "Hind Siliguri" | "Roboto"
  fontSize: number           // Font size in px
  fontWeight: 400 | 500 | 600 | 700
  color: string              // Hex / rgba
  textAlign: "left" | "center" | "right"
  letterSpacing?: number     // in px
  lineHeight?: number        // multiplier (e.g. 1.2)
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
}

export interface ImageElement extends BaseElement {
  type: "image"
  src?: string               // Static URL or ImageKit URL
  field?: string             // Dynamic data binding (e.g. "member.photo", "dpics.logo")
  objectFit: "cover" | "contain" | "fill"
  borderRadius?: number      // in px (e.g. width/2 for full circular avatar)
  borderWidth?: number       // in px
  borderColor?: string       // Hex / rgba
}

export interface QRCodeElement extends BaseElement {
  type: "qr"
  data?: string              // Static fallback data or URL
  field?: string             // Dynamic data binding (e.g. "member.profileUrl")
  color?: string             // QR modules color (default #000000)
  backgroundColor?: string   // Background color (default transparent / #ffffff)
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
}

export interface RectangleElement extends BaseElement {
  type: "rectangle"
  fill: string               // Fill color (Hex / rgba / transparent)
  stroke?: string            // Border stroke color
  strokeWidth?: number       // Border width in px
  borderRadius?: number      // Corner radius in px
}

export interface CircleElement extends BaseElement {
  type: "circle"
  fill: string
  stroke?: string
  strokeWidth?: number
}

export interface LineElement extends BaseElement {
  type: "line"
  color: string
  strokeWidth: number
  orientation?: "horizontal" | "vertical"
}

export type TemplateElement =
  | TextElement
  | ImageElement
  | QRCodeElement
  | RectangleElement
  | CircleElement
  | LineElement

export interface TemplateDesign {
  version: 1
  width: number
  height: number
  backgroundMediaId?: string
  backgroundMediaUrl?: string
  backgroundColor?: string
  elements: TemplateElement[]
}

export interface DynamicFieldDefinition {
  key: string
  label: { en: string; bn: string }
  category: "member" | "event" | "course" | "achievement" | "organization" | "custom"
  type: "text" | "image" | "qr"
  exampleValue: string
  description?: { en: string; bn: string }
}

export interface MediaTemplateSummary {
  id: string
  name: string
  description: string | null
  type: TemplateType
  width: number
  height: number
  design: TemplateDesign
  isActive: boolean
  mediaId: string
  media: {
    id: string
    name: string
    url: string
    thumbnailUrl: string | null
    width: number | null
    height: number | null
  }
  createdById: string | null
  createdBy?: {
    id: string
    name: string
    email: string
  } | null
  createdAt: string
  updatedAt: string
}
