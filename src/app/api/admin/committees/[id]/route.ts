import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  deleteCommittee,
  getCommitteeDetail,
  parseCommitteeInput,
  updateCommittee,
} from "@/lib/services/committee.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await context.params

    return NextResponse.json(await getCommitteeDetail(id))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    const input = parseCommitteeInput(await request.json())

    return NextResponse.json(await updateCommittee(id, input))
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi()
    const { id } = await context.params
    await deleteCommittee(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
