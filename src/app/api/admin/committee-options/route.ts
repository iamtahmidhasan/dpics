import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  listCommitteeOptions,
  searchAssignableUsers,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()
    const { searchParams } = new URL(request.url)
    const userSearch = searchParams.get("userSearch")

    const [committees, users] = await Promise.all([
      listCommitteeOptions(),
      searchAssignableUsers(userSearch),
    ])

    return NextResponse.json({ committees, users })
  } catch (error) {
    return toErrorResponse(error)
  }
}
