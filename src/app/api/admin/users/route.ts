import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import { listUsers, parseUserListQuery } from "@/lib/services/user.service"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const result = await listUsers(parseUserListQuery(request.nextUrl.searchParams))

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
