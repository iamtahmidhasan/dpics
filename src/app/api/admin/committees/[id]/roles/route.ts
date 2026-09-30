import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  createCommitteeRole,
  parseCommitteeRoleInput,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    const input = parseCommitteeRoleInput(await request.json())

    return NextResponse.json(await createCommitteeRole(id, input), { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
