"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Ticket,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { useSession } from "@/lib/auth-client"
import { Department, PaymentMethod, Semester, Shift } from "@/generated/prisma/enums"
import type { EventDetail, EventRegistrationSummary } from "@/lib/services/event.service"

const DEPARTMENTS = [
  { value: Department.COMPUTER_SCIENCE_AND_TECHNOLOGY, label: "Computer Science & Technology" },
  { value: Department.ELECTRICAL_TECHNOLOGY, label: "Electrical Technology" },
  { value: Department.ELECTRONICS_TECHNOLOGY, label: "Electronics Technology" },
  { value: Department.MECHANICAL_TECHNOLOGY, label: "Mechanical Technology" },
  { value: Department.CIVIL_TECHNOLOGY, label: "Civil Technology" },
  { value: Department.OTHER, label: "Other / External" },
]

const SEMESTERS = [
  { value: Semester.FIRST, label: "1st Semester" },
  { value: Semester.SECOND, label: "2nd Semester" },
  { value: Semester.THIRD, label: "3rd Semester" },
  { value: Semester.FOURTH, label: "4th Semester" },
  { value: Semester.FIFTH, label: "5th Semester" },
  { value: Semester.SIXTH, label: "6th Semester" },
  { value: Semester.SEVENTH, label: "7th Semester" },
  { value: Semester.EIGHTH, label: "8th Semester" },
]

