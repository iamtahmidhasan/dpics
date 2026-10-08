import { NextRequest, NextResponse } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { requireAdmin } from "@/lib/session"
import prisma from "@/lib/prisma"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    await requireAdmin()
    const { assignmentId } = await params

    await prisma.mediaTemplateAssignment.deleteMany({
      where: {
        id: assignmentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return toErrorResponse(error)
  }
}
