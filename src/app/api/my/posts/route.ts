import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { postFiltersForAuthor } from "@/lib/post-params"
import { requirePostWriterApi } from "@/lib/session"
import { createPost, getMyPosts, parsePostInput } from "@/lib/services/post.service"

export async function GET(request: NextRequest) {
  try {
    const session = await requirePostWriterApi()
    const filters = postFiltersForAuthor(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    )

    return NextResponse.json(await getMyPosts(session.user.id, filters))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePostWriterApi()
    const input = parsePostInput(await request.json())

    // New posts always land in DRAFT; the author submits them for review
    // separately so nothing reaches the queue before it is finished.
    return NextResponse.json(
      await createPost(input, { userId: session.user.id, isAdmin: isAdmin(session.user) }),
      { status: 201 }
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}