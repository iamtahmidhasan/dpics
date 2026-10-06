export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const

export type BloodGroup = (typeof BLOOD_GROUPS)[number]

export function isValidBloodGroup(val: string | null | undefined): boolean {
  if (!val) return false
  return BLOOD_GROUPS.includes(val.trim().toUpperCase() as BloodGroup)
}
