import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getPublishedPostBySlug } from "@/lib/services/post.service"

export async function GET(
  _request: Request,
  context: RouteContext<"/api/posts/[slug]">
) {
  try {
    const { slug } = await context.params

    // Only a PUBLISHED post resolves here, so an unpublished slug is a 404
    // rather than a hint that a draft exists.
    return NextResponse.json(await getPublishedPostBySlug(slug))
  } catch (error) {
    return toErrorResponse(error)
  }
}