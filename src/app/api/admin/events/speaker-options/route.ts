import { NextResponse, type NextRequest } from "next/server"

import { toErrorResponse } from "@/lib/api-error"
import prisma from "@/lib/prisma"
import { resolveUserImage } from "@/lib/user-image"
import { requireAdminApi } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    await requireAdminApi()
    const q = request.nextUrl.searchParams.get("q")?.trim()

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      take: 30,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        selactedImg: true,
        roles: true,
        member: {
          select: {
            department: true,
            studentId: true,
          },
        },
        instructor: {
          select: {
            instructorId: true,
          },
        },
      },
    })

    const options = users.map((u) => {
      const { avatar } = resolveUserImage(u.image, u.selactedImg)

      let role = "Speaker"
      if (u.instructor || u.roles.includes("INSTRUCTOR")) {
        role = "Instructor & Mentor"
      } else if (u.roles.includes("ADMIN")) {
        role = "Executive / Organizer"
      } else if (u.member) {
        role = "Society Member"
      }

      let company = ""
      if (u.member?.department) {
        company = "Dhaka Polytechnic Institute"
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar,
        bio: u.bio ?? null,
        role,
        company,
        studentId: u.member?.studentId ?? null,
        instructorId: u.instructor?.instructorId ?? null,
      }
    })

    return NextResponse.json({ users: options })
  } catch (error) {
    return toErrorResponse(error)
  }
}
