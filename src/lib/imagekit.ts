import "server-only"

import ImageKit from "imagekit"
import { ApiError } from "@/lib/api-error"

let imagekitInstance: ImageKit | null = null

export function isImageKitConfigured(): boolean {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  )
}

export function getImageKit(): ImageKit {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw ApiError.badRequest(
      "ImageKit credentials are not configured. Please add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT to your .env file."
    )
  }

  if (!imagekitInstance) {
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })
  }

  return imagekitInstance
}

export interface ImageKitUploadResult {
  fileId: string
  name: string
  url: string
  thumbnailUrl?: string
  height?: number
  width?: number
  size: number
  filePath?: string
  fileType?: string
}

export async function uploadToImageKit({
  file,
  fileName,
  folder = "/dpics/media",
  tags = ["media-library"],
}: {
  file: Buffer | string
  fileName: string
  folder?: string
  tags?: string[]
}): Promise<ImageKitUploadResult> {
  const ik = getImageKit()

  const response = await ik.upload({
    file,
    fileName,
    folder,
    tags,
    useUniqueFileName: true,
  })

  return {
    fileId: response.fileId,
    name: response.name,
    url: response.url,
    thumbnailUrl: response.thumbnailUrl,
    height: response.height,
    width: response.width,
    size: response.size,
    filePath: response.filePath,
    fileType: response.fileType,
  }
}

export async function deleteFromImageKit(fileId: string): Promise<boolean> {
  const ik = getImageKit()

  try {
    await ik.deleteFile(fileId)
    return true
  } catch (error: unknown) {
    // If the file is already deleted or not found on ImageKit (404), don't crash
    const errObj = error as { message?: string; status?: number; statusCode?: number }
    if (errObj?.status === 404 || errObj?.statusCode === 404) {
      return false
    }
    console.error("Failed to delete file from ImageKit:", error)
    return false
  }
}
