import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requirePostWriterApi } from "@/lib/session"
import { withdrawPost } from "@/lib/services/post.service"

/** PENDING -> DRAFT. Pulls a post back out of the review queue. */
export async function POST(_request: NextRequest, context: RouteContext<"/api/my/posts/[id]/withdraw">) {
  try {
    const session = await requirePostWriterApi()
    const { id } = await context.params

    return NextResponse.json(
      await withdrawPost(id, { userId: session.user.id, isAdmin: isAdmin(session.user) })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}