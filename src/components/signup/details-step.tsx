"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"

import { EnumSelect, TextAreaField, TextField } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { roleOption } from "@/components/signup/signup-steps"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { Department, Role, Semester, Shift } from "@/generated/prisma/enums"
import { departmentLabel, semesterLabel, shiftLabel } from "@/lib/profile-labels"
import type { SelfAssignableRole } from "@/lib/roles"
import type { InstructorInput, MemberInput } from "@/lib/services/profile.service"

const EASE = [0.25, 0.1, 0.25, 1] as const

type MemberForm = {
  whatsapp: string
  department: Department
  session: string
  semester: Semester
  shift: Shift
  studentId: string
  studentIdCardUrl: string
  nidorbirthUrl: string
}

type InstructorForm = {
  instructorId: string
  bio: string
  expertise: string
}

const EMPTY_MEMBER: MemberForm = {
  whatsapp: "",
  department: Department.COMPUTER_SCIENCE_AND_TECHNOLOGY,
  session: "",
  semester: Semester.FIRST,
  shift: Shift.MORNING,
  studentId: "",
  studentIdCardUrl: "",
  nidorbirthUrl: "",
}

const EMPTY_INSTRUCTOR: InstructorForm = {
  instructorId: "",
  bio: "",
  expertise: "",
}

/** The wizard merges this into the `POST /api/onboarding` body alongside `role`. */
export type OnboardingDetails =
  | { member: MemberInput }
  | { instructor: InstructorInput }

export function DetailsStep({
  role,
  error,
  isPending,
  onError,
  onBack,
  onComplete,
}: {
  role: SelfAssignableRole
  error: string | null
  isPending: boolean
  onError: (message: string | null) => void
  onBack: () => void
  onComplete: (details: OnboardingDetails) => void
}) {
  const { t } = useLanguage()
  const tDepartment = departmentLabel(t)
  const tSemester = semesterLabel(t)
  const tShift = shiftLabel(t)

  const [member, setMember] = useState<MemberForm>(EMPTY_MEMBER)
  const [instructor, setInstructor] = useState<InstructorForm>(EMPTY_INSTRUCTOR)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const option = roleOption(role)
  const Icon = option.icon

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError(null)

    if (role === Role.MEMBER) {
      const nextErrors: Record<string, string> = {}

      if (!member.whatsapp.trim()) {
        nextErrors.whatsapp = t("Whatsapp is required", "হোয়াটসঅ্যাপ আবশ্যক")
      }

      if (!member.session.trim()) {
        nextErrors.session = t("Session is required", "সেশন আবশ্যক")
      }

      setErrors(nextErrors)

      if (Object.keys(nextErrors).length > 0) return

      onComplete({
        member: {
          whatsapp: member.whatsapp.trim(),
          department: member.department,
          session: member.session.trim(),
          semester: member.semester,
          shift: member.shift,
          studentId: member.studentId.trim() || null,
          studentIdCardUrl: member.studentIdCardUrl.trim() || null,
          nidorbirthUrl: member.nidorbirthUrl.trim() || null,
        },
      })

      return
    }

    setErrors({})
    onComplete({
      instructor: {
        instructorId: instructor.instructorId.trim() || null,
        bio: instructor.bio.trim() || null,
        expertise: instructor.expertise.trim() || null,
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
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="whatsapp"
                  label={t("Whatsapp", "হোয়াটসঅ্যাপ")}
                  value={member.whatsapp}
                  onChange={(whatsapp) => setMember((current) => ({ ...current, whatsapp }))}
                  placeholder="+8801XXXXXXXXX"
                  error={errors.whatsapp}
                />
                <TextField
                  id="session"
                  label={t("Session", "সেশন")}
                  value={member.session}
                  onChange={(session) => setMember((current) => ({ ...current, session }))}
                  placeholder="2024"
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

              <TextField
                id="student-id"
                label={t("Student id", "স্টুডেন্ট আইডি")}
                value={member.studentId}
                onChange={(studentId) => setMember((current) => ({ ...current, studentId }))}
                placeholder="DPI-2024-001"
              />

              <TextField
                id="student-id-card"
                label={t("Student id card url", "স্টুডেন্ট আইডি কার্ড লিংক")}
                value={member.studentIdCardUrl}
                onChange={(studentIdCardUrl) =>
                  setMember((current) => ({ ...current, studentIdCardUrl }))
                }
                placeholder="https://example.com/id-card.jpg"
                hint={t("An administrator verifies this.", "একজন প্রশাসক এটি যাচাই করবেন।")}
              />

              <TextField
                id="nid"
                label={t("Nid or birth certificate url", "এনআইডি বা জন্ম সার্টিফিকেট লিংক")}
                value={member.nidorbirthUrl}
                onChange={(nidorbirthUrl) =>
                  setMember((current) => ({ ...current, nidorbirthUrl }))
                }
                placeholder="https://example.com/nid.jpg"
              />
            </>
          ) : (
            <>
              <TextField
                id="instructor-id"
                label={t("Instructor id", "শিক্ষক আইডি")}
                value={instructor.instructorId}
                onChange={(instructorId) =>
                  setInstructor((current) => ({ ...current, instructorId }))
                }
                placeholder="DPI-INS-001"
              />

              <TextField
                id="expertise"
                label={t("Expertise", "বিশেষজ্ঞতা")}
                value={instructor.expertise}
                onChange={(expertise) => setInstructor((current) => ({ ...current, expertise }))}
                placeholder={t("Web development, networking", "ওয়েব ডেভেলপমেন্ট, নেটওয়ার্কিং")}
              />

              <TextAreaField
                id="bio"
                label={t("Bio", "পরিচিতি")}
                rows={4}
                value={instructor.bio}
                onChange={(bio) => setInstructor((current) => ({ ...current, bio }))}
                placeholder={t("Tell us about yourself.", "আপনার সম্পর্কে লিখুন।")}
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
          {isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {isPending ? t("Submitting...", "জমা হচ্ছে...") : t("Finish sign up", "সাইন আপ শেষ করুন")}
        </Button>
      </div>
    </form>
  )
}