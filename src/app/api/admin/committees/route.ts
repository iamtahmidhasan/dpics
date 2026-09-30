import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  createCommittee,
  listCommittees,
  parseCommitteeInput,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"

export async function GET() {
  try {
    await requireAdminApi()

    return NextResponse.json(await listCommittees())
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const input = parseCommitteeInput(await request.json())

    return NextResponse.json(await createCommittee(input), { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
