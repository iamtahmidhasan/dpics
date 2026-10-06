import "server-only"

import { Prisma } from "@/generated/prisma/client"
import {
  Department,
  EventRegistrationStatus,
  EventStatus,
  EventType,
  PaymentMethod,
  Semester,
  Shift,
} from "@/generated/prisma/enums"
import { ApiError } from "@/lib/api-error"
import { deriveExcerpt } from "@/lib/markdown"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import {
  isRecord,
  toBoolean,
  toDateTime,
  toEnum,
  toOptionalEnum,
  toOptionalText,
  toText,
  toUrl,
} from "@/lib/validation"
import {
  DEFAULT_EVENT_PAGE_SIZE,
  EVENT_REGISTRATION_STATUSES,
  EVENT_STATUSES,
  EVENT_TYPES,
  MAX_EVENT_CONTENT_LENGTH,
  MAX_EVENT_EXCERPT_LENGTH,
  MAX_EVENT_IMAGES,
  MAX_EVENT_PAGE_SIZE,
  MAX_EVENT_SLUG_LENGTH,
  MAX_EVENT_TAGS,
  MAX_EVENT_TAG_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
  MAX_EVENT_VENUE_LENGTH,
} from "@/lib/event-constants"
import { toEventSlug } from "@/lib/event-slug"

// ============================================================================
// DTOs & Types
// ============================================================================

export type GuestSpeaker = {
  name: string
  nameBn?: string | null
  role: string
  roleBn?: string | null
  company?: string | null
  avatar?: string | null
  bio?: string | null
}

export type EventAuthor = {
  id: string
  name: string
  email?: string
  avatar: string | null
}

export type EventCategoryInfo = {
  id: string
  name: string
  nameBn: string | null
  slug: string
}

export type EventSummary = {
  id: string
  title: string
  titleBn: string | null
  slug: string
  excerpt: string | null
  excerptBn: string | null
  coverImage: string | null
  eventType: EventType
  status: EventStatus
  startDate: string
  endDate: string | null
  registrationDeadline: string | null
  venue: string | null
  venueBn: string | null
  locationMapUrl: string | null
  onlineJoinUrl: string | null
  categoryId: string | null
  category: EventCategoryInfo | null
  tags: string[]
  isFeatured: boolean
  isRegistrationOpen: boolean
  isFree: boolean
  registrationFee: number
  maxParticipants: number | null
  confirmedRegistrationsCount: number
  totalRegistrationsCount: number
  isFull: boolean
  author: EventAuthor
  createdAt: string
  updatedAt: string
}

export type EventDetail = EventSummary & {
  content: string
  contentBn: string | null
  images: string[]
  guestSpeakers: GuestSpeaker[]
}

export type EventPage<T> = {
  events: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type EventListFilters = {
  page?: number
  pageSize?: number
  category?: string | null
  tag?: string | null
  q?: string | null
  status?: EventStatus | null
  type?: EventType | null
  timeframe?: "upcoming" | "past" | "all" | null
  isFeatured?: boolean
}

export type EventInput = {
  title: string
  titleBn?: string | null
  slug?: string
  excerpt?: string | null
  excerptBn?: string | null
  content: string
  contentBn?: string | null
  coverImage?: string | null
  images?: string[]
  eventType: EventType
  status: EventStatus
  startDate: Date
  endDate?: Date | null
  registrationDeadline?: Date | null
  venue?: string | null
  venueBn?: string | null
  locationMapUrl?: string | null
  onlineJoinUrl?: string | null
  categoryId?: string | null
  tags?: string[]
  isFeatured?: boolean
  isRegistrationOpen?: boolean
  isFree?: boolean
  registrationFee?: number
  maxParticipants?: number | null
  guestSpeakers?: GuestSpeaker[]
}

export type EventUpdateInput = Partial<EventInput>

export type EventRegistrationInput = {
  name: string
  email: string
  phone: string
  studentId?: string | null
  department?: Department | null
  semester?: Semester | null
  shift?: Shift | null
  institution?: string | null
  paymentMethod?: PaymentMethod | null
  senderNumber?: string | null
  transactionId?: string | null
  notes?: string | null
}

export type EventRegistrationSummary = {
  id: string
  eventId: string
  eventTitle: string
  userId: string | null
  name: string
  email: string
  phone: string
  studentId: string | null
  department: Department | null
  semester: Semester | null
  shift: Shift | null
  institution: string | null
  status: EventRegistrationStatus
  ticketCode: string
  paymentMethod: PaymentMethod | null
  senderNumber: string | null
  transactionId: string | null
  amountPaid: number
  notes: string | null
  registeredAt: string
  confirmedAt: string | null
  createdAt: string
}

const CATEGORY_SELECT = {
  id: true,
  name: true,
  nameBn: true,
  slug: true,
} as const

const AUTHOR_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  selactedImg: true,
} as const

