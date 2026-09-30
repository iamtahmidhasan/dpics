import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  assignUserCommitteeRole,
  parseUserCommitteeRoleInput,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const input = parseUserCommitteeRoleInput(await request.json())

    return NextResponse.json(await assignUserCommitteeRole(input), { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
