import type { Metadata } from "next"
import { Header } from "@/components/Header"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: "Ticket Scanner · DPI Computing Society",
  description: "Live QR ticket scanner and attendee check-in console.",
  robots: { index: false, follow: false },
}

export default async function ScannerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Standard Frontend Header */}
      <Header />

      {/* Main Content Area (No Footer) */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
