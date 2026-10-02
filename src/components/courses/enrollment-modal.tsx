"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, CreditCard, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
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

interface PaymentSettings {
  bkashPersonalNumber?: string | null
  bkashAgentNumber?: string | null
  nagadPersonalNumber?: string | null
  nagadAgentNumber?: string | null
  rocketPersonalNumber?: string | null
  rocketAgentNumber?: string | null
}

interface EnrollmentModalProps {
  course: {
    id: string
    title: string
    isFree: boolean
    price: number
    discountPrice?: number | null
  }
  paymentSettings?: PaymentSettings
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EnrollmentModal({
  course,
  paymentSettings,
  open,
  onOpenChange,
  onSuccess,
}: EnrollmentModalProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = React.useState<string>("BKASH")
  const [senderNumber, setSenderNumber] = React.useState<string>("")
  const [transactionId, setTransactionId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const payableAmount = course.isFree ? 0 : course.discountPrice ?? course.price

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!course.isFree) {
      if (!senderNumber.trim()) {
        setError(t("Please provide the sender phone number", "দয়া করে প্রেরকের মোবাইল নম্বর দিন"))
        return
      }
      if (!transactionId.trim()) {
        setError(t("Please provide the Transaction ID", "দয়া করে ট্রানজেকশন আইডি দিন"))
        return
      }
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: course.isFree ? null : paymentMethod,
          senderNumber: course.isFree ? null : senderNumber,
          transactionId: course.isFree ? null : transactionId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to submit enrollment request")
      }

      setSuccessMessage(data.message || t("Enrollment submitted!", "এনরোলমেন্ট সফল হয়েছে!"))
      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) onSuccess()
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const availableNumbers = [
    {
      name: "bKash (Send Money)",
      number: paymentSettings?.bkashPersonalNumber || "01XXXXXXXXX",
      type: "BKASH",
    },
    {
      name: "Nagad (Send Money)",
      number: paymentSettings?.nagadPersonalNumber || "01XXXXXXXXX",
      type: "NAGAD",
    },
    {
      name: "Rocket",
      number: paymentSettings?.rocketPersonalNumber || "01XXXXXXXXX",
      type: "ROCKET",
    },
  ].filter((item) => item.number && item.number !== "01XXXXXXXXX")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            {course.isFree ? (
              <Sparkles className="size-5" />
            ) : (
              <CreditCard className="size-5" />
            )}
            <DialogTitle>
              {course.isFree
                ? t("Confirm Free Enrollment", "ফ্রি এনরোলমেন্ট নিশ্চিত করুন")
                : t("Course Enrollment & Payment", "কোর্স এনরোলমেন্ট ও পেমেন্ট")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {course.title}
          </DialogDescription>
        </DialogHeader>

        {course.isFree ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {t("100% Free Course", "১০০% ফ্রি কোর্স")}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "Click below to get instant lifetime access to all lessons and materials.",
                  "নিচের বাটনে ক্লিক করে সব পাঠ ও উপকরণের তাৎক্ষণিক অ্যাক্সেস নিন।"
                )}
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {successMessage}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("Enroll Now (Instant Access)", "এখনই এনরোল করুন")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Banner */}
            <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
              <div>
                <span className="text-xs text-muted-foreground block">
                  {t("Payable Amount", "পরিশোধযোগ্য ফি")}
                </span>
                <span className="text-xl font-bold text-foreground">
                  ৳ {payableAmount.toLocaleString()}
                </span>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/20 text-primary">
                {t("One-time Fee", "এককালীন ফি")}
              </span>
            </div>

            {/* Club payment numbers */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                {t("Club Payment Numbers (Send Money):", "ক্লাবের পেমেন্ট নম্বরসমূহ (সেন্ড মানি):")}
              </Label>
              <div className="space-y-1.5">
                {(availableNumbers.length > 0
                  ? availableNumbers
                  : [
                      {
                        name: "bKash (Personal)",
                        number: paymentSettings?.bkashPersonalNumber || "01700000000",
                        type: "BKASH",
                      },
                      {
                        name: "Nagad (Personal)",
                        number: paymentSettings?.nagadPersonalNumber || "01700000000",
                        type: "NAGAD",
                      },
                    ]
                ).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs"
                  >
                    <div>
                      <span className="font-medium text-foreground">{item.name}: </span>
                      <span className="font-mono text-muted-foreground">{item.number}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(item.number, item.name)}
                    >
                      {copiedKey === item.name ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod" className="text-xs">
                {t("Payment Method", "পেমেন্ট মাধ্যম")} *
              </Label>
              <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                <SelectTrigger id="paymentMethod" className="w-full text-xs">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="NAGAD">Nagad</SelectItem>
                  <SelectItem value="ROCKET">Rocket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sender Number */}
            <div className="space-y-1.5">
              <Label htmlFor="senderNumber" className="text-xs">
                {t("Sender Mobile Number", "প্রেরকের মোবাইল নম্বর")} *
              </Label>
              <Input
                id="senderNumber"
                placeholder="01XXXXXXXXX"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            {/* Transaction ID */}
            <div className="space-y-1.5">
              <Label htmlFor="transactionId" className="text-xs">
                {t("Transaction ID (TrxID)", "ট্রানজেকশন আইডি (TrxID)")} *
              </Label>
              <Input
                id="transactionId"
                placeholder="e.g. 9J58KL2M"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                className="text-xs font-mono uppercase"
                required
              />
              <span className="text-[10px] text-muted-foreground">
                {t(
                  "Enter the transaction ID received from your bKash/Nagad SMS.",
                  "বিকাশ/নগদ এর কনফার্মেশন এসএমএস থেকে ট্রানজেকশন আইডিটি লিখুন।"
                )}
              </span>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-emerald-500/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {successMessage}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t("Cancel", "বাতিল")}
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t("Submit Enrollment", "এনরোলমেন্ট সাবমিট করুন")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
