import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { getProfile, parseProfileInput, updateProfile } from "@/lib/services/profile.service"
import { requireUserApi } from "@/lib/session"

export async function GET() {
  try {
    const session = await requireUserApi()
    const profile = await getProfile(session.user.id)

    return NextResponse.json(profile)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireUserApi()
    const input = parseProfileInput(await request.json())
    const profile = await updateProfile(session.user.id, input)

    return NextResponse.json(profile)
  } catch (error) {
    return toErrorResponse(error)
  }
}
