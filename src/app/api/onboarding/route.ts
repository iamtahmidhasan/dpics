import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { completeOnboarding, parseOnboardingInput } from "@/lib/services/onboarding.service"
import { requireUserApi } from "@/lib/session"

/** Claims the sign-up role and writes the matching record for a fresh account. */
export async function POST(request: NextRequest) {
  try {
    const session = await requireUserApi()
    const input = parseOnboardingInput(await request.json())
    const profile = await completeOnboarding(session.user.id, input)

    return NextResponse.json(profile)
  } catch (error) {
    return toErrorResponse(error)
  }
}