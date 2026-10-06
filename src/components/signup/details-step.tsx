"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

import { EnumSelect, TextField } from "@/components/form-fields"
import { DocumentUploadField } from "@/components/media/document-upload-field"
import { useLanguage } from "@/components/language-provider"
import { roleOption } from "@/components/signup/signup-steps"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { Department, PaymentMethod, Role, Semester, Shift } from "@/generated/prisma/enums"
import { formatTaka } from "@/lib/format"
import {
  departmentLabel,
  paymentMethodLabel,
  semesterLabel,
  shiftLabel,
} from "@/lib/profile-labels"
import type { SelfAssignableRole } from "@/lib/roles"
import type { InstructorInput, MemberInput } from "@/lib/services/profile.service"

const EASE = [0.25, 0.1, 0.25, 1] as const

type MemberForm = {
  boardOrClassRoll: string
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentId: string
  studentIdCardUrl: string
  nidorbirthUrl: string
  paymentMethod: PaymentMethod
  senderNumber: string
  transactionId: string
}

type InstructorForm = {
  instructorId: string
}

const EMPTY_MEMBER: MemberForm = {
  boardOrClassRoll: "",
  department: Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
  session: "",
  semester: Semester.FIRST,
  shift: Shift.MORNING,
  studentId: "",
  studentIdCardUrl: "",
  nidorbirthUrl: "",
  paymentMethod: PaymentMethod.BKASH,
  senderNumber: "",
  transactionId: "",
}

const EMPTY_INSTRUCTOR: InstructorForm = {
  instructorId: "",
}

export type SignupPaymentDetails = {
  isRegistrationFeeRequired: boolean
  fee: number
  bkashPersonalNumber: string | null
  bkashAgentNumber: string | null
  nagadPersonalNumber: string | null
  nagadAgentNumber: string | null
  rocketPersonalNumber: string | null
  rocketAgentNumber: string | null
}

export type SignupStudentIdPolicy = {
  isAutoEnabled: boolean
  prefix: string
  batch: string
  isLimitReached: boolean
  limit: number
  totalMembers: number
}

function PaymentInstructionsPanel({
  payment,
  lang,
}: {
  payment: SignupPaymentDetails
  lang: string
}) {
  const { t } = useLanguage()

  const providers = [
    {
      name: "bKash",
      label: { en: "bKash", bn: "বিকাশ" },
      personal: payment.bkashPersonalNumber,
      agent: payment.bkashAgentNumber,
    },
    {
      name: "Nagad",
      label: { en: "Nagad", bn: "নগদ" },
      personal: payment.nagadPersonalNumber,
      agent: payment.nagadAgentNumber,
    },
    {
      name: "Rocket",
      label: { en: "Rocket", bn: "রকেট" },
      personal: payment.rocketPersonalNumber,
      agent: payment.rocketAgentNumber,
    },
  ].filter((p) => Boolean(p.personal || p.agent))

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("Registration Fee Instructions", "নিবন্ধন ফি সংক্রান্ত নির্দেশনা")}
          </h3>
          <p className="text-xs/relaxed text-muted-foreground mt-0.5">
            {t(
              "Please send the registration fee to any of the numbers below. An administrator will verify your payment manually.",
              "অনুগ্রহ করে নিচের যেকোনো নম্বরে নিবন্ধন ফি পাঠান। নিবন্ধনের পর একজন প্রশাসক আপনার পেমেন্ট ম্যানুয়ালি যাচাই করবেন।"
            )}
          </p>
        </div>
        <div className="flex items-baseline gap-1.5 rounded-md bg-background px-3 py-1.5 border shadow-2xs">
          <span className="text-xs text-muted-foreground">{t("Fee:", "ফি:")}</span>
          <span className="font-heading text-base font-bold text-foreground">
            {formatTaka(payment.fee, lang)}
          </span>
        </div>
      </div>

      {providers.length > 0 ? (
        <div className="space-y-2">
          {providers.map((p) => (
            <div
              key={p.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/80 px-3 py-2 text-xs"
            >
              <span className="font-semibold text-foreground">{t(p.label)}</span>
              <div className="flex flex-wrap items-center gap-3 text-xs/relaxed">
                {p.personal ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t("Personal:", "পার্সোনাল:")}</span>
                    <span className="font-mono font-medium">{p.personal}</span>
                  </span>
                ) : null}
                {p.agent ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t("Agent:", "এজেন্ট:")}</span>
                    <span className="font-mono font-medium">{p.agent}</span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** The wizard merges this into the `POST /api/onboarding` body alongside `role`. */
export type OnboardingDetails =
  | { member: MemberInput }
  | { instructor: InstructorInput }

export function DetailsStep({
  role,
  payment,
  studentIdPolicy,
  error,
  isPending,
  onError,
  onBack,
  onComplete,
}: {
  role: SelfAssignableRole
  payment?: SignupPaymentDetails | null
  studentIdPolicy?: SignupStudentIdPolicy | null
  error: string | null
  isPending: boolean
  onError: (message: string | null) => void
  onBack: () => void
  onComplete: (details: OnboardingDetails) => void
}) {
  const { t, lang } = useLanguage()
  const tDepartment = departmentLabel(t)
  const tSemester = semesterLabel(t)
  const tShift = shiftLabel(t)
  const tPaymentMethod = paymentMethodLabel(t)

  const isFeeRequired = Boolean(payment?.isRegistrationFeeRequired && payment.fee > 0)

  const availablePaymentMethods: PaymentMethod[] = []
  if (payment?.bkashPersonalNumber || payment?.bkashAgentNumber) {
    availablePaymentMethods.push(PaymentMethod.BKASH)
  }
  if (payment?.nagadPersonalNumber || payment?.nagadAgentNumber) {
    availablePaymentMethods.push(PaymentMethod.NAGAD)
  }
  if (payment?.rocketPersonalNumber || payment?.rocketAgentNumber) {
    availablePaymentMethods.push(PaymentMethod.ROCKET)
  }

  const paymentMethodOptions: PaymentMethod[] =
    availablePaymentMethods.length > 0
      ? availablePaymentMethods
      : [PaymentMethod.BKASH, PaymentMethod.NAGAD, PaymentMethod.ROCKET]

  const [member, setMember] = useState<MemberForm>(() => ({
    ...EMPTY_MEMBER,
    paymentMethod: paymentMethodOptions[0] ?? PaymentMethod.BKASH,
  }))
  const [instructor, setInstructor] = useState<InstructorForm>(EMPTY_INSTRUCTOR)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const option = roleOption(role)
  const Icon = option.icon

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError(null)

    if (role === Role.MEMBER) {
      const nextErrors: Record<string, string> = {}

      if (!member.session.trim()) {
        nextErrors.session = t("Session is required", "সেশন আবশ্যক")
      }

      if (isFeeRequired) {
        if (!member.senderNumber.trim()) {
          nextErrors.senderNumber = t("Sender number is required", "প্রেরক নম্বর আবশ্যক")
        }
        if (!member.transactionId.trim()) {
          nextErrors.transactionId = t("Transaction ID is required", "ট্রানজেকশন আইডি আবশ্যক")
        }
      }

      setErrors(nextErrors)

      if (Object.keys(nextErrors).length > 0) return

      onComplete({
        member: {
          boardOrClassRoll: member.boardOrClassRoll.trim() || null,
          department: member.department,
          session: member.session.trim(),
          semester: member.semester,
          shift: member.shift,
          studentId: studentIdPolicy?.isAutoEnabled ? null : (member.studentId.trim() || null),
          studentIdCardUrl: member.studentIdCardUrl.trim() || null,
          nidorbirthUrl: member.nidorbirthUrl.trim() || null,
          paymentMethod: isFeeRequired ? member.paymentMethod : null,
          senderNumber: isFeeRequired ? member.senderNumber.trim() || null : null,
          transactionId: isFeeRequired ? member.transactionId.trim() || null : null,
        },
      })

      return
    }

    setErrors({})
    onComplete({
      instructor: {
        instructorId: instructor.instructorId.trim() || null,
      },
    })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="flex items-center gap-3"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon className="size-4.5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold">{t(option.title)}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {role === Role.MEMBER
              ? t(
                  "Tell us about your studies so we can verify your membership.",
                  "আপনার পড়াশোনা সম্পর্কে জানান, যাতে আমরা সদস্যপদ যাচাই করতে পারি।"
                )
              : t(
                  "Tell us about the sessions you run for the society.",
                  "সমিতির অনুষ্ঠান সম্পর্কে জানান, যেগুলো আপনি পরিচালনা করেন।"
                )}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: EASE }}
      >
        <FieldGroup>
          {role === Role.MEMBER ? (
            <>
              {isFeeRequired && payment ? (
                <>
                  <PaymentInstructionsPanel payment={payment} lang={lang} />

                  <div className="rounded-lg border border-border/80 bg-background/60 p-4 space-y-3">
                    <div className="border-b border-border/60 pb-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {t("Payment Verification Details", "পেমেন্ট যাচাইকরণের তথ্য")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(
                          "Enter the payment method, your sender mobile number, and the transaction ID from the confirmation SMS.",
                          "আপনি যে পদ্ধতিতে ফি পাঠিয়েছেন, আপনার প্রেরক নম্বর এবং ফিরতি কনফার্মেশন মেসেজের ট্রানজেকশন আইডি দিন।"
                        )}
                      </p>
                    </div>

                    <EnumSelect
                      id="payment-method"
                      label={t("Payment method", "পেমেন্ট পদ্ধতি")}
                      value={member.paymentMethod}
                      options={paymentMethodOptions}
                      labelFor={tPaymentMethod}
                      onChange={(paymentMethod) =>
                        setMember((current) => ({ ...current, paymentMethod }))
                      }
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="sender-number"
                        label={t("Sender number", "প্রেরক নম্বর")}
                        type="tel"
                        value={member.senderNumber}
                        onChange={(senderNumber) =>
                          setMember((current) => ({ ...current, senderNumber }))
                        }
                        placeholder="01XXXXXXXXX"
                        error={errors.senderNumber}
                        hint={t(
                          "The mobile number you paid from",
                          "যে নম্বর থেকে টাকা পাঠানো হয়েছে"
                        )}
                      />

                      <TextField
                        id="transaction-id"
                        label={t("Transaction id", "ট্রানজেকশন আইডি")}
                        value={member.transactionId}
                        onChange={(transactionId) =>
                          setMember((current) => ({ ...current, transactionId }))
                        }
                        placeholder="e.g. 9J8A7B6C5"
                        error={errors.transactionId}
                        hint={t(
                          "TrxID from confirmation SMS",
                          "কনফার্মেশন এসএমএসের TrxID"
                        )}
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="board-or-class-roll"
                  label={t("Board or Class Roll", "বোর্ড বা ক্লাস রোল")}
                  value={member.boardOrClassRoll}
                  onChange={(boardOrClassRoll) =>
                    setMember((current) => ({ ...current, boardOrClassRoll }))
                  }
                  placeholder="e.g. 612345"
                />
                <TextField
                  id="session"
                  label={t("Session", "সেশন")}
                  value={member.session}
                  onChange={(session) => setMember((current) => ({ ...current, session }))}
                  placeholder="25-26"
                  error={errors.session}
                />
              </div>

              <EnumSelect
                id="department"
                label={t("Department", "বিভাগ")}
                value={member.department}
                options={Object.values(Department)}
                labelFor={tDepartment}
                onChange={(department) => setMember((current) => ({ ...current, department }))}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <EnumSelect
                  id="semester"
                  label={t("Semester", "সেমিস্টার")}
                  value={member.semester}
                  options={Object.values(Semester)}
                  labelFor={tSemester}
                  onChange={(semester) => setMember((current) => ({ ...current, semester }))}
                />
                <EnumSelect
                  id="shift"
                  label={t("Shift", "শিফট")}
                  value={member.shift}
                  options={Object.values(Shift)}
                  labelFor={tShift}
                  onChange={(shift) => setMember((current) => ({ ...current, shift }))}
                />
              </div>

              {studentIdPolicy?.isAutoEnabled ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {t("Student ID", "স্টুডেন্ট আইডি")}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-medium text-primary">
                      {t("Auto-generated", "স্বয়ংক্রিয় বরাদ্দ")}
                    </span>
                  </div>
                  <p className="text-xs/relaxed text-muted-foreground">
                    {t(
                      `Assigned automatically on registration in format: ${studentIdPolicy.prefix || "DPICS"}${studentIdPolicy.batch || "24"}xxxx (starting from 0001).`,
                      `নিবন্ধন সম্পন্ন হলে স্বয়ংক্রিয়ভাবে এই ফরম্যাটে আইডি বরাদ্দ করা হবে: ${studentIdPolicy.prefix || "DPICS"}${studentIdPolicy.batch || "24"}xxxx (০০০১ থেকে শুরু)।`
                    )}
                  </p>
                </div>
              ) : (
                <TextField
                  id="student-id"
                  label={t("Student id", "স্টুডেন্ট আইডি")}
                  value={member.studentId}
                  onChange={(studentId) => setMember((current) => ({ ...current, studentId }))}
                  placeholder="DPI-2024-001"
                />
              )}

              <DocumentUploadField
                id="student-id-card"
                label={t("Student ID card", "স্টুডেন্ট আইডি কার্ড")}
                value={member.studentIdCardUrl}
                onChange={(url) =>
                  setMember((current) => ({ ...current, studentIdCardUrl: url }))
                }
                helpText={t("An administrator verifies this.", "একজন প্রশাসক এটি যাচাই করবেন।")}
                placeholder={t("Upload student ID card photo or PDF", "আইডি কার্ড আপলোড করুন")}
              />

              <DocumentUploadField
                id="nid"
                label={t("NID or birth certificate", "এনআইডি বা জন্ম সনদ")}
                value={member.nidorbirthUrl}
                onChange={(url) =>
                  setMember((current) => ({ ...current, nidorbirthUrl: url }))
                }
                placeholder={t("Upload NID or birth certificate photo or PDF", "এনআইডি বা জন্ম সনদ আপলোড করুন")}
              />
            </>
          ) : (
            <>
              <TextField
                id="instructor-id"
                label={t("Instructor ID", "শিক্ষক আইডি")}
                value={instructor.instructorId}
                disabled
                onChange={(instructorId) =>
                  setInstructor((current) => ({ ...current, instructorId }))
                }
                placeholder={t("auto-generate", "স্বয়ংক্রিয় ভাবে তৈরি হবে")}
                hint={t(
                  "Leave blank to automatically assign the next sequential ID (e.g. INS0001).",
                  "স্বয়ংক্রিয়ভাবে পরবর্তী ক্রমিক আইডি পেতে খালি রাখুন (যেমন INS0001)।"
                )}
              />
            </>
          )}
        </FieldGroup>

        {error ? <FieldError className="mt-3">{error}</FieldError> : null}

        <p className="mt-4 text-xs/relaxed text-muted-foreground">
          {t(
            "Your record starts as pending. An administrator reviews it before it becomes active.",
            "আপনার রেকর্ডটি অপেক্ষমাণ হিসেবে শুরু হবে। সক্রিয় হওয়ার আগে একজন প্রশাসক যাচাই করবেন।"
          )}
        </p>
      </motion.div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
          <ArrowLeft data-icon="inline-start" />
          {t("Back", "পিছনে")}
        </Button>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? <Spinner className="size-3.5" data-icon="inline-start" /> : null}
          {isPending ? t("Submitting...", "জমা হচ্ছে...") : t("Finish sign up", "সাইন আপ শেষ করুন")}
        </Button>
      </div>
    </form>
  )
}