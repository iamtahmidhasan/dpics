import QRCode from "qrcode"

export interface QRCodeOptions {
  color?: string
  backgroundColor?: string
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  margin?: number
  width?: number
}

/**
 * Generate high-resolution QR code as a base64 Data URL PNG.
 */
export async function generateQRCodeDataUrl(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    color = "#000000",
    backgroundColor = "#ffffff",
    errorCorrectionLevel = "M",
    margin = 1,
    width = 300,
  } = options

  try {
    const dataUrl = await QRCode.toDataURL(text || "https://dgpics.org", {
      errorCorrectionLevel,
      margin,
      width,
      color: {
        dark: color || "#000000",
        light: backgroundColor === "transparent" ? "#00000000" : backgroundColor || "#ffffff",
      },
    })
    return dataUrl
  } catch (error) {
    console.error("Failed to generate QR code data URL:", error)
    return ""
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSvg(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    color = "#000000",
    backgroundColor = "#ffffff",
    errorCorrectionLevel = "M",
    margin = 1,
    width = 300,
  } = options

  try {
    const svg = await QRCode.toString(text || "https://dgpics.org", {
      type: "svg",
      errorCorrectionLevel,
      margin,
      width,
      color: {
        dark: color || "#000000",
        light: backgroundColor === "transparent" ? "#00000000" : backgroundColor || "#ffffff",
      },
    })
    return svg
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error)
    return ""
  }
}
