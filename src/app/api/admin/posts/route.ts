import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { postFiltersFromSearch } from "@/lib/post-params"
import { isAdmin } from "@/lib/roles"
import { requireAdminApi } from "@/lib/session"
import {
  createPostAsAdmin,
  getPostCounts,
  listPostsForAdmin,
  parsePostInput,
} from "@/lib/services/post.service"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const filters = postFiltersFromSearch(request.nextUrl.searchParams)
    const [page, counts] = await Promise.all([
      listPostsForAdmin(filters),
      getPostCounts(),
    ])

    return NextResponse.json({ ...page, counts })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const input = parsePostInput(await request.json())

    // An admin writes on the society's behalf, so the post is published
    // immediately instead of waiting in the review queue.
    return NextResponse.json(
      await createPostAsAdmin(input, "PUBLISHED", {
        userId: session.user.id,
        isAdmin: isAdmin(session.user),
      }),
      { status: 201 }
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}