import imageCompression from "browser-image-compression"

export interface CompressionOptions {
  /** Maximum file size in megabytes. Default: 1 */
  maxSizeMB?: number
  /** Maximum width or height dimension in pixels. Default: 1920 */
  maxWidthOrHeight?: number
  /** Whether to convert the image to next-gen WebP. Default: true */
  convertToWebp?: boolean
  /** Initial compression quality from 0 to 1. Default: 0.82 */
  quality?: number
  /** Progress callback (0 to 100) */
  onProgress?: (progress: number) => void
}

/**
 * Optimizes an image in the browser using Web Workers and Canvas:
 * - Converts JPEG/PNG/etc to WebP for modern web performance
 * - Resizes high-res images exceeding max width/height
 * - Compresses file size to target MB threshold
 * - Gracefully falls back to original file for PDFs, SVGs, GIFs, or on compression errors
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // 1. Bypass non-raster formats, PDFs, and vector graphics
  if (
    !file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file
  }

  const convertToWebp = options.convertToWebp !== false

  try {
    const compressionOptions = {
      maxSizeMB: options.maxSizeMB ?? 1,
      maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
      useWebWorker: true,
      fileType: convertToWebp ? "image/webp" : file.type,
      initialQuality: options.quality ?? 0.82,
      onProgress: options.onProgress,
    }

    const compressedBlob = await imageCompression(file, compressionOptions)

    // Generate output file name with appropriate extension
    let outputName = file.name
    if (convertToWebp) {
      outputName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
    }

    return new File([compressedBlob], outputName, {
      type: convertToWebp ? "image/webp" : file.type,
      lastModified: Date.now(),
    })
  } catch (error) {
    console.warn("Client image compression fallback to original file:", error)
    return file
  }
}
