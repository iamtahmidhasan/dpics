import prisma from "@/lib/prisma"
import { parseArrayField, parseBooleanField } from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

export async function exportCommittees(): Promise<Record<string, unknown>[]> {
  const committees = await prisma.committee.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      roles: {
        include: {
          _count: { select: { users: true } },
        },
      },
    },
  })

  return committees.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    isActive: c.isActive,
    rolesCount: c.roles.length,
    roles: c.roles.map((r) => r.name).join(","),
    createdAt: c.createdAt.toISOString(),
  }))
}

export async function importCommittees(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "committees",
    format: "csv",
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: !!options.dryRun,
    errors: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    const name = String(row.name || "").trim()
    const slug = String(row.slug || "").trim().toLowerCase()

    if (!name || !slug) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug || name || "unknown",
        message: "Committee name and slug are required",
      })
      continue
    }

    const description = row.description ? String(row.description).trim() : null
    const isActive = parseBooleanField(row.isActive, true)
    const rawRoles = parseArrayField(row.roles)

    if (options.dryRun) {
      const existing = await prisma.committee.findUnique({ where: { slug } })
      if (existing) {
        if (options.mode === "upsert") {
          result.updated++
        } else {
          result.skipped++
        }
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.committee.findUnique({
        where: { slug },
        include: { roles: true },
      })

      let committeeId: string

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.committee.update({
          where: { id: existing.id },
          data: {
            name,
            description,
            isActive,
          },
        })
        committeeId = existing.id
        result.updated++
      } else {
        const created = await prisma.committee.create({
          data: {
            name,
            slug,
            description,
            isActive,
          },
        })
        committeeId = created.id
        result.created++
      }

      // Auto-create any specified roles that don't exist yet
      if (rawRoles.length > 0) {
        for (const roleName of rawRoles) {
          const roleSlug = roleName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")

          const existingRole = await prisma.committeeRole.findFirst({
            where: { committeeId, slug: roleSlug },
          })

          if (!existingRole) {
            await prisma.committeeRole.create({
              data: {
                committeeId,
                name: roleName,
                slug: roleSlug,
              },
            })
          }
        }
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: slug,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