type EventRow = Prisma.EventGetPayload<{
  include: {
    category: { select: typeof CATEGORY_SELECT }
    author: { select: typeof AUTHOR_SELECT }
    _count: {
      select: {
        registrations: true
      }
    }
  }
}> & {
  confirmedCount?: number
}

function mapSummary(row: EventRow, confirmedCount = 0): EventSummary {
  const totalCount = row._count?.registrations ?? 0
  const isFull =
    row.maxParticipants != null &&
    row.maxParticipants > 0 &&
    confirmedCount >= row.maxParticipants

  return {
    id: row.id,
    title: row.title,
    titleBn: row.titleBn,
    slug: row.slug,
    excerpt: row.excerpt,
    excerptBn: row.excerptBn,
    coverImage: row.coverImage,
    eventType: row.eventType,
    status: row.status,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
    registrationDeadline: row.registrationDeadline
      ? row.registrationDeadline.toISOString()
      : null,
    venue: row.venue,
    venueBn: row.venueBn,
    locationMapUrl: row.locationMapUrl,
    onlineJoinUrl: row.onlineJoinUrl,
    categoryId: row.categoryId,
    category: row.category,
    tags: row.tags,
    isFeatured: row.isFeatured,
    isRegistrationOpen: row.isRegistrationOpen,
    isFree: row.isFree,
    registrationFee: row.registrationFee,
    maxParticipants: row.maxParticipants,
    confirmedRegistrationsCount: confirmedCount,
    totalRegistrationsCount: totalCount,
    isFull,
    author: {
      id: row.author.id,
      name: row.author.name,
      email: row.author.email,
      avatar: resolveUserImage(row.author.image, row.author.selactedImg).avatar,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapDetail(row: EventRow, confirmedCount = 0): EventDetail {
  const summary = mapSummary(row, confirmedCount)
  let speakers: GuestSpeaker[] = []
  if (Array.isArray(row.guestSpeakers)) {
    speakers = row.guestSpeakers as unknown as GuestSpeaker[]
  }

  return {
    ...summary,
    content: row.content,
    contentBn: row.contentBn,
    images: row.images,
    guestSpeakers: speakers,
  }
}

// ============================================================================
// Public Queries
// ============================================================================

export async function listPublishedEvents(
  filters: EventListFilters = {}
): Promise<EventPage<EventSummary>> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(
    MAX_EVENT_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? DEFAULT_EVENT_PAGE_SIZE)
  )

  const now = new Date()

  // Base visibility: UPCOMING, ONGOING, COMPLETED
  const where: Prisma.EventWhereInput = {
    status: filters.status
      ? filters.status
      : { in: [EventStatus.UPCOMING, EventStatus.ONGOING, EventStatus.COMPLETED] },
  }

  if (filters.timeframe === "upcoming") {
    where.startDate = { gte: now }
    if (!filters.status) {
      where.status = { in: [EventStatus.UPCOMING, EventStatus.ONGOING] }
    }
  } else if (filters.timeframe === "past") {
    where.OR = [
      { startDate: { lt: now } },
      { status: EventStatus.COMPLETED },
    ]
  }

  if (filters.type) {
    where.eventType = filters.type
  }

  if (filters.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured
  }

  if (filters.category) {
    where.category = {
      slug: filters.category,
      type: "EVENT",
      isActive: true,
    }
  }

  if (filters.tag) {
    where.tags = { has: filters.tag }
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { titleBn: { contains: filters.q, mode: "insensitive" } },
      { excerpt: { contains: filters.q, mode: "insensitive" } },
      { excerptBn: { contains: filters.q, mode: "insensitive" } },
      { venue: { contains: filters.q, mode: "insensitive" } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { startDate: filters.timeframe === "past" ? "desc" : "asc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
        _count: {
          select: { registrations: true },
        },
      },
    }),
  ])

  // Get confirmed registration counts
  const eventIds = rows.map((r) => r.id)
  const confirmedCounts = await prisma.eventRegistration.groupBy({
    by: ["eventId"],
    where: {
      eventId: { in: eventIds },
      status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
    },
    _count: { _all: true },
  })
  const confirmedMap = new Map<string, number>()
  for (const c of confirmedCounts) {
    confirmedMap.set(c.eventId, c._count._all)
  }

  return {
    events: rows.map((r) => mapSummary(r as EventRow, confirmedMap.get(r.id) ?? 0)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function getPublishedEventBySlug(slug: string): Promise<EventDetail> {
  const row = await prisma.event.findUnique({
    where: { slug },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
      _count: {
        select: { registrations: true },
      },
    },
  })

  if (!row) {
    throw ApiError.notFound("Event not found")
  }

  if (row.status === EventStatus.DRAFT) {
    throw ApiError.notFound("Event is currently not public")
  }

  const confirmedCount = await prisma.eventRegistration.count({
    where: {
      eventId: row.id,
      status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
    },
  })

  return mapDetail(row as EventRow, confirmedCount)
}

// ============================================================================
// Admin Queries & CRUD
// ============================================================================

export async function listEventsForAdmin(
  filters: EventListFilters = {}
): Promise<EventPage<EventSummary>> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(
    MAX_EVENT_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? DEFAULT_EVENT_PAGE_SIZE)
  )

  const where: Prisma.EventWhereInput = {}

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.type) {
    where.eventType = filters.type
  }

  if (filters.category) {
    where.category = { slug: filters.category }
  }

  if (filters.tag) {
    where.tags = { has: filters.tag }
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { titleBn: { contains: filters.q, mode: "insensitive" } },
      { venue: { contains: filters.q, mode: "insensitive" } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: [{ startDate: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: CATEGORY_SELECT },
        author: { select: AUTHOR_SELECT },
        _count: {
          select: { registrations: true },
        },
      },
    }),
  ])

  const eventIds = rows.map((r) => r.id)
  const confirmedCounts = await prisma.eventRegistration.groupBy({
    by: ["eventId"],
    where: {
      eventId: { in: eventIds },
      status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
    },
    _count: { _all: true },
  })
  const confirmedMap = new Map<string, number>()
  for (const c of confirmedCounts) {
    confirmedMap.set(c.eventId, c._count._all)
  }

  return {
    events: rows.map((r) => mapSummary(r as EventRow, confirmedMap.get(r.id) ?? 0)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

export async function getEventById(id: string): Promise<EventDetail> {
  const row = await prisma.event.findUnique({
    where: { id },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
      _count: {
        select: { registrations: true },
      },
    },
  })

  if (!row) {
    throw ApiError.notFound("Event not found")
  }

  const confirmedCount = await prisma.eventRegistration.count({
    where: {
      eventId: row.id,
      status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
    },
  })

  return mapDetail(row as EventRow, confirmedCount)
}

export async function getEventCounts(): Promise<
  Record<EventStatus, number> & { total: number }
> {
  const counts = await prisma.event.groupBy({
    by: ["status"],
    _count: { status: true },
  })

  const result: Record<EventStatus, number> & { total: number } = {
    [EventStatus.UPCOMING]: 0,
    [EventStatus.ONGOING]: 0,
    [EventStatus.COMPLETED]: 0,
    [EventStatus.DRAFT]: 0,
    [EventStatus.CANCELLED]: 0,
    total: 0,
  }

  for (const c of counts) {
    result[c.status] = c._count.status
    result.total += c._count.status
  }

  return result
}

export async function createEventAsAdmin(
  input: EventInput,
  actor: { userId: string }
): Promise<EventDetail> {
  let slug = input.slug || toEventSlug(input.title)
  if (!slug) slug = `event-${Date.now()}`

  // Ensure unique slug
  let uniqueSlug = slug
  let counter = 1
  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`
    counter++
  }

  const excerpt =
    input.excerpt || deriveExcerpt(input.content, null, MAX_EVENT_EXCERPT_LENGTH)
  const excerptBn =
    input.excerptBn ||
    (input.contentBn ? deriveExcerpt(input.contentBn, null, MAX_EVENT_EXCERPT_LENGTH) : null)

  const row = await prisma.event.create({
    data: {
      title: input.title,
      titleBn: input.titleBn,
      slug: uniqueSlug,
      excerpt,
      excerptBn,
      content: input.content,
      contentBn: input.contentBn,
      coverImage: input.coverImage,
      images: input.images ?? [],
      eventType: input.eventType,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      registrationDeadline: input.registrationDeadline,
      venue: input.venue,
      venueBn: input.venueBn,
      locationMapUrl: input.locationMapUrl,
      onlineJoinUrl: input.onlineJoinUrl,
      categoryId: input.categoryId,
      tags: input.tags ?? [],
      isFeatured: input.isFeatured ?? false,
      isRegistrationOpen: input.isRegistrationOpen ?? true,
      isFree: input.isFree ?? true,
      registrationFee: input.registrationFee ?? 0,
      maxParticipants: input.maxParticipants,
      guestSpeakers: (input.guestSpeakers ?? []) as unknown as Prisma.InputJsonValue,
      authorId: actor.userId,
    },
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
      _count: {
        select: { registrations: true },
      },
    },
  })

  return mapDetail(row as EventRow, 0)
}

export async function updateEventAsAdmin(
  id: string,
  input: EventUpdateInput
): Promise<EventDetail> {
  const current = await prisma.event.findUnique({ where: { id } })
  if (!current) throw ApiError.notFound("Event not found")

  let newSlug = current.slug
  if (input.slug && input.slug !== current.slug) {
    const candidate = toEventSlug(input.slug)
    const existing = await prisma.event.findUnique({ where: { slug: candidate } })
    if (existing && existing.id !== id) {
      throw ApiError.conflict("An event with this slug already exists")
    }
    newSlug = candidate
  }

  const updateData: Prisma.EventUpdateInput = {}

  if (input.title !== undefined) updateData.title = input.title
  if (input.titleBn !== undefined) updateData.titleBn = input.titleBn
  if (input.slug !== undefined) updateData.slug = newSlug
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt
  if (input.excerptBn !== undefined) updateData.excerptBn = input.excerptBn
  if (input.content !== undefined) updateData.content = input.content
  if (input.contentBn !== undefined) updateData.contentBn = input.contentBn
  if (input.coverImage !== undefined) updateData.coverImage = input.coverImage
  if (input.images !== undefined) updateData.images = input.images
  if (input.eventType !== undefined) updateData.eventType = input.eventType
  if (input.status !== undefined) updateData.status = input.status
  if (input.startDate !== undefined) updateData.startDate = input.startDate
  if (input.endDate !== undefined) updateData.endDate = input.endDate
  if (input.registrationDeadline !== undefined)
    updateData.registrationDeadline = input.registrationDeadline
  if (input.venue !== undefined) updateData.venue = input.venue
  if (input.venueBn !== undefined) updateData.venueBn = input.venueBn
  if (input.locationMapUrl !== undefined) updateData.locationMapUrl = input.locationMapUrl
  if (input.onlineJoinUrl !== undefined) updateData.onlineJoinUrl = input.onlineJoinUrl
  if (input.categoryId !== undefined) {
    updateData.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true }
  }
  if (input.tags !== undefined) updateData.tags = input.tags
  if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured
  if (input.isRegistrationOpen !== undefined)
    updateData.isRegistrationOpen = input.isRegistrationOpen
  if (input.isFree !== undefined) updateData.isFree = input.isFree
  if (input.registrationFee !== undefined)
    updateData.registrationFee = input.registrationFee
  if (input.maxParticipants !== undefined)
    updateData.maxParticipants = input.maxParticipants
  if (input.guestSpeakers !== undefined) {
    updateData.guestSpeakers = input.guestSpeakers as unknown as Prisma.InputJsonValue
  }

  const row = await prisma.event.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: CATEGORY_SELECT },
      author: { select: AUTHOR_SELECT },
      _count: {
        select: { registrations: true },
      },
    },
  })

  const confirmedCount = await prisma.eventRegistration.count({
    where: {
      eventId: row.id,
      status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
    },
  })

  return mapDetail(row as EventRow, confirmedCount)
}

export async function deleteEventAsAdmin(id: string): Promise<{ success: true }> {
  const current = await prisma.event.findUnique({ where: { id } })
  if (!current) throw ApiError.notFound("Event not found")

  await prisma.event.delete({ where: { id } })
  return { success: true }
}

// ============================================================================
// Registration & Ticketing
// ============================================================================

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let part1 = ""
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)]
  }
  let part2 = ""
  for (let i = 0; i < 4; i++) {
    part2 += chars[Math.floor(Math.random() * chars.length)]
  }
  return `EVT-${part1}-${part2}`
}

export async function registerForEvent(
  eventId: string,
  input: EventRegistrationInput,
  currentUser?: { id: string } | null
): Promise<EventRegistrationSummary> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      isRegistrationOpen: true,
      registrationDeadline: true,
      maxParticipants: true,
      isFree: true,
      registrationFee: true,
    },
  })

  if (!event) throw ApiError.notFound("Event not found")

  if (
    event.status === EventStatus.COMPLETED ||
    event.status === EventStatus.CANCELLED ||
    !event.isRegistrationOpen
  ) {
    throw ApiError.badRequest("Registration for this event is closed")
  }

  const now = new Date()
  if (event.registrationDeadline && now > event.registrationDeadline) {
    throw ApiError.badRequest("Registration deadline has passed")
  }

  // Check capacity
  if (event.maxParticipants && event.maxParticipants > 0) {
    const confirmedCount = await prisma.eventRegistration.count({
      where: {
        eventId: event.id,
        status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
      },
    })
    if (confirmedCount >= event.maxParticipants) {
      throw ApiError.badRequest("This event is fully booked")
    }
  }

  // Duplicate check
  const duplicate = await prisma.eventRegistration.findFirst({
    where: {
      eventId: event.id,
      OR: [
        { email: { equals: input.email, mode: "insensitive" } },
        ...(currentUser ? [{ userId: currentUser.id }] : []),
      ],
      status: { notIn: [EventRegistrationStatus.CANCELLED, EventRegistrationStatus.REJECTED] },
    },
  })

  if (duplicate) {
    throw ApiError.conflict(
      "You have already registered for this event with this email or account"
    )
  }

  // Ensure unique ticket code
  let ticketCode = generateTicketCode()
  while (await prisma.eventRegistration.findUnique({ where: { ticketCode } })) {
    ticketCode = generateTicketCode()
  }

  // If free event, automatically CONFIRMED. If paid, PENDING until payment checked.
  const initialStatus: EventRegistrationStatus = event.isFree
    ? EventRegistrationStatus.CONFIRMED
    : EventRegistrationStatus.PENDING

  const reg = await prisma.eventRegistration.create({
    data: {
      eventId: event.id,
      userId: currentUser?.id ?? null,
      name: input.name,
      email: input.email.toLowerCase().trim(),
      phone: input.phone,
      studentId: input.studentId,
      department: input.department,
      semester: input.semester,
      shift: input.shift,
      institution: input.institution,
      status: initialStatus,
      ticketCode,
      paymentMethod: input.paymentMethod,
      senderNumber: input.senderNumber,
      transactionId: input.transactionId,
      amountPaid: event.isFree ? 0 : event.registrationFee,
      notes: input.notes,
      confirmedAt: initialStatus === EventRegistrationStatus.CONFIRMED ? new Date() : null,
    },
  })

  return {
    id: reg.id,
    eventId: reg.eventId,
    eventTitle: event.title,
    userId: reg.userId,
    name: reg.name,
    email: reg.email,
    phone: reg.phone,
    studentId: reg.studentId,
    department: reg.department,
    semester: reg.semester,
    shift: reg.shift,
    institution: reg.institution,
    status: reg.status,
    ticketCode: reg.ticketCode,
    paymentMethod: reg.paymentMethod,
    senderNumber: reg.senderNumber,
    transactionId: reg.transactionId,
    amountPaid: reg.amountPaid,
    notes: reg.notes,
    registeredAt: reg.registeredAt.toISOString(),
    confirmedAt: reg.confirmedAt ? reg.confirmedAt.toISOString() : null,
    createdAt: reg.createdAt.toISOString(),
  }
}

export async function listEventRegistrations(
  eventId: string,
  params: {
    status?: EventRegistrationStatus | null
    q?: string | null
    page?: number
    pageSize?: number
  } = {}
): Promise<{
  registrations: EventRegistrationSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: {
    total: number
    confirmed: number
    pending: number
    attended: number
    cancelled: number
  }
}> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))

  const where: Prisma.EventRegistrationWhereInput = {
    eventId,
  }

  if (params.status) {
    where.status = params.status
  }

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q, mode: "insensitive" } },
      { ticketCode: { contains: params.q, mode: "insensitive" } },
      { studentId: { contains: params.q, mode: "insensitive" } },
      { transactionId: { contains: params.q, mode: "insensitive" } },
    ]
  }

  const [total, rows, counts, event] = await Promise.all([
    prisma.eventRegistration.count({ where }),
    prisma.eventRegistration.findMany({
      where,
      orderBy: [{ registeredAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        event: { select: { title: true } },
      },
    }),
    prisma.eventRegistration.groupBy({
      by: ["status"],
      where: { eventId },
      _count: { status: true },
    }),
    prisma.event.findUnique({ where: { id: eventId }, select: { title: true } }),
  ])

  const stats = {
    total: 0,
    confirmed: 0,
    pending: 0,
    attended: 0,
    cancelled: 0,
  }

  for (const c of counts) {
    stats.total += c._count.status
    if (c.status === EventRegistrationStatus.CONFIRMED) stats.confirmed = c._count.status
    if (c.status === EventRegistrationStatus.PENDING) stats.pending = c._count.status
    if (c.status === EventRegistrationStatus.ATTENDED) stats.attended = c._count.status
    if (c.status === EventRegistrationStatus.CANCELLED) stats.cancelled = c._count.status
  }

  return {
    registrations: rows.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: event?.title ?? "",
      userId: r.userId,
      name: r.name,
      email: r.email,
      phone: r.phone,
      studentId: r.studentId,
      department: r.department,
      semester: r.semester,
      shift: r.shift,
      institution: r.institution,
      status: r.status,
      ticketCode: r.ticketCode,
      paymentMethod: r.paymentMethod,
      senderNumber: r.senderNumber,
      transactionId: r.transactionId,
      amountPaid: r.amountPaid,
      notes: r.notes,
      registeredAt: r.registeredAt.toISOString(),
      confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    stats,
  }
}

export async function updateEventRegistrationStatus(
  registrationId: string,
  status: EventRegistrationStatus,
  adminId: string
): Promise<EventRegistrationSummary> {
  const current = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: { select: { title: true } } },
  })
  if (!current) throw ApiError.notFound("Registration not found")

  const isConfirmedOrAttended =
    status === EventRegistrationStatus.CONFIRMED ||
    status === EventRegistrationStatus.ATTENDED

  const updated = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      status,
      confirmedAt: isConfirmedOrAttended ? new Date() : current.confirmedAt,
      confirmedById: isConfirmedOrAttended ? adminId : current.confirmedById,
    },
  })

  return {
    id: updated.id,
    eventId: updated.eventId,
    eventTitle: current.event.title,
    userId: updated.userId,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    studentId: updated.studentId,
    department: updated.department,
    semester: updated.semester,
    shift: updated.shift,
    institution: updated.institution,
    status: updated.status,
    ticketCode: updated.ticketCode,
    paymentMethod: updated.paymentMethod,
    senderNumber: updated.senderNumber,
    transactionId: updated.transactionId,
    amountPaid: updated.amountPaid,
    notes: updated.notes,
    registeredAt: updated.registeredAt.toISOString(),
    confirmedAt: updated.confirmedAt ? updated.confirmedAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
  }
}

export async function getEventTicket(ticketCode: string): Promise<{
  registration: EventRegistrationSummary
  event: EventSummary
}> {
  const row = await prisma.eventRegistration.findUnique({
    where: { ticketCode },
    include: {
      event: {
        include: {
          category: { select: CATEGORY_SELECT },
          author: { select: AUTHOR_SELECT },
          _count: { select: { registrations: true } },
        },
      },
    },
  })

  if (!row) throw ApiError.notFound("Ticket not found")

  const confirmedCount = await prisma.eventRegistration.count({
    where: {
      eventId: row.eventId,
      status: { in: [EventRegistrationStatus.CONFIRMED, EventRegistrationStatus.ATTENDED] },
    },
  })

  return {
    registration: {
      id: row.id,
      eventId: row.eventId,
      eventTitle: row.event.title,
      userId: row.userId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      studentId: row.studentId,
      department: row.department,
      semester: row.semester,
      shift: row.shift,
      institution: row.institution,
      status: row.status,
      ticketCode: row.ticketCode,
      paymentMethod: row.paymentMethod,
      senderNumber: row.senderNumber,
      transactionId: row.transactionId,
      amountPaid: row.amountPaid,
      notes: row.notes,
      registeredAt: row.registeredAt.toISOString(),
      confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    },
    event: mapSummary(row.event as EventRow, confirmedCount),
  }
}

// ============================================================================
// Parsing & Validation Helpers
// ============================================================================

export function parseEventInput(body: unknown): EventInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const title = toText(body.title, "Title", { max: MAX_EVENT_TITLE_LENGTH })
  const titleBn = toOptionalText(body.titleBn, "Title (Bangla)", MAX_EVENT_TITLE_LENGTH)
  const slug = toOptionalText(body.slug, "Slug", MAX_EVENT_SLUG_LENGTH) ?? undefined
  const excerpt = toOptionalText(body.excerpt, "Excerpt", MAX_EVENT_EXCERPT_LENGTH)
  const excerptBn = toOptionalText(body.excerptBn, "Excerpt (Bangla)", MAX_EVENT_EXCERPT_LENGTH)
  const content = toText(body.content, "Content", { max: MAX_EVENT_CONTENT_LENGTH })
  const contentBn = toOptionalText(body.contentBn, "Content (Bangla)", MAX_EVENT_CONTENT_LENGTH)
  const coverImage = toUrl(body.coverImage, "Cover image")

  let images: string[] = []
  if (Array.isArray(body.images)) {
    images = body.images
      .map((img) => toUrl(img, "Gallery image"))
      .filter((img): img is string => Boolean(img))
      .slice(0, MAX_EVENT_IMAGES)
  }

  const eventType = toEnum(body.eventType ?? EventType.IN_PERSON, "Event type", EVENT_TYPES)
  const status = toEnum(body.status ?? EventStatus.UPCOMING, "Status", EVENT_STATUSES)

  const startDate = toDateTime(body.startDate, "Start date")
  if (!startDate) throw ApiError.badRequest("Start date is required")

  const endDate = body.endDate ? toDateTime(body.endDate, "End date") : null
  const registrationDeadline = body.registrationDeadline
    ? toDateTime(body.registrationDeadline, "Registration deadline")
    : null

  const venue = toOptionalText(body.venue, "Venue", MAX_EVENT_VENUE_LENGTH)
  const venueBn = toOptionalText(body.venueBn, "Venue (Bangla)", MAX_EVENT_VENUE_LENGTH)
  const locationMapUrl = toUrl(body.locationMapUrl, "Location map URL")
  const onlineJoinUrl = toUrl(body.onlineJoinUrl, "Online join URL")

  const categoryId =
    body.categoryId && body.categoryId !== "none" && body.categoryId !== "all"
      ? toOptionalText(body.categoryId, "Category", 50)
      : null

  let tags: string[] = []
  if (Array.isArray(body.tags)) {
    tags = body.tags
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter((t) => t.length > 0 && t.length <= MAX_EVENT_TAG_LENGTH)
      .slice(0, MAX_EVENT_TAGS)
  }

  const isFeatured = body.isFeatured !== undefined ? toBoolean(body.isFeatured, "Is featured") : false
  const isRegistrationOpen =
    body.isRegistrationOpen !== undefined
      ? toBoolean(body.isRegistrationOpen, "Is registration open")
      : true
  const isFree = body.isFree !== undefined ? toBoolean(body.isFree, "Is free") : true
  const registrationFee =
    body.registrationFee !== undefined ? Math.max(0, Number(body.registrationFee) || 0) : 0
  const maxParticipants =
    body.maxParticipants !== undefined && body.maxParticipants !== null && body.maxParticipants !== ""
      ? Math.max(1, Number(body.maxParticipants) || 0)
      : null

  let guestSpeakers: GuestSpeaker[] = []
  if (Array.isArray(body.guestSpeakers)) {
    guestSpeakers = body.guestSpeakers
      .filter(isRecord)
      .map((s) => ({
        name: toText(s.name, "Speaker name", { max: 100 }),
        nameBn: toOptionalText(s.nameBn, "Speaker name (Bangla)", 100),
        role: toText(s.role, "Speaker role", { max: 100 }),
        roleBn: toOptionalText(s.roleBn, "Speaker role (Bangla)", 100),
        company: toOptionalText(s.company, "Speaker company", 100),
        avatar: toUrl(s.avatar, "Speaker avatar"),
        bio: toOptionalText(s.bio, "Speaker bio", 300),
      }))
  }

  return {
    title,
    titleBn,
    slug,
    excerpt,
    excerptBn,
    content,
    contentBn,
    coverImage,
    images,
    eventType,
    status,
    startDate,
    endDate,
    registrationDeadline,
    venue,
    venueBn,
    locationMapUrl,
    onlineJoinUrl,
    categoryId,
    tags,
    isFeatured,
    isRegistrationOpen,
    isFree,
    registrationFee,
    maxParticipants,
    guestSpeakers,
  }
}

export function parseEventUpdateInput(body: unknown): EventUpdateInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const result: EventUpdateInput = {}

  if (body.title !== undefined) {
    result.title = toText(body.title, "Title", { max: MAX_EVENT_TITLE_LENGTH })
  }
  if (body.titleBn !== undefined) {
    result.titleBn = toOptionalText(body.titleBn, "Title (Bangla)", MAX_EVENT_TITLE_LENGTH)
  }
  if (body.slug !== undefined) {
    result.slug = toOptionalText(body.slug, "Slug", MAX_EVENT_SLUG_LENGTH) ?? undefined
  }
  if (body.excerpt !== undefined) {
    result.excerpt = toOptionalText(body.excerpt, "Excerpt", MAX_EVENT_EXCERPT_LENGTH)
  }
  if (body.excerptBn !== undefined) {
    result.excerptBn = toOptionalText(body.excerptBn, "Excerpt (Bangla)", MAX_EVENT_EXCERPT_LENGTH)
  }
  if (body.content !== undefined) {
    result.content = toText(body.content, "Content", { max: MAX_EVENT_CONTENT_LENGTH })
  }
  if (body.contentBn !== undefined) {
    result.contentBn = toOptionalText(body.contentBn, "Content (Bangla)", MAX_EVENT_CONTENT_LENGTH)
  }
  if (body.coverImage !== undefined) {
    result.coverImage = toUrl(body.coverImage, "Cover image")
  }
  if (body.images !== undefined) {
    result.images = Array.isArray(body.images)
      ? body.images
          .map((img) => toUrl(img, "Gallery image"))
          .filter((img): img is string => Boolean(img))
          .slice(0, MAX_EVENT_IMAGES)
      : []
  }
  if (body.eventType !== undefined) {
    result.eventType = toEnum(body.eventType, "Event type", EVENT_TYPES)
  }
  if (body.status !== undefined) {
    result.status = toEnum(body.status, "Status", EVENT_STATUSES)
  }
  if (body.startDate !== undefined) {
    const sDate = toDateTime(body.startDate, "Start date")
    if (!sDate) throw ApiError.badRequest("Invalid start date")
    result.startDate = sDate
  }
  if (body.endDate !== undefined) {
    result.endDate = body.endDate ? toDateTime(body.endDate, "End date") : null
  }
  if (body.registrationDeadline !== undefined) {
    result.registrationDeadline = body.registrationDeadline
      ? toDateTime(body.registrationDeadline, "Registration deadline")
      : null
  }
  if (body.venue !== undefined) {
    result.venue = toOptionalText(body.venue, "Venue", MAX_EVENT_VENUE_LENGTH)
  }
  if (body.venueBn !== undefined) {
    result.venueBn = toOptionalText(body.venueBn, "Venue (Bangla)", MAX_EVENT_VENUE_LENGTH)
  }
  if (body.locationMapUrl !== undefined) {
    result.locationMapUrl = toUrl(body.locationMapUrl, "Location map URL")
  }
  if (body.onlineJoinUrl !== undefined) {
    result.onlineJoinUrl = toUrl(body.onlineJoinUrl, "Online join URL")
  }
  if (body.categoryId !== undefined) {
    result.categoryId =
      body.categoryId && body.categoryId !== "none" && body.categoryId !== "all"
        ? toOptionalText(body.categoryId, "Category", 50)
        : null
  }
  if (body.tags !== undefined) {
    result.tags = Array.isArray(body.tags)
      ? body.tags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length > 0 && t.length <= MAX_EVENT_TAG_LENGTH)
          .slice(0, MAX_EVENT_TAGS)
      : []
  }
  if (body.isFeatured !== undefined) {
    result.isFeatured = toBoolean(body.isFeatured, "Is featured")
  }
  if (body.isRegistrationOpen !== undefined) {
    result.isRegistrationOpen = toBoolean(body.isRegistrationOpen, "Is registration open")
  }
  if (body.isFree !== undefined) {
    result.isFree = toBoolean(body.isFree, "Is free")
  }
  if (body.registrationFee !== undefined) {
    result.registrationFee = Math.max(0, Number(body.registrationFee) || 0)
  }
  if (body.maxParticipants !== undefined) {
    result.maxParticipants =
      body.maxParticipants !== null && body.maxParticipants !== ""
        ? Math.max(1, Number(body.maxParticipants) || 0)
        : null
  }
  if (body.guestSpeakers !== undefined) {
    result.guestSpeakers = Array.isArray(body.guestSpeakers)
      ? body.guestSpeakers.filter(isRecord).map((s) => ({
          name: toText(s.name, "Speaker name", { max: 100 }),
          nameBn: toOptionalText(s.nameBn, "Speaker name (Bangla)", 100),
          role: toText(s.role, "Speaker role", { max: 100 }),
          roleBn: toOptionalText(s.roleBn, "Speaker role (Bangla)", 100),
          company: toOptionalText(s.company, "Speaker company", 100),
          avatar: toUrl(s.avatar, "Speaker avatar"),
          bio: toOptionalText(s.bio, "Speaker bio", 300),
        }))
      : []
  }

  return result
}

export function parseEventRegistrationInput(body: unknown): EventRegistrationInput {
  if (!isRecord(body)) throw ApiError.badRequest("Invalid request body")

  const name = toText(body.name, "Full Name", { max: 100 })
  const email = toText(body.email, "Email", { max: 150 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ApiError.badRequest("Please enter a valid email address")
  }

  const phone = toText(body.phone, "Phone number", { max: 20 })
  const studentId = toOptionalText(body.studentId, "Student ID", 40)

  const department = toOptionalEnum(
    body.department,
    "Department",
    Object.values(Department) as Department[]
  )
  const semester = toOptionalEnum(
    body.semester,
    "Semester",
    Object.values(Semester) as Semester[]
  )
  const shift = toOptionalEnum(body.shift, "Shift", Object.values(Shift) as Shift[])
  const institution = toOptionalText(body.institution, "Institution", 120)

  const paymentMethod = toOptionalEnum(
    body.paymentMethod,
    "Payment method",
    Object.values(PaymentMethod) as PaymentMethod[]
  )
  const senderNumber = toOptionalText(body.senderNumber, "Sender number", 20)
  const transactionId = toOptionalText(body.transactionId, "Transaction ID", 60)
  const notes = toOptionalText(body.notes, "Notes", 500)

  return {
    name,
    email,
    phone,
    studentId,
    department,
    semester,
    shift,
    institution,
    paymentMethod,
    senderNumber,
    transactionId,
    notes,
  }
}
