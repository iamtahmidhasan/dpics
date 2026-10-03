import { NextResponse } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { generateNextInstructorId } from "@/lib/services/instructor-id.service"
import { requireAdminApi } from "@/lib/session"

export async function GET() {
  try {
    await requireAdminApi()
    const instructorId = await generateNextInstructorId()
    return NextResponse.json({ instructorId })
  } catch (error) {
    return toErrorResponse(error)
  }
}