export function EventRegistrationDialog({
  event,
  triggerText,
  disabled = false,
}: {
  event: EventDetail
  triggerText?: string
  disabled?: boolean
}) {
  const { t } = useLanguage()
  const { data: session } = useSession()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketResult, setTicketResult] = useState<EventRegistrationSummary | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [name, setName] = useState(session?.user?.name ?? "")
  const [email, setEmail] = useState(session?.user?.email ?? "")
  const [phone, setPhone] = useState("")
  const [studentId, setStudentId] = useState("")
  const [department, setDepartment] = useState<string>(
    Department.COMPUTER_SCIENCE_AND_TECHNOLOGY
  )
  const [semester, setSemester] = useState<string>(Semester.FOURTH)
  const [shift, setShift] = useState<string>(Shift.MORNING)
  const [institution, setInstitution] = useState("Dhaka Polytechnic Institute")

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>(PaymentMethod.BKASH)
  const [senderNumber, setSenderNumber] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          studentId: studentId || null,
          department: department || null,
          semester: semester || null,
          shift: shift || null,
          institution: institution || null,
          paymentMethod: !event.isFree ? paymentMethod : null,
          senderNumber: !event.isFree ? senderNumber : null,
          transactionId: !event.isFree ? transactionId : null,
          notes: notes || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to register")
      }

      setTicketResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (ticketResult?.ticketCode) {
      navigator.clipboard.writeText(ticketResult.ticketCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetDialog = () => {
    setTicketResult(null)
    setError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="lg"
            disabled={disabled}
            className="w-full sm:w-auto font-semibold shadow-md shadow-primary/20"
          >
            <Ticket className="size-4" />
            {triggerText || t({ en: "Register Now", bn: "এখনই নিবন্ধন করুন" })}
          </Button>
        }
      />

      <DialogContent className="sm:max-w-xl">
        {ticketResult ? (
          <div className="py-6 text-center space-y-5">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">
                {t({ en: "Registration Successful!", bn: "নিবন্ধন সফল হয়েছে!" })}
              </DialogTitle>
              <DialogDescription>
                {t({
                  en: "Your entry pass has been generated. Keep your ticket code safe.",
                  bn: "আপনার প্রবেশ পাস তৈরি হয়েছে। টিকিট কোডটি সংরক্ষণ করুন।",
                })}
              </DialogDescription>
            </div>

            {/* Ticket Card Preview */}
            <div className="mx-auto max-w-sm rounded-xl border border-primary/20 bg-primary/5 p-4 text-left shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t({ en: "Ticket Code", bn: "টিকিট কোড" })}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {ticketResult.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-extrabold tracking-wider text-foreground">
                  {ticketResult.ticketCode}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="size-3.5" />
                  {copied
                    ? t({ en: "Copied!", bn: "কপি হয়েছে!" })
                    : t({ en: "Copy", bn: "কপি" })}
                </Button>
              </div>

              <div className="pt-2 text-xs text-muted-foreground space-y-1 border-t border-border/40">
                <p>
                  <strong>{t({ en: "Name", bn: "নাম" })}:</strong> {ticketResult.name}
                </p>
                <p>
                  <strong>{t({ en: "Event", bn: "ইভেন্ট" })}:</strong> {ticketResult.eventTitle}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/events/ticket/${ticketResult.ticketCode}`}
                    target="_blank"
                  />
                }
                className="w-full sm:w-auto gap-1.5"
              >
                <ExternalLink className="size-4" />
                {t({ en: "View / Print Ticket", bn: "টিকিট প্রিন্ট / দেখুন" })}
              </Button>

              <Button onClick={resetDialog} className="w-full sm:w-auto">
                {t({ en: "Done", bn: "সমাপ্ত" })}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {t({ en: "Register for Event", bn: "ইভেন্টে নিবন্ধন করুন" })}
              </DialogTitle>
              <DialogDescription>
                {event.title} •{" "}
                <span className="font-semibold text-primary">
                  {event.isFree
                    ? t({ en: "Free Entry", bn: "ফ্রি রেজিস্ট্রেশন" })
                    : `৳ ${event.registrationFee} Registration Fee`}
                </span>
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4 py-2">
              {/* Personal Details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name" className="text-xs font-medium">
                    {t({ en: "Full Name *", bn: "পুরো নাম *" })}
                  </Label>
                  <Input
                    id="reg-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tahmid Hasan"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs font-medium">
                    {t({ en: "Email Address *", bn: "ইমেইল ঠিকানা *" })}
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-xs font-medium">
                    {t({ en: "Phone Number *", bn: "ফোন নম্বর *" })}
                  </Label>
                  <Input
                    id="reg-phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-student-id" className="text-xs font-medium">
                    {t({ en: "Student Roll / ID", bn: "রোল / স্টুডেন্ট আইডি" })}
                  </Label>
                  <Input
                    id="reg-student-id"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 712345"
                  />
                </div>
              </div>

              {/* Academic info */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {t({ en: "Department", bn: "ডিপার্টমেন্ট" })}
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {t({ en: "Semester", bn: "সেমিস্টার" })}
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {t({ en: "Shift", bn: "শিফট" })}
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                  >
                    <option value={Shift.MORNING}>Morning (1st)</option>
                    <option value={Shift.DAY}>Day (2nd)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-inst" className="text-xs font-medium">
                  {t({ en: "College / Polytechnic / Institute", bn: "প্রতিষ্ঠান" })}
                </Label>
                <Input
                  id="reg-inst"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Dhaka Polytechnic Institute"
                />
              </div>

              {/* Payment Section if Paid */}
              {!event.isFree && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                  <div className="text-xs font-semibold text-primary">
                    {t({
                      en: `Payment Information (Fee: ৳${event.registrationFee})`,
                      bn: `পেমেন্ট তথ্য (ফি: ৳${event.registrationFee})`,
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t({
                      en: "Send money via bKash / Nagad / Rocket to 01700-000000 (Personal/Send Money) and enter details below.",
                      bn: "বিকাশ / নগদ / রকেটে 01700-000000 নম্বরে সেন্ড মানি করুন এবং নিচের ঘরে তথ্য দিন।",
                    })}
                  </p>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Method</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value={PaymentMethod.BKASH}>bKash</option>
                        <option value={PaymentMethod.NAGAD}>Nagad</option>
                        <option value={PaymentMethod.ROCKET}>Rocket</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Sender Number</Label>
                      <Input
                        required={!event.isFree}
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Transaction ID</Label>
                      <Input
                        required={!event.isFree}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Trx ID"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reg-notes" className="text-xs font-medium">
                  {t({ en: "Notes or Questions (Optional)", bn: "মন্তব্য বা প্রশ্ন (ঐচ্ছিক)" })}
                </Label>
                <Textarea
                  id="reg-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t({
                    en: "Any specific expectations or questions...",
                    bn: "কোন বিশেষ জিজ্ঞাসা বা প্রত্যাশা...",
                  })}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {t({ en: "Cancel", bn: "বাতিল" })}
              </Button>

              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t({ en: "Confirm Registration", bn: "নিবন্ধন নিশ্চিত করুন" })}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
