import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TemplateEditor } from "@/components/template-editor/TemplateEditor"
import { getMediaTemplateById } from "@/lib/services/media-template.service"
import { resolveTemplateData } from "@/lib/template-engine/resolver"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Template Editor",
}

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const session = await requireAdmin()
  const { templateId } = await params

  const template = await getMediaTemplateById(templateId)
  if (!template) {
    notFound()
  }

  // Resolve builder's real profile data so the editor renders their actual avatar & member details
  const sampleData = await resolveTemplateData(template.type, {
    userId: session.user.id,
  })

  return <TemplateEditor initialTemplate={template} sampleData={sampleData} />
}
