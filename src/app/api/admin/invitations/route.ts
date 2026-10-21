import { NextResponse, type NextRequest } from "next/server"

import { InvitationStatus, Role } from "@/generated/prisma/enums"
import { toErrorResponse } from "@/lib/api-error"
import { getUserRoles } from "@/lib/roles"
import {
  InvitationService,
  type CreateInvitationInput,
} from "@/lib/services/invitation.service"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()

    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get("page")) || 1
    const pageSize = Number(searchParams.get("pageSize")) || 10
    const search = searchParams.get("search") || null
    const rawStatus = searchParams.get("status")
    const rawRole = searchParams.get("role")

    const status =
      rawStatus && rawStatus !== "ALL" && Object.values(InvitationStatus).includes(rawStatus as InvitationStatus)
        ? (rawStatus as InvitationStatus)
        : rawStatus === "ALL"
          ? "ALL"
          : null

    const role =
      rawRole && rawRole !== "ALL" && Object.values(Role).includes(rawRole as Role)
        ? (rawRole as Role)
        : rawRole === "ALL"
          ? "ALL"
          : null

    const result = await InvitationService.listInvitations({
      page,
      pageSize,
      search,
      status,
      role,
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = (await request.json()) as CreateInvitationInput

    const actor = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      roles: getUserRoles(session.user),
    }

    const result = await InvitationService.createInvitation(body, actor)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return toErrorResponse(error)
  }
}
