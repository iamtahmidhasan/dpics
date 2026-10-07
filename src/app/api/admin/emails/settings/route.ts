import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import { requireAdminApi } from "@/lib/session"
import prisma from "@/lib/prisma"
import { getSmtpConfig, invalidateTransporterCache, verifySmtpConnection } from "@/lib/email/smtp"

export async function GET() {
  try {
    await requireAdminApi()

    const config = await getSmtpConfig()

    return NextResponse.json({
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        // Censor password: show if configured or empty
        hasPassword: Boolean(config.pass),
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        isEmailEnabled: config.isEmailEnabled,
      },
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminApi()
    const body = await request.json()

    const {
      host,
      port,
      secure,
      user,
      pass,
      fromEmail,
      fromName,
      isEmailEnabled,
    } = body

    const updateData: Record<string, unknown> = {
      updatedById: session.user.id,
    }

    if (host !== undefined) updateData.smtpHost = String(host).trim()
    if (port !== undefined) updateData.smtpPort = Number(port)
    if (secure !== undefined) updateData.smtpSecure = Boolean(secure)
    if (user !== undefined) updateData.smtpUser = String(user).trim()
    if (pass !== undefined && String(pass).trim().length > 0) {
      updateData.smtpPass = String(pass).trim()
    }
    if (fromEmail !== undefined) updateData.smtpFromEmail = String(fromEmail).trim()
    if (fromName !== undefined) updateData.smtpFromName = String(fromName).trim()
    if (isEmailEnabled !== undefined) updateData.isEmailEnabled = Boolean(isEmailEnabled)

    const updated = await prisma.setting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        ...updateData,
      },
      update: updateData,
    })

    // Invalidate cached transporter so fresh settings take effect immediately
    invalidateTransporterCache()

    return NextResponse.json({
      success: true,
      setting: updated,
      message: "SMTP settings saved successfully",
    })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApi()
    const body = await request.json().catch(() => ({}))

    const customConfig = body && typeof body === "object" ? {
      host: body.host,
      port: body.port,
      secure: body.secure,
      user: body.user,
      pass: body.pass,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
    } : undefined

    const result = await verifySmtpConnection(customConfig)

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
