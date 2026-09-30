import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { ApiError } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import {
  MAX_PHONE_LENGTH,
  MAX_REGISTRATION_FEE,
  isRecord,
  toBoolean,
  toOptionalText,
} from "@/lib/validation"

export const SETTING_ID = "global"

export type Settings = {
  id: string
  isSignupEnabled: boolean
  isMemberSignupEnabled: boolean
  isInstructorSignupEnabled: boolean
  isRegistrationFeeRequired: boolean
  registrationFee: number
  bkashPersonalNumber: string | null
  bkashAgentNumber: string | null
  nagadPersonalNumber: string | null
  nagadAgentNumber: string | null
  rocketPersonalNumber: string | null
  rocketAgentNumber: string | null
  updatedAt: string
  updatedById: string | null
}

export type SettingsInput = Omit<Settings, "id" | "updatedAt" | "updatedById">

export const DEFAULT_SETTINGS: Settings = {
  id: SETTING_ID,
  isSignupEnabled: true,
  isMemberSignupEnabled: true,
  isInstructorSignupEnabled: true,
  isRegistrationFeeRequired: false,
  registrationFee: 0,
  bkashPersonalNumber: null,
  bkashAgentNumber: null,
  nagadPersonalNumber: null,
  nagadAgentNumber: null,
  rocketPersonalNumber: null,
  rocketAgentNumber: null,
  updatedAt: new Date(0).toISOString(),
  updatedById: null,
}

const settingSelect = {
  id: true,
  isSignupEnabled: true,
  isMemberSignupEnabled: true,
  isInstructorSignupEnabled: true,
  isRegistrationFeeRequired: true,
  registrationFee: true,
  bkashPersonalNumber: true,
  bkashAgentNumber: true,
  nagadPersonalNumber: true,
  nagadAgentNumber: true,
  rocketPersonalNumber: true,
  rocketAgentNumber: true,
  updatedAt: true,
  updatedById: true,
} as const

function toMap(row: Prisma.SettingGetPayload<{ select: typeof settingSelect }>): Settings {
  return {
    id: row.id,
    isSignupEnabled: row.isSignupEnabled,
    isMemberSignupEnabled: row.isMemberSignupEnabled,
    isInstructorSignupEnabled: row.isInstructorSignupEnabled,
    isRegistrationFeeRequired: row.isRegistrationFeeRequired,
    registrationFee: row.registrationFee,
    bkashPersonalNumber: row.bkashPersonalNumber,
    bkashAgentNumber: row.bkashAgentNumber,
    nagadPersonalNumber: row.nagadPersonalNumber,
    nagadAgentNumber: row.nagadAgentNumber,
    rocketPersonalNumber: row.rocketPersonalNumber,
    rocketAgentNumber: row.rocketAgentNumber,
    updatedAt: row.updatedAt.toISOString(),
    updatedById: row.updatedById,
  }
}

export async function getSettings(): Promise<Settings> {
  if (!prisma.setting) {
    return DEFAULT_SETTINGS
  }

  const row = await prisma.setting.findUnique({
    where: { id: SETTING_ID },
    select: settingSelect,
  })

  if (!row) {
    return DEFAULT_SETTINGS
  }

  return toMap(row)
}

export function parseSettingsInput(body: unknown): SettingsInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid settings payload")

  const isSignupEnabled = toBoolean(body.isSignupEnabled, "Signup enabled")
  const isMemberSignupEnabled = toBoolean(body.isMemberSignupEnabled, "Member signup enabled")
  const isInstructorSignupEnabled = toBoolean(
    body.isInstructorSignupEnabled,
    "Instructor signup enabled"
  )
  const isRegistrationFeeRequired = toBoolean(
    body.isRegistrationFeeRequired,
    "Registration fee required"
  )

  let registrationFee = 0
  if (typeof body.registrationFee === "number") {
    if (!Number.isInteger(body.registrationFee) || body.registrationFee < 0) {
      throw ApiError.badRequest("Registration fee must be a non-negative whole number")
    }
    registrationFee = body.registrationFee
  } else if (typeof body.registrationFee === "string") {
    const trimmed = body.registrationFee.trim()
    if (!/^\d+$/.test(trimmed)) {
      throw ApiError.badRequest("Registration fee must be a valid whole number")
    }
    registrationFee = Number.parseInt(trimmed, 10)
  } else {
    throw ApiError.badRequest("Registration fee is required")
  }

  if (registrationFee > MAX_REGISTRATION_FEE) {
    throw ApiError.badRequest(`Registration fee cannot exceed ${MAX_REGISTRATION_FEE}`)
  }

  if (isRegistrationFeeRequired && registrationFee <= 0) {
    throw ApiError.badRequest("Registration fee must be greater than 0 when fee is required")
  }

  return {
    isSignupEnabled,
    isMemberSignupEnabled,
    isInstructorSignupEnabled,
    isRegistrationFeeRequired,
    registrationFee,
    bkashPersonalNumber: toOptionalText(
      body.bkashPersonalNumber,
      "bKash personal number",
      MAX_PHONE_LENGTH
    ),
    bkashAgentNumber: toOptionalText(body.bkashAgentNumber, "bKash agent number", MAX_PHONE_LENGTH),
    nagadPersonalNumber: toOptionalText(
      body.nagadPersonalNumber,
      "Nagad personal number",
      MAX_PHONE_LENGTH
    ),
    nagadAgentNumber: toOptionalText(body.nagadAgentNumber, "Nagad agent number", MAX_PHONE_LENGTH),
    rocketPersonalNumber: toOptionalText(
      body.rocketPersonalNumber,
      "Rocket personal number",
      MAX_PHONE_LENGTH
    ),
    rocketAgentNumber: toOptionalText(
      body.rocketAgentNumber,
      "Rocket agent number",
      MAX_PHONE_LENGTH
    ),
  }
}

export async function updateSettings(
  input: SettingsInput,
  actingAdminId: string
): Promise<Settings> {
  if (!prisma.setting) {
    throw ApiError.badRequest("Settings database table is currently unavailable")
  }

  const row = await prisma.setting.upsert({
    where: { id: SETTING_ID },
    create: {
      id: SETTING_ID,
      ...input,
      updatedById: actingAdminId,
    },
    update: {
      ...input,
      updatedById: actingAdminId,
    },
    select: settingSelect,
  })

  return toMap(row)
}
