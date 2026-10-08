import type { DynamicFieldDefinition, TemplateType } from "./types"

export const DYNAMIC_FIELDS: DynamicFieldDefinition[] = [
  // --- Member Fields ---
  {
    key: "member.name",
    label: { en: "Full Name", bn: "পুরো নাম" },
    category: "member",
    type: "text",
    exampleValue: "Tahmid Hasan",
  },
  {
    key: "member.studentId",
    label: { en: "Student ID", bn: "স্টুডেন্ট আইডি" },
    category: "member",
    type: "text",
    exampleValue: "DPI-2024-0012",
  },
  {
    key: "member.boardRoll",
    label: { en: "Board / Class Roll", bn: "বোর্ড / রোল নম্বর" },
    category: "member",
    type: "text",
    exampleValue: "612450",
  },
  {
    key: "member.department",
    label: { en: "Department", bn: "বিভাগ" },
    category: "member",
    type: "text",
    exampleValue: "Computer Technology",
  },
  {
    key: "member.semester",
    label: { en: "Semester", bn: "পর্ব" },
    category: "member",
    type: "text",
    exampleValue: "6th Semester",
  },
  {
    key: "member.session",
    label: { en: "Session", bn: "সেশন" },
    category: "member",
    type: "text",
    exampleValue: "2021-2022",
  },
  {
    key: "member.shift",
    label: { en: "Shift", bn: "শিফট" },
    category: "member",
    type: "text",
    exampleValue: "1st Shift",
  },
  {
    key: "member.bloodGroup",
    label: { en: "Blood Group", bn: "রক্তের গ্রুপ" },
    category: "member",
    type: "text",
    exampleValue: "B+",
  },
  {
    key: "member.phone",
    label: { en: "Phone Number", bn: "ফোন নম্বর" },
    category: "member",
    type: "text",
    exampleValue: "+8801712345678",
  },
  {
    key: "member.email",
    label: { en: "Email Address", bn: "ইমেইল ঠিকানা" },
    category: "member",
    type: "text",
    exampleValue: "member@dgpics.org",
  },
  {
    key: "member.joinDate",
    label: { en: "Join Date", bn: "যোগদানের তারিখ" },
    category: "member",
    type: "text",
    exampleValue: "15 Jan 2024",
  },
  {
    key: "member.validUntil",
    label: { en: "Valid Until", bn: "মেয়াদ" },
    category: "member",
    type: "text",
    exampleValue: "31 Dec 2026",
  },
  {
    key: "member.photo",
    label: { en: "Member Photo", bn: "সদস্যের ছবি" },
    category: "member",
    type: "image",
    exampleValue: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20fill%3D%22%23cbd5e1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2275%22%20r%3D%2235%22%20fill%3D%22%2394a3b8%22%2F%3E%3Cpath%20d%3D%22M40%20170%20C40%20130%2C%2070%20120%2C%20100%20120%20C130%20120%2C%20160%20130%2C%20160%20170%20Z%22%20fill%3D%22%2394a3b8%22%2F%3E%3C%2Fsvg%3E",
  },
  {
    key: "member.profileUrl",
    label: { en: "Profile URL", bn: "প্রোফাইল লিংক" },
    category: "member",
    type: "text",
    exampleValue: "https://dgpics.org/u/tahmid",
  },
  {
    key: "member.qrCode",
    label: { en: "Profile QR Code", bn: "প্রোফাইল কিউআর কোড" },
    category: "member",
    type: "qr",
    exampleValue: "https://dgpics.org/u/tahmid",
  },

  // --- Event Fields ---
  {
    key: "event.title",
    label: { en: "Event Title", bn: "ইভেন্টের নাম" },
    category: "event",
    type: "text",
    exampleValue: "DPICS Intra Poly Tech Fest 2026",
  },
  {
    key: "event.date",
    label: { en: "Event Date", bn: "ইভেন্টের তারিখ" },
    category: "event",
    type: "text",
    exampleValue: "24 Nov 2026",
  },
  {
    key: "event.venue",
    label: { en: "Venue", bn: "স্থান" },
    category: "event",
    type: "text",
    exampleValue: "DPI Campus Auditorium",
  },
  {
    key: "event.attendeeName",
    label: { en: "Participant Name", bn: "অংশগ্রহণকারীর নাম" },
    category: "event",
    type: "text",
    exampleValue: "Tahmid Hasan",
  },
  {
    key: "event.ticketCode",
    label: { en: "Ticket Code", bn: "টিকেট কোড" },
    category: "event",
    type: "text",
    exampleValue: "TKT-2026-8941",
  },
  {
    key: "event.qrCode",
    label: { en: "Ticket Verification QR", bn: "টিকেট যাচাইকরণ কিউআর" },
    category: "event",
    type: "qr",
    exampleValue: "https://dgpics.org/verify/ticket/TKT-2026-8941",
  },

  // --- Course / Certificate Fields ---
  {
    key: "course.title",
    label: { en: "Course Title", bn: "কোর্সের নাম" },
    category: "course",
    type: "text",
    exampleValue: "Full-Stack Web Development with Next.js",
  },
  {
    key: "course.instructor",
    label: { en: "Instructor Name", bn: "প্রশিক্ষকের নাম" },
    category: "course",
    type: "text",
    exampleValue: "Engr. Monirul Islam",
  },
  {
    key: "certificate.issueDate",
    label: { en: "Issue Date", bn: "ইস্যুর তারিখ" },
    category: "course",
    type: "text",
    exampleValue: "08 Oct 2026",
  },
  {
    key: "certificate.certificateId",
    label: { en: "Certificate ID", bn: "সার্টিফিকেট আইডি" },
    category: "course",
    type: "text",
    exampleValue: "CERT-DPICS-2026-0812",
  },
  {
    key: "certificate.qrCode",
    label: { en: "Certificate Verification QR", bn: "সার্টিফিকেট যাচাইকরণ কিউআর" },
    category: "course",
    type: "qr",
    exampleValue: "https://dgpics.org/verify/cert/CERT-DPICS-2026-0812",
  },

  // --- Achievement Fields ---
  {
    key: "achievement.title",
    label: { en: "Achievement Title", bn: "অর্জনের শিরোনাম" },
    category: "achievement",
    type: "text",
    exampleValue: "National Skills Competition Champion 2026",
  },
  {
    key: "achievement.winnerName",
    label: { en: "Awardee Name", bn: "পুরস্কারপ্রাপ্তের নাম" },
    category: "achievement",
    type: "text",
    exampleValue: "Tahmid Hasan",
  },

  // --- Organization / Branding Fields ---
  {
    key: "dpics.name",
    label: { en: "Organization Name", bn: "সংগঠনের নাম" },
    category: "organization",
    type: "text",
    exampleValue: "Dhaka Polytechnic Institute Computing Society",
  },
  {
    key: "dpics.shortName",
    label: { en: "Short Name", bn: "সংক্ষিপ্ত নাম" },
    category: "organization",
    type: "text",
    exampleValue: "DPICS",
  },
  {
    key: "dpics.logo",
    label: { en: "DPICS Logo", bn: "ডিপিআইসিএস লোগো" },
    category: "organization",
    type: "image",
    exampleValue: "/DPICS_logo_vector.svg",
  },
  {
    key: "dpics.website",
    label: { en: "Official Website", bn: "অফিসিয়াল ওয়েবসাইট" },
    category: "organization",
    type: "text",
    exampleValue: "https://dgpics.org",
  },
]

export function getFieldsForTemplateType(type: TemplateType): DynamicFieldDefinition[] {
  switch (type) {
    case "MEMBER_CARD":
      return DYNAMIC_FIELDS.filter(
        (f) => f.category === "member" || f.category === "organization"
      )
    case "EVENT_PASS":
      return DYNAMIC_FIELDS.filter(
        (f) => f.category === "event" || f.category === "member" || f.category === "organization"
      )
    case "CERTIFICATE":
    case "COURSE_CERTIFICATE":
      return DYNAMIC_FIELDS.filter(
        (f) => f.category === "course" || f.category === "member" || f.category === "organization"
      )
    case "ACHIEVEMENT":
      return DYNAMIC_FIELDS.filter(
        (f) => f.category === "achievement" || f.category === "member" || f.category === "organization"
      )
    default:
      return DYNAMIC_FIELDS
  }
}

export function getFieldDefinition(key: string): DynamicFieldDefinition | undefined {
  return DYNAMIC_FIELDS.find((f) => f.key === key)
}
