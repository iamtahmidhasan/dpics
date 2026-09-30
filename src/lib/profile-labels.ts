import {
  Department,
  InstructorStatus,
  MembershipStatus,
  Role,
  Semester,
  Shift,
  VerificationStatus,
} from "@/generated/prisma/enums"
import type { LocalizedText, TFn } from "@/lib/i18n"

/** `COMPUTER_SCIENCE_AND_TECHNOLOGY` -> `Computer science and technology`. */
function humanize(value: string): string {
  const words = value.toLowerCase().split("_").filter(Boolean)

  if (words.length === 0) return value

  return words
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
}

const DEPARTMENT_LABELS: Record<Department, LocalizedText> = {
  [Department.COMPUTER_SCIENCE_AND_TECHNOLOGY]: {
    en: "Computer Science and Technology",
    bn: "কম্পিউটার সায়েন্স অ্যান্ড টেকনোলজি",
  },
  [Department.CIVIL_TECHNOLOGY]: { en: "Civil Technology", bn: "সিভিল টেকনোলজি" },
  [Department.ELECTRICAL_TECHNOLOGY]: { en: "Electrical Technology", bn: "ইলেকট্রিক্যাল টেকনোলজি" },
  [Department.ELECTRONICS_TECHNOLOGY]: { en: "Electronics Technology", bn: "ইলেকট্রনিক্স টেকনোলজি" },
  [Department.MECHANICAL_TECHNOLOGY]: { en: "Mechanical Technology", bn: "মেকানিক্যাল টেকনোলজি" },
  [Department.POWER_TECHNOLOGY]: { en: "Power Technology", bn: "পাওয়ার টেকনোলজি" },
  [Department.RAC_TECHNOLOGY]: {
    en: "Refrigeration and Air Conditioning Technology",
    bn: "রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং টেকনোলজি",
  },
  [Department.ARCHITECTURE_TECHNOLOGY]: { en: "Architecture Technology", bn: "আর্কিটেকচার টেকনোলজি" },
  [Department.FOOD_TECHNOLOGY]: { en: "Food Technology", bn: "ফুড টেকনোলজি" },
  [Department.CHEMICAL_TECHNOLOGY]: { en: "Chemical Technology", bn: "কেমিক্যাল টেকনোলজি" },
  [Department.TELECOMMUNICATION_TECHNOLOGY]: {
    en: "Telecommunication Technology",
    bn: "টেলিকমিউনিকেশন টেকনোলজি",
  },
  [Department.AUTOMOBILE_TECHNOLOGY]: { en: "Automobile Technology", bn: "অটোমোবাইল টেকনোলজি" },
  [Department.CONSTRUCTION_TECHNOLOGY]: { en: "Construction Technology", bn: "কনস্ট্রাকশন টেকনোলজি" },
  [Department.ENVIRONMENTAL_TECHNOLOGY]: {
    en: "Environmental Technology",
    bn: "এনভায়রনমেন্টাল টেকনোলজি",
  },
  [Department.GRAPHIC_DESIGN_TECHNOLOGY]: {
    en: "Graphic Design Technology",
    bn: "গ্রাফিক ডিজাইন টেকনোলজি",
  },
  [Department.SURVEYING_TECHNOLOGY]: { en: "Surveying Technology", bn: "সার্ভেইং টেকনোলজি" },
  [Department.OTHER]: { en: "Other", bn: "অন্যান্য" },
}

const SEMESTER_LABELS: Record<Semester, LocalizedText> = {
  [Semester.FIRST]: { en: "1st Semester", bn: "১ম সেমিস্টার" },
  [Semester.SECOND]: { en: "2nd Semester", bn: "২য় সেমিস্টার" },
  [Semester.THIRD]: { en: "3rd Semester", bn: "৩য় সেমিস্টার" },
  [Semester.FOURTH]: { en: "4th Semester", bn: "৪র্থ সেমিস্টার" },
  [Semester.FIFTH]: { en: "5th Semester", bn: "৫ম সেমিস্টার" },
  [Semester.SIXTH]: { en: "6th Semester", bn: "৬ষ্ঠ সেমিস্টার" },
  [Semester.SEVENTH]: { en: "7th Semester", bn: "৭ম সেমিস্টার" },
  [Semester.EIGHTH]: { en: "8th Semester", bn: "৮ম সেমিস্টার" },
}

