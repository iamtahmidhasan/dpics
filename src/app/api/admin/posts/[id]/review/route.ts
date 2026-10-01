import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requireAdminApi } from "@/lib/session"
import { parseReviewInput, reviewPost } from "@/lib/services/post.service"

/**
 * The moderation decision. `{ decision: "APPROVE" }` publishes, and
 * `{ decision: "REJECT", reason }` sends it back to the author with a note.
 */
export async function POST(request: NextRequest, context: RouteContext<"/api/admin/posts/[id]/review">) {
  try {
    const session = await requireAdminApi()
    const { id } = await context.params
    const input = parseReviewInput(await request.json())

    return NextResponse.json(
      await reviewPost(id, input, { userId: session.user.id, isAdmin: isAdmin(session.user) })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}