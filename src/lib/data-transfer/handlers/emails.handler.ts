import prisma from "@/lib/prisma"
import { EmailCategory } from "@/generated/prisma/enums"
import { parseArrayField, parseBooleanField } from "../csv-utils"
import type { ImportOptions, ImportResult } from "../types"

export async function exportEmails(): Promise<Record<string, unknown>[]> {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
  })

  return templates.map((t) => ({
    key: t.key,
    name: t.name,
    category: t.category,
    subject: t.subject,
    bodyHtml: t.bodyHtml,
    bodyText: t.bodyText || "",
    variables: t.variables.join(","),
    isActive: t.isActive,
    isSystem: t.isSystem,
    createdAt: t.createdAt.toISOString(),
  }))
}

export async function importEmails(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    entity: "emails",
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

    const key = String(row.key || "").trim().toUpperCase()
    const name = String(row.name || "").trim()
    const subject = String(row.subject || "").trim()
    const bodyHtml = String(row.bodyHtml || "").trim()

    if (!key || !name || !subject || !bodyHtml) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: key || name || "unknown",
        message: "key, name, subject, and bodyHtml are required for email templates",
      })
      continue
    }

    const categoryStr = String(row.category || "").trim().toUpperCase()
    const category = categoryStr in EmailCategory ? (categoryStr as EmailCategory) : EmailCategory.SYSTEM
    const bodyText = row.bodyText ? String(row.bodyText).trim() : null
    const variables = parseArrayField(row.variables)
    const isActive = parseBooleanField(row.isActive, true)

    if (options.dryRun) {
      const existing = await prisma.emailTemplate.findUnique({ where: { key } })
      if (existing) {
        if (options.mode === "upsert") result.updated++
        else result.skipped++
      } else {
        result.created++
      }
      continue
    }

    try {
      const existing = await prisma.emailTemplate.findUnique({ where: { key } })

      if (existing) {
        if (options.mode === "create_only") {
          result.skipped++
          continue
        }

        await prisma.emailTemplate.update({
          where: { id: existing.id },
          data: {
            name,
            category,
            subject,
            bodyHtml,
            bodyText,
            variables: variables.length > 0 ? variables : existing.variables,
            isActive,
          },
        })
        result.updated++
      } else {
        await prisma.emailTemplate.create({
          data: {
            key,
            name,
            category,
            subject,
            bodyHtml,
            bodyText,
            variables,
            isActive,
            isSystem: false,
          },
        })
        result.created++
      }
    } catch (err: unknown) {
      result.failed++
      result.errors.push({
        row: rowNum,
        identifier: key,
        message: err instanceof Error ? err.message : "Database error",
      })
    }
  }

  result.success = result.failed === 0
  return result
}
