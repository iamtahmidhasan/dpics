import { BadgeCheck, Wrench, type LucideIcon } from "lucide-react"

import { Role } from "@/generated/prisma/enums"
import type { LocalizedText } from "@/lib/i18n"
import type { SelfAssignableRole } from "@/lib/roles"

export const MIN_PASSWORD_LENGTH = 8

/** The signup timeline, in order. */
export const SIGNUP_STEPS = ["account", "role", "details"] as const

export type SignupStep = (typeof SIGNUP_STEPS)[number]

export const LAST_STEP = SIGNUP_STEPS.length - 1

const STEP_LABELS: Record<SignupStep, LocalizedText> = {
  account: { en: "Account", bn: "অ্যাকাউন্ট" },
  role: { en: "Role", bn: "ভূমিকা" },
  details: { en: "Details", bn: "বিবরণ" },
}

const DETAILS_LABELS: Record<SelfAssignableRole, LocalizedText> = {
  [Role.MEMBER]: { en: "Member details", bn: "সদস্যের বিবরণ" },
  [Role.INSTRUCTOR]: { en: "Instructor details", bn: "শিক্ষকের বিবরণ" },
}

export type RoleOption = {
  role: SelfAssignableRole
  icon: LucideIcon
  title: LocalizedText
  description: LocalizedText
  highlights: LocalizedText[]
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    role: Role.MEMBER,
    icon: BadgeCheck,
    title: { en: "Member", bn: "সদস্য" },
    description: {
      en: "For students joining the society as a regular member.",
      bn: "যারা সমিতিতে সাধারণ সদস্য হিসেবে যোগ দিতে চান, তাদের জন্য।",
    },
    highlights: [
      { en: "Whatsapp, session and department", bn: "হোয়াটসঅ্যাপ, সেশন ও বিভাগ" },
      { en: "Semester and shift", bn: "সেমিস্টার ও শিফট" },
      { en: "Student id and documents for verification", bn: "স্টুডেন্ট আইডি ও যাচাইয়ের কাগজপত্র" },
    ],
  },
  {
    role: Role.INSTRUCTOR,
    icon: Wrench,
    title: { en: "Instructor", bn: "শিক্ষক" },
    description: {
      en: "For teachers and senior members who run sessions for the society.",
      bn: "যারা সমিতির অনুষ্ঠান পরিচালনা করেন, তাদের জন্য।",
    },
    highlights: [
      { en: "Instructor id", bn: "শিক্ষক আইডি" },
      { en: "Expertise", bn: "বিশেষজ্ঞতা" },
      { en: "Short bio for the society page", bn: "সমিতির পেজের জন্য সংক্ষিপ্ত পরিচিতি" },
    ],
  },
]

/** The `details` step is named after whichever role was picked on the step before. */
export function stepLabel(step: SignupStep, role: SelfAssignableRole | null): LocalizedText {
  if (step !== "details") return STEP_LABELS[step]

  return role ? DETAILS_LABELS[role] : STEP_LABELS.details
}

export function roleOption(role: SelfAssignableRole): RoleOption {
  return ROLE_OPTIONS.find((option) => option.role === role) ?? ROLE_OPTIONS[0]
}