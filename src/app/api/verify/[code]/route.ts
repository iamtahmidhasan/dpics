import { NextResponse, type NextRequest } from "next/server"
import { toErrorResponse } from "@/lib/api-error"
import { VerificationService } from "@/lib/services/verification.service"
import { getSession, isAdmin } from "@/lib/session"

type RouteContext = {
  params: Promise<{ code: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params
    const decoded = decodeURIComponent(code)

    const [result, session] = await Promise.all([
      VerificationService.verifyCode(decoded),
      getSession(),
    ])

    const userIsAdmin = session?.user ? isAdmin(session.user) : false

    return NextResponse.json({
      ...result,
      isAdmin: userIsAdmin,
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}
