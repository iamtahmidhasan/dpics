import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import {
  getSettings,
  parseSettingsInput,
  updateSettings,
} from "@/lib/services/settings.service"
import { requireAdminApi } from "@/lib/session"

export async function GET() {
  try {
    await requireAdminApi()

    return NextResponse.json(await getSettings())
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const input = parseSettingsInput(await request.json())

    return NextResponse.json(await updateSettings(input, session.user.id))
  } catch (error) {
    return toErrorResponse(error)
  }
}
