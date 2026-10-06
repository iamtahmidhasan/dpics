import { EventRegistrationStatus, EventStatus, EventType } from "@/generated/prisma/enums"

export const MAX_EVENT_TITLE_LENGTH = 150
export const MAX_EVENT_SLUG_LENGTH = 160
export const MAX_EVENT_EXCERPT_LENGTH = 300
export const MAX_EVENT_CONTENT_LENGTH = 50000
export const MAX_EVENT_VENUE_LENGTH = 200
export const MAX_EVENT_TAGS = 8
export const MAX_EVENT_TAG_LENGTH = 30
export const MAX_EVENT_IMAGES = 10

export const DEFAULT_EVENT_PAGE_SIZE = 9
export const MAX_EVENT_PAGE_SIZE = 50

export const EVENT_TYPES = Object.values(EventType) as EventType[]
export const EVENT_STATUSES = Object.values(EventStatus) as EventStatus[]
export const EVENT_REGISTRATION_STATUSES = Object.values(
  EventRegistrationStatus
) as EventRegistrationStatus[]
