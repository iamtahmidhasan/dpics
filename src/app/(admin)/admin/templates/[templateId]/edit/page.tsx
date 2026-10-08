import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TemplateEditor } from "@/components/template-editor/TemplateEditor"
import { getMediaTemplateById } from "@/lib/services/media-template.service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Template Editor",
}

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  await requireAdmin()
  const { templateId } = await params

  const template = await getMediaTemplateById(templateId)
  if (!template) {
    notFound()
  }

  return <TemplateEditor initialTemplate={template} />
}
