import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { generateNextStudentId } from "@/lib/services/member-id.service"
import { requireAdminApi } from "@/lib/session"

export async function GET() {
  try {
    await requireAdminApi()
    const studentId = await generateNextStudentId()
    return NextResponse.json({ studentId })
  } catch (error) {
    return toErrorResponse(error)
  }
}
