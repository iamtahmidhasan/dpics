import { NextResponse, type NextRequest } from "next/server"

import { MembershipStatus, Role } from "@/generated/prisma/enums"
import { toErrorResponse } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { requireUserApi } from "@/lib/session"
import { resolveUserImage } from "@/lib/user-image"

export async function GET(request: NextRequest) {
  try {
    // Authenticated access only
    await requireUserApi()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() || ""
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)))

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { roles: { hasSome: [Role.MEMBER, Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN] } },
          { member: { is: { status: MembershipStatus.ACTIVE } } },
        ],
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { member: { is: { studentId: { contains: q, mode: "insensitive" } } } },
                { member: { is: { boardOrClassRoll: { contains: q, mode: "insensitive" } } } },
                { instructor: { is: { instructorId: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        selactedImg: true,
        roles: true,
        member: {
          select: {
            id: true,
            studentId: true,
            department: true,
            session: true,
            semester: true,
            shift: true,
            status: true,
          },
        },
        instructor: {
          select: {
            id: true,
            instructorId: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: limit,
    })

    const result = users.map((u) => {
      const { avatar } = resolveUserImage(u.image, u.selactedImg)
      return {
        id: u.member?.id || u.id,
        userId: u.id,
        name: u.name,
        email: u.email,
        avatar,
        studentId: u.member?.studentId || u.instructor?.instructorId || null,
        department: u.member?.department || null,
        session: u.member?.session || null,
        semester: u.member?.semester || null,
        shift: u.member?.shift || null,
        roles: u.roles,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    return toErrorResponse(error)
  }
}