const SHIFT_LABELS: Record<Shift, LocalizedText> = {
  [Shift.MORNING]: { en: "Morning", bn: "সকাল" },
  [Shift.DAY]: { en: "Day", bn: "দুপুর" },
}

const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, LocalizedText> = {
  [MembershipStatus.PENDING]: { en: "Pending", bn: "অপেক্ষমাণ" },
  [MembershipStatus.ACTIVE]: { en: "Active", bn: "সক্রিয়" },
  [MembershipStatus.SUSPENDED]: { en: "Suspended", bn: "স্থগিত" },
  [MembershipStatus.EXPIRED]: { en: "Expired", bn: "মেয়াদোত্তীর্ণ" },
  [MembershipStatus.REJECTED]: { en: "Rejected", bn: "বাতিল" },
  [MembershipStatus.CANCELLED]: { en: "Cancelled", bn: "বাতিলকৃত" },
}

const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, LocalizedText> = {
  [VerificationStatus.PENDING]: { en: "Pending", bn: "অপেক্ষমাণ" },
  [VerificationStatus.VERIFIED]: { en: "Verified", bn: "যাচাইকৃত" },
  [VerificationStatus.REJECTED]: { en: "Rejected", bn: "বাতিল" },
}

const INSTRUCTOR_STATUS_LABELS: Record<InstructorStatus, LocalizedText> = {
  [InstructorStatus.PENDING]: { en: "Pending", bn: "অপেক্ষমাণ" },
  [InstructorStatus.ACTIVE]: { en: "Active", bn: "সক্রিয়" },
  [InstructorStatus.SUSPENDED]: { en: "Suspended", bn: "স্থগিত" },
  [InstructorStatus.REJECTED]: { en: "Rejected", bn: "বাতিল" },
}

export const PAYMENT_METHOD_LABELS: Record<string, LocalizedText> = {
  BKASH: { en: "bKash", bn: "বিকাশ" },
  NAGAD: { en: "Nagad", bn: "নগদ" },
  ROCKET: { en: "Rocket", bn: "রকেট" },
  HAND_TO_HAND: { en: "Hand to hand", bn: "হাতে হাতে" },
  CASH: { en: "Cash", bn: "নগদ (ক্যাশ)" },
}

const ROLE_LABELS: Record<Role, LocalizedText> = {
  [Role.USER]: { en: "User", bn: "ব্যবহারকারী" },
  [Role.MEMBER]: { en: "Member", bn: "সদস্য" },
  [Role.INSTRUCTOR]: { en: "Instructor", bn: "শিক্ষক" },
  [Role.ADMIN]: { en: "Admin", bn: "প্রশাসক" },
}

export function departmentLabel(t: TFn): (value: Department) => string {
  return (value) => (DEPARTMENT_LABELS[value] ? t(DEPARTMENT_LABELS[value]) : humanize(value))
}

export function semesterLabel(t: TFn): (value: Semester) => string {
  return (value) => (SEMESTER_LABELS[value] ? t(SEMESTER_LABELS[value]) : humanize(value))
}

export function shiftLabel(t: TFn): (value: Shift) => string {
  return (value) => (SHIFT_LABELS[value] ? t(SHIFT_LABELS[value]) : humanize(value))
}

export function membershipStatusLabel(t: TFn): (value: MembershipStatus) => string {
  return (value) =>
    MEMBERSHIP_STATUS_LABELS[value] ? t(MEMBERSHIP_STATUS_LABELS[value]) : humanize(value)
}

export function verificationStatusLabel(t: TFn): (value: VerificationStatus) => string {
  return (value) =>
    VERIFICATION_STATUS_LABELS[value] ? t(VERIFICATION_STATUS_LABELS[value]) : humanize(value)
}

export function instructorStatusLabel(t: TFn): (value: InstructorStatus) => string {
  return (value) =>
    INSTRUCTOR_STATUS_LABELS[value] ? t(INSTRUCTOR_STATUS_LABELS[value]) : humanize(value)
}

export function paymentMethodLabel(t: TFn): (value: string) => string {
  return (value) => {
    const label = PAYMENT_METHOD_LABELS[value]

    return label ? t(label) : humanize(value)
  }
}

export function roleLabel(t: TFn): (value: Role) => string {
  return (value) => (ROLE_LABELS[value] ? t(ROLE_LABELS[value]) : humanize(value))
}

export { humanize }
