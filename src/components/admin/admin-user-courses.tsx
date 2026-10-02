"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

interface AdminUserCoursesProps {
  userId: string
  userName: string
  initialEnrollments: any[]
  availableCourses: any[]
}

export function AdminUserCourses({
  userId,
  userName,
  initialEnrollments,
  availableCourses,
}: AdminUserCoursesProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [enrollments, setEnrollments] = React.useState(initialEnrollments)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Manual Enroll Modal State
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ACTIVE")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string>("CASH")
  const [amountPaid, setAmountPaid] = React.useState<string>("0")
  const [adminNote, setAdminNote] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)

  // When selecting a course, pre-fill amount
  const handleCourseSelect = (courseId: string | null) => {
    if (!courseId) return
    setSelectedCourseId(courseId)
    const found = availableCourses.find((c) => c.id === courseId)
    if (found) {
      setAmountPaid(found.isFree ? "0" : String(found.discountPrice || found.price || 0))
    }
  }

  // Handle Approve or Reject
  const handleUpdateStatus = async (
    enrollmentId: string,
    status: "ACTIVE" | "REJECTED"
  ) => {
    setLoadingId(enrollmentId)
    setError(null)

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
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  // Handle Manual Enrollment Form Submit
  const handleManualEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courseId: selectedCourseId,
          status: selectedStatus,
          paymentMethod: selectedPaymentMethod,
          amountPaid: parseInt(amountPaid) || 0,
          adminNote,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to enroll user")
      }

      const enrolledCourse = availableCourses.find((c) => c.id === selectedCourseId)
      const newEnrollment = {
        ...data.enrollment,
        course: enrolledCourse,
      }

      setEnrollments((prev) => {
        const filtered = prev.filter((e) => e.courseId !== selectedCourseId)
        return [newEnrollment, ...filtered]
      })

      setModalOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GraduationCap className="size-4 text-primary" />
            <span>{t("Enrolled Courses", "ভর্তি হওয়া কোর্সসমূহ")}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t(
              `View and manage ${userName}'s course enrollments and access permissions.`,
              `${userName}-এর কোর্স এনরোলমেন্ট ও অ্যাক্সেস অনুমতি পরিচালনা করুন।`
            )}
          </CardDescription>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedCourseId(availableCourses[0]?.id || "")
            setAmountPaid(
              availableCourses[0]?.isFree
                ? "0"
                : String(availableCourses[0]?.discountPrice || availableCourses[0]?.price || 0)
            )
            setModalOpen(true)
          }}
          className="text-xs gap-1.5 font-semibold"
        >
          <Plus className="size-3.5" />
          <span>{t("Enroll in Course", "কোর্সে যুক্ত করুন")}</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/15 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            {t("This user is not enrolled in any courses yet.", "এই ব্যবহারকারী এখনও কোনো কোর্সে ভর্তি হননি।")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">{t("Course", "কোর্স")}</th>
                  <th className="px-4 py-2.5">{t("Payment", "পেমেন্ট")}</th>
                  <th className="px-4 py-2.5">{t("Fee", "ফি")}</th>
                  <th className="px-4 py-2.5">{t("Status", "স্ট্যাটাস")}</th>
                  <th className="px-4 py-2.5 text-right">{t("Actions", "অ্যাকশন")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {enrollments.map((item) => {
                  const isProcessing = loadingId === item.id
                  const isCourseFree = item.course?.isFree

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground block">
                          {item.course?.title || t("Unknown Course", "অজানা কোর্স")}
                        </span>
                        {item.course?.slug && (
                          <Link
                            href={`/courses/${item.course.slug}`}
                            target="_blank"
                            className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-mono"
                          >
                            <span>/{item.course.slug}</span>
                            <ExternalLink className="size-2.5" />
                          </Link>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isCourseFree ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {t("Free Course", "ফ্রি কোর্স")}
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                                {item.paymentMethod || "MANUAL"}
                              </Badge>
                              {item.senderNumber && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {item.senderNumber}
                                </span>
                              )}
                            </div>
                            {item.transactionId && (
                              <span className="font-mono font-bold text-[10px] text-primary block">
                                TrxID: {item.transactionId}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-foreground">
                          ৳ {item.amountPaid || 0}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {item.status === "ACTIVE" ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[10px]">
                            <CheckCircle2 className="size-3" />
                            <span>{t("Active Access", "চালু আছে")}</span>
                          </Badge>
                        ) : item.status === "PENDING" ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px]"
                          >
                            <Clock className="size-3" />
                            <span>{t("Pending Verification", "পেন্ডিং")}</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 text-[10px]">
                            <XCircle className="size-3" />
                            <span>{t("Rejected", "প্রত্যাখ্যাত")}</span>
                          </Badge>
                        )}
                      </td>

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
                              <span>{t("Revoke", "বাতিল")}</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Manual Enrollment Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Enroll User in Course", "ব্যবহারকারীকে কোর্সে যুক্ত করুন")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t(
                `Manually grant course access or record offline cash payment for ${userName}.`,
                `${userName}-এর জন্য কোর্স অ্যাক্সেস দিন বা অফলাইন পেমেন্ট রেকর্ড করুন।`
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualEnrollSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Select Course", "কোর্স নির্বাচন করুন")} *</Label>
              <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} ({c.isFree ? "Free" : `৳ ${c.discountPrice || c.price}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Enrollment Status", "এনরোলমেন্ট স্ট্যাটাস")}</Label>
                <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t("Active (Full Access)", "অ্যাক্টিভ (পূর্ণ অ্যাক্সেস)")}</SelectItem>
                    <SelectItem value="PENDING">{t("Pending Verification", "পেন্ডিং ভেরিফিকেশন")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("Payment Method", "পেমেন্ট মাধ্যম")}</Label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={(val) => val && setSelectedPaymentMethod(val)}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash / Offline</SelectItem>
                    <SelectItem value="HAND_TO_HAND">Hand to Hand</SelectItem>
                    <SelectItem value="BKASH">bKash</SelectItem>
                    <SelectItem value="NAGAD">Nagad</SelectItem>
                    <SelectItem value="ROCKET">Rocket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("Amount Paid (৳)", "পরিশোধিত ফি (৳)")}</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("Admin Note (Optional)", "অ্যাডমিন নোট (ঐচ্ছিক)")}</Label>
              <Input
                placeholder="e.g. Paid in club office to coordinator"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={submitting || !selectedCourseId}>
                {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {t("Confirm Enrollment", "এনরোল নিশ্চিত করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
