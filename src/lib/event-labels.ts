import {
  EventRegistrationStatus,
  EventStatus,
  EventType,
} from "@/generated/prisma/enums"
import type { LocalizedText } from "@/lib/i18n"

export const EVENT_STATUS_LABELS: Record<EventStatus, LocalizedText> = {
  [EventStatus.UPCOMING]: { en: "Upcoming", bn: "আসন্ন" },
  [EventStatus.ONGOING]: { en: "Ongoing", bn: "চলমান" },
  [EventStatus.COMPLETED]: { en: "Completed", bn: "সম্পন্ন" },
  [EventStatus.DRAFT]: { en: "Draft", bn: "খসড়া" },
  [EventStatus.CANCELLED]: { en: "Cancelled", bn: "বাতিল" },
}

export function eventStatusLabel(status: EventStatus): LocalizedText {
  return EVENT_STATUS_LABELS[status] ?? { en: status, bn: status }
}

export const EVENT_TYPE_LABELS: Record<EventType, LocalizedText> = {
  [EventType.IN_PERSON]: { en: "In-Person", bn: "সশরীরে" },
  [EventType.ONLINE]: { en: "Online", bn: "অনলাইন" },
  [EventType.HYBRID]: { en: "Hybrid", bn: "হাইব্রিড" },
}

export function eventTypeLabel(type: EventType): LocalizedText {
  return EVENT_TYPE_LABELS[type] ?? { en: type, bn: type }
}

export const EVENT_REGISTRATION_STATUS_LABELS: Record<
  EventRegistrationStatus,
  LocalizedText
> = {
  [EventRegistrationStatus.PENDING]: { en: "Pending", bn: "অপেক্ষমান" },
  [EventRegistrationStatus.CONFIRMED]: { en: "Confirmed", bn: "নিশ্চিত" },
  [EventRegistrationStatus.ATTENDED]: { en: "Attended", bn: "উপস্থিত" },
  [EventRegistrationStatus.CANCELLED]: { en: "Cancelled", bn: "বাতিল" },
  [EventRegistrationStatus.REJECTED]: { en: "Rejected", bn: "প্রত্যাখ্যাত" },
}

export function eventRegistrationStatusLabel(
  status: EventRegistrationStatus
): LocalizedText {
  return (
    EVENT_REGISTRATION_STATUS_LABELS[status] ?? { en: status, bn: status }
  )
}

export type EventBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"

export function eventStatusBadgeVariant(status: EventStatus): EventBadgeVariant {
  switch (status) {
    case EventStatus.ONGOING:
      return "default"
    case EventStatus.UPCOMING:
      return "secondary"
    case EventStatus.COMPLETED:
      return "outline"
    case EventStatus.CANCELLED:
      return "destructive"
    case EventStatus.DRAFT:
    default:
      return "outline"
  }
}

export function eventRegistrationBadgeVariant(
  status: EventRegistrationStatus
): EventBadgeVariant {
  switch (status) {
    case EventRegistrationStatus.CONFIRMED:
    case EventRegistrationStatus.ATTENDED:
      return "default"
    case EventRegistrationStatus.PENDING:
      return "secondary"
    case EventRegistrationStatus.CANCELLED:
    case EventRegistrationStatus.REJECTED:
      return "destructive"
    default:
      return "outline"
  }
}
