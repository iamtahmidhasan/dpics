import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { isAdmin } from "@/lib/roles"
import { requirePostWriterApi } from "@/lib/session"
import { submitPost } from "@/lib/services/post.service"

/** DRAFT / REJECTED -> PENDING. The author cannot approve their own post. */
export async function POST(_request: NextRequest, context: RouteContext<"/api/my/posts/[id]/submit">) {
  try {
    const session = await requirePostWriterApi()
    const { id } = await context.params

    return NextResponse.json(
      await submitPost(id, { userId: session.user.id, isAdmin: isAdmin(session.user) })
    )
  } catch (error) {
    return toErrorResponse(error)
  }
}