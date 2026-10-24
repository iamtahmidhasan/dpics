import type { Metadata } from "next"
import { DataTransferHub } from "@/components/admin/data-transfer/data-transfer-hub"
import { DataTransferService } from "@/lib/data-transfer/service"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Import & Export Data",
}

export default async function AdminDataTransferPage() {
  await requireAdmin()
  const counts = await DataTransferService.getAllEntityCounts()

  return <DataTransferHub initialCounts={counts} />
}
