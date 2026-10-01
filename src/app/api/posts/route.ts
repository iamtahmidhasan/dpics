import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { postFiltersFromSearch } from "@/lib/post-params"
import { listPublishedPosts } from "@/lib/services/post.service"

export async function GET(request: NextRequest) {
  try {
    // Public: the service only ever returns PUBLISHED posts.
    return NextResponse.json(await listPublishedPosts(postFiltersFromSearch(request.nextUrl.searchParams)))
  } catch (error) {
    return toErrorResponse(error)
  }
}