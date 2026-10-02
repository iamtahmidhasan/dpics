"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  Search,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

interface EnrollmentManagerProps {
  initialEnrollments: any[]
}

export function EnrollmentManager({ initialEnrollments }: EnrollmentManagerProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [enrollments, setEnrollments] = React.useState(initialEnrollments)
  const [selectedStatus, setSelectedStatus] = React.useState<string>("PENDING")
  const [search, setSearch] = React.useState("")
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleUpdateStatus = async (
    enrollmentId: string,
    status: "ACTIVE" | "REJECTED"
  ) => {
    setLoadingId(enrollmentId)
    setErrorBanner(null)

    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, status }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.message || "Failed to update enrollment status")
      }

      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status } : e))
      )
      router.refresh()
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  // Filter list
  const filtered = enrollments.filter((item) => {
    const matchesStatus =
      selectedStatus === "ALL" ? true : item.status === selectedStatus

    const query = search.trim().toLowerCase()
    const matchesSearch =
      query === "" ||
      item.user?.name?.toLowerCase().includes(query) ||
      item.user?.email?.toLowerCase().includes(query) ||
      item.course?.title?.toLowerCase().includes(query) ||
      item.senderNumber?.includes(query) ||
      item.transactionId?.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })

  const pendingCount = enrollments.filter((e) => e.status === "PENDING").length

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/courses"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t("Back to Courses", "কোর্স তালিকায় ফিরুন")}</span>
            </Link>
          </div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span>{t("Course Enrollment & Payment Queue", "এনরোলমেন্ট ও পেমেন্ট ভেরিফিকেশন")}</span>
          </h1>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatus("PENDING")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors",
              selectedStatus === "PENDING"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="size-3.5" />
            <span>{t("Pending", "পেন্ডিং")}</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px] text-white font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("ACTIVE")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors",
              selectedStatus === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>{t("Approved", "অনুমোদিত")}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("REJECTED")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors",
              selectedStatus === "REJECTED"
                ? "bg-destructive text-destructive-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <XCircle className="size-3.5" />
            <span>{t("Rejected", "প্রত্যাখ্যাত")}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("ALL")}
            className={cn(
              "rounded-md px-3 py-1 font-semibold transition-colors",
              selectedStatus === "ALL"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("All", "সব")}
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="flex items-center justify-between rounded-lg bg-destructive/15 p-3 text-xs text-destructive border border-destructive/20">
          <span>{errorBanner}</span>
          <button
            type="button"
            className="text-destructive font-bold text-xs"
            onClick={() => setErrorBanner(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("Search by student, TrxID, sender phone...", "ছাত্র, TrxID বা মোবাইল নম্বর দিয়ে খুঁজুন...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs h-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("Student", "শিক্ষার্থী")}</th>
                <th className="px-4 py-3">{t("Course", "কোর্স")}</th>
                <th className="px-4 py-3">{t("Payment Info", "পেমেন্ট বিবরণ")}</th>
                <th className="px-4 py-3">{t("Amount", "টাকার পরিমাণ")}</th>
                <th className="px-4 py-3">{t("Status", "স্ট্যাটাস")}</th>
                <th className="px-4 py-3 text-right">{t("Actions", "অ্যাকশন")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {t("No enrollments found for this filter.", "এই ফিল্টারে কোনো এনরোলমেন্ট পাওয়া যায়নি।")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isProcessing = loadingId === item.id

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Student info */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{item.user?.name}</div>
                        <div className="text-[11px] text-muted-foreground">{item.user?.email}</div>
                        {item.user?.phone && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {item.user?.phone}
                          </div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.course?.title}</div>
                        <span className="text-[10px] text-muted-foreground">
                          {item.course?.isFree ? "Free Course" : "Paid Course"}
                        </span>
                      </td>

                      {/* Payment Details */}
                      <td className="px-4 py-3">
                        {item.course?.isFree ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {t("Instant Free Enrollment", "ফ্রি এনরোলমেন্ট")}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                                {item.paymentMethod || "MANUAL"}
                              </Badge>
                              {item.senderNumber && (
                                <span className="font-mono text-[11px] text-foreground">
                                  {item.senderNumber}
                                </span>
                              )}
                            </div>

                            {item.transactionId && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="font-mono font-bold text-primary">
                                  TrxID: {item.transactionId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(item.transactionId!, `trx_${item.id}`)
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {copiedKey === `trx_${item.id}` ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-foreground">
                          ৳ {item.amountPaid || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {item.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[10px]">
                            <CheckCircle2 className="size-3" />
                            <span>{t("Active / Approved", "অনুমোদিত")}</span>
                          </Badge>
                        ) : item.status === "PENDING" ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px]"
                          >
                            <Clock className="size-3" />
                            <span>{t("Pending Verification", "ভেরিফিকেশন পেন্ডিং")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 text-[10px]">
                            <XCircle className="size-3" />
                            <span>{t("Rejected", "প্রত্যাখ্যাত")}</span>
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== "ACTIVE" && (
                            <Button
                              size="sm"
                              disabled={isProcessing}
                              className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => handleUpdateStatus(item.id, "ACTIVE")}
                            >
                              {isProcessing ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )}
                              <span>{t("Approve", "অনুমোদন")}</span>
                            </Button>
                          )}

                          {item.status !== "REJECTED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isProcessing}
                              className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                              onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                            >
                              <span>{t("Reject", "বাতিল")}</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
