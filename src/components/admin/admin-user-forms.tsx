"use client"

import { Award, Calendar, Check, Loader2, Plus, Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { CheckboxField, EnumSelect, TextAreaField, TextField, fromDateTimeLocal, toDateTimeLocal } from "@/components/form-fields"
import { DocumentUploadField } from "@/components/media/document-upload-field"
import { UserPhotoUpload } from "@/components/media/user-photo-upload"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/format"
import type { CommitteeOption } from "@/lib/services/committee.service"
import {
  Department,
  InstructorStatus,
  MembershipStatus,
  PaymentMethod,
  Role,
  Semester,
  Shift,
  VerificationStatus,
} from "@/generated/prisma/enums"
import {
  departmentLabel,
  instructorStatusLabel,
  membershipStatusLabel,
  paymentMethodLabel,
  semesterLabel,
  shiftLabel,
  verificationStatusLabel,
} from "@/lib/profile-labels"
import type { AdminCommitteeRole, AdminUserDetail } from "@/lib/services/admin-user.service"

type Errors = Record<string, string | undefined>



export function AdminAccountForm({
  user,
  isSelf,
  onSave,
  saving,
}: {
  user: AdminUserDetail
  isSelf: boolean
  onSave: (payload: Record<string, unknown>) => void
  saving: boolean
}) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Errors>({})

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [roles, setRoles] = useState<Role[]>(user.roles)
  const [isActive, setIsActive] = useState(user.isActive)
  const [emailVerified, setEmailVerified] = useState(user.emailVerified)
  const [images, setImages] = useState(user.images)
  const [selectedImageIndex, setSelectedImageIndex] = useState(user.selectedImageIndex)

  // An admin may not lock themselves out, so the server rejects these edits.
  const rolesLocked = isSelf
  const activeLocked = isSelf

  function toggleRole(role: Role) {
    setRoles((current) =>
      current.includes(role) ? current.filter((value) => value !== role) : [...current, role]
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const next: Errors = {}

    if (!name.trim()) next.name = t("Name is required", "নাম আবশ্যক")
    if (!email.trim()) next.email = t("Email is required", "ইমেইল আবশ্যক")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = t("Email is not valid", "ইমেইলটি বৈধ নয়")
    if (roles.length === 0) next.roles = t("Pick at least one role", "অন্তত একটি ভূমিকা বেছে নিন")

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave({
      user: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        images,
        selectedImageIndex,
        roles,
        isActive,
        emailVerified,
      },
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("Account", "অ্যাকাউন্ট")}</CardTitle>
        <CardDescription>
          {t(
            "Identity, contact details and access levels.",
            "পরিচয়, যোগাযোগের তথ্য এবং প্রবেশাধিকার।"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="admin-name"
                label={t("Full name", "পূর্ণ নাম")}
                value={name}
                onChange={setName}
                error={errors.name}
                autoComplete="name"
              />
              <TextField
                id="admin-email"
                label={t("Email", "ইমেইল")}
                type="email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                autoComplete="email"
              />
            </div>

            <TextField
              id="admin-phone"
              label={t("Phone", "ফোন")}
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+8801..."
              autoComplete="tel"
              hint={t("Must be unique across all users", "সব ব্যবহারকারীর মধ্যে অনন্য হতে হবে")}
            />

            <div className="space-y-1">
              <span className="text-xs font-semibold">{t("User Photos / Avatar", "ব্যবহারকারীর ছবি / অ্যাভাটার")}</span>
              <UserPhotoUpload
                images={images}
                selectedIndex={selectedImageIndex}
                onChange={(next) => {
                  setImages(next.images)
                  setSelectedImageIndex(next.selectedIndex)
                }}
              />
            </div>

            <Field data-invalid={!!errors.roles}>
              <span className="text-xs/relaxed font-medium">{t("Roles", "ভূমিকা")}</span>
              <div className="flex flex-wrap gap-3 pt-1">
                {Object.values(Role).map((role) => (
                  <label key={role} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-input accent-primary"
                      checked={roles.includes(role)}
                      disabled={rolesLocked && role === Role.ADMIN}
                      onChange={() => toggleRole(role)}
                    />
                    <span className="text-xs/relaxed">{role}</span>
                  </label>
                ))}
              </div>
              {rolesLocked ? (
                <p className="text-muted-foreground">
                  {t(
                    "You cannot remove your own admin access.",
                    "আপনি নিজের অ্যাডমিন প্রবেশাধিকার সরাতে পারবেন না।"
                  )}
                </p>
              ) : null}
              {errors.roles ? (
                <p role="alert" className="text-xs/relaxed text-destructive">
                  {errors.roles}
                </p>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <CheckboxField
                id="admin-active"
                label={t("Account is active", "অ্যাকাউন্ট সক্রিয়")}
                checked={isActive}
                disabled={activeLocked}
                onChange={setIsActive}
                hint={
                  activeLocked
                    ? t("You cannot deactivate your own account.", "আপনি নিজের অ্যাকাউন্ট নিষ্ক্রিয় করতে পারবেন না।")
                    : t("Inactive users cannot sign in.", "নিষ্ক্রিয় ব্যবহারকারী সাইন ইন করতে পারে না।")
                }
              />
              <CheckboxField
                id="admin-verified"
                label={t("Email is verified", "ইমেইল যাচাই করা")}
                checked={emailVerified}
                onChange={setEmailVerified}
                hint={t("Turn this off to force a re-verification.", "পুনরায় যাচাই করাতে এটি বন্ধ করুন।")}
              />
            </div>
          </FieldGroup>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {saving ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save account", "অ্যাকাউন্ট সংরক্ষণ করুন")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function AdminMemberForm({
  user,
  onSave,
  saving,
}: {
  user: AdminUserDetail
  onSave: (payload: Record<string, unknown>) => void
  saving: boolean
}) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Errors>({})

  const member = user.member
  const [status, setStatus] = useState<MembershipStatus>(member?.status ?? MembershipStatus.PENDING)
  const [whatsapp, setWhatsapp] = useState(member?.whatsapp ?? "")
  const [department, setDepartment] = useState<Department>(
    member?.department ?? Department.COMPUTER_SCIENCE_AND_TECHNOLOGY
  )
  const [session, setSession] = useState(member?.session ?? "")
  const [semester, setSemester] = useState<Semester>(member?.semester ?? Semester.FIRST)
  const [shift, setShift] = useState<Shift>(member?.shift ?? Shift.MORNING)
  const [studentId, setStudentId] = useState(member?.studentId ?? "")
  const [studentIdCardUrl, setStudentIdCardUrl] = useState(member?.studentIdCardUrl ?? "")
  const [nidorbirthUrl, setNidorbirthUrl] = useState(member?.nidorbirthUrl ?? "")
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    member?.verificationStatus ?? VerificationStatus.PENDING
  )
  const [joinedAt, setJoinedAt] = useState(toDateTimeLocal(member?.joinedAt ?? null))
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(member?.expiresAt ?? null))
  const [hasPaidMembershipFee, setHasPaidMembershipFee] = useState(
    member?.hasPaidMembershipFee ?? false
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    member?.paymentMethod ?? ""
  )
  const [senderNumber, setSenderNumber] = useState(member?.senderNumber ?? "")
  const [transactionId, setTransactionId] = useState(member?.transactionId ?? "")
  const [generatingStudentId, setGeneratingStudentId] = useState(false)

  async function handleGenerateStudentId() {
    try {
      setGeneratingStudentId(true)
      setErrors((prev) => ({ ...prev, studentId: undefined }))
      const res = await fetch("/api/admin/members/generate-id")
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || "Failed to generate student ID")
      }
      const data = await res.json()
      if (data.studentId) {
        setStudentId(data.studentId)
      }
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        studentId: err instanceof Error ? err.message : "Failed to generate ID",
      }))
    } finally {
      setGeneratingStudentId(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const next: Errors = {}

    if (!whatsapp.trim()) next.whatsapp = t("Whatsapp is required", "হোয়াটসঅ্যাপ আবশ্যক")
    if (!session.trim()) next.session = t("Session is required", "সেশন আবশ্যক")

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave({
      member: {
        status,
        joinedAt: fromDateTimeLocal(joinedAt),
        expiresAt: fromDateTimeLocal(expiresAt),
        whatsapp: whatsapp.trim(),
        department,
        session: session.trim(),
        semester,
        shift,
        studentId: studentId.trim() || null,
        studentIdCardUrl: studentIdCardUrl.trim() || null,
        nidorbirthUrl: nidorbirthUrl.trim() || null,
        verificationStatus,
        verifiedAt: null,
        hasPaidMembershipFee,
        paymentMethod: paymentMethod || null,
        senderNumber: senderNumber.trim() || null,
        transactionId: transactionId.trim() || null,
      },
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("Membership", "সদস্যপদ")}</CardTitle>
        <CardDescription>
          {member
            ? t("Student record, verification and payment.", "শিক্ষার রেকর্ড, যাচাই ও পেমেন্ট।")
            : t(
                "This user has no membership record yet. Saving creates one.",
                "এই ব্যবহারকারীর এখনো কোনো সদস্যপদ রেকর্ড নেই। সংরক্ষণ করলে এটি তৈরি হবে।"
              )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <EnumSelect
                id="member-status"
                label={t("Membership status", "সদস্যপদের অবস্থা")}
                value={status}
                options={Object.values(MembershipStatus)}
                labelFor={membershipStatusLabel(t)}
                onChange={setStatus}
              />
              <EnumSelect
                id="member-verification"
                label={t("Verification status", "যাচাইয়ের অবস্থা")}
                value={verificationStatus}
                options={Object.values(VerificationStatus)}
                labelFor={verificationStatusLabel(t)}
                onChange={setVerificationStatus}
                hint={t(
                  "Setting this to verified stamps the verification time automatically.",
                  "এটি যাচাই করলে যাচাইয়ের সময় স্বয়ংক্রিয়ভাবে বসবে।"
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="member-whatsapp"
                label={t("Whatsapp", "হোয়াটসঅ্যাপ")}
                type="tel"
                value={whatsapp}
                onChange={setWhatsapp}
                error={errors.whatsapp}
                placeholder="+8801..."
              />
              <Field data-invalid={!!errors.studentId}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="member-student-id">
                    {t("Student id", "শিক্ষা আইডি")}
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleGenerateStudentId}
                    disabled={generatingStudentId}
                    className="h-6 gap-1 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10"
                    title={t("Generate next sequential ID from settings", "সেটিংস অনুযায়ী পরবর্তী ক্রমিক আইডি তৈরি করুন")}
                  >
                    {generatingStudentId ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3 text-primary" />
                    )}
                    {t("Generate", "জেনারেট")}
                  </Button>
                </div>
                <Input
                  id="member-student-id"
                  name="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. DPICS240001"
                  className="font-mono text-xs"
                />
                {errors.studentId ? (
                  <FieldError>{errors.studentId}</FieldError>
                ) : (
                  <FieldDescription>
                    {t(
                      "Maintains sequence DPICS[BATCH][xxxx] from settings with gap filling.",
                      "সেটিংস থেকে শূন্যস্থান পূরণসহ DPICS[BATCH][xxxx] ক্রম বজায় রাখে।"
                    )}
                  </FieldDescription>
                )}
              </Field>
            </div>

            <EnumSelect
              id="member-department"
              label={t("Department", "বিভাগ")}
              value={department}
              options={Object.values(Department)}
              labelFor={departmentLabel(t)}
              onChange={setDepartment}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id="member-session"
                label={t("Session", "সেশন")}
                value={session}
                onChange={setSession}
                error={errors.session}
                placeholder="2024-2025"
              />
              <EnumSelect
                id="member-semester"
                label={t("Semester", "সেমিস্টার")}
                value={semester}
                options={Object.values(Semester)}
                labelFor={semesterLabel(t)}
                onChange={setSemester}
              />
              <EnumSelect
                id="member-shift"
                label={t("Shift", "শিফট")}
                value={shift}
                options={Object.values(Shift)}
                labelFor={shiftLabel(t)}
                onChange={setShift}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DocumentUploadField
                id="member-id-card"
                label={t("Student ID card", "শিক্ষার্থী আইডি কার্ড")}
                value={studentIdCardUrl}
                onChange={setStudentIdCardUrl}
                placeholder={t("Upload student ID card", "আইডি কার্ড আপলোড করুন")}
              />
              <DocumentUploadField
                id="member-nid"
                label={t("NID or birth certificate", "এনআইডি বা জন্ম সনদ")}
                value={nidorbirthUrl}
                onChange={setNidorbirthUrl}
                placeholder={t("Upload NID or birth certificate", "এনআইডি বা জন্ম সনদ আপলোড করুন")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="member-joined"
                label={t("Joined at", "যোগদানের সময়")}
                type="datetime-local"
                value={joinedAt}
                onChange={setJoinedAt}
              />
              <TextField
                id="member-expires"
                label={t("Expires at", "মেয়াদ শেষ")}
                type="datetime-local"
                value={expiresAt}
                onChange={setExpiresAt}
              />
            </div>

            <Separator />

            <CheckboxField
              id="member-paid"
              label={t("Membership fee paid", "সদস্যপদ ফি পরিশোধিত")}
              checked={hasPaidMembershipFee}
              onChange={setHasPaidMembershipFee}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <EnumSelect
                id="member-payment"
                label={t("Payment method", "পেমেন্ট পদ্ধতি")}
                value={paymentMethod}
                options={Object.values(PaymentMethod)}
                labelFor={paymentMethodLabel(t)}
                allowEmpty
                emptyLabel={t("Not set", "নির্ধারিত নয়")}
                onChange={setPaymentMethod}
              />
              <TextField
                id="member-sender"
                label={t("Sender number", "প্রেরক নম্বর")}
                type="tel"
                value={senderNumber}
                onChange={setSenderNumber}
              />
              <TextField
                id="member-transaction"
                label={t("Transaction id", "ট্রানজেকশন আইডি")}
                value={transactionId}
                onChange={setTransactionId}
              />
            </div>
          </FieldGroup>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {saving
                ? t("Saving...", "সংরক্ষণ হচ্ছে...")
                : member
                  ? t("Save membership", "সদস্যপদ সংরক্ষণ করুন")
                  : t("Create membership", "সদস্যপদ তৈরি করুন")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function AdminInstructorForm({
  user,
  onSave,
  saving,
}: {
  user: AdminUserDetail
  onSave: (payload: Record<string, unknown>) => void
  saving: boolean
}) {
  const { t } = useLanguage()
  const [errors, setErrors] = useState<Errors>({})

  const instructor = user.instructor
  const [instructorId, setInstructorId] = useState(instructor?.instructorId ?? "")
  const [bio, setBio] = useState(instructor?.bio ?? "")
  const [expertise, setExpertise] = useState(instructor?.expertise ?? "")
  const [status, setStatus] = useState<InstructorStatus>(
    instructor?.status ?? InstructorStatus.PENDING
  )
  const [generatingInstructorId, setGeneratingInstructorId] = useState(false)

  async function handleGenerateInstructorId() {
    try {
      setGeneratingInstructorId(true)
      setErrors((prev) => ({ ...prev, instructorId: undefined }))
      const res = await fetch("/api/admin/instructors/generate-id")
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || "Failed to generate instructor ID")
      }
      const data = await res.json()
      if (data.instructorId) {
        setInstructorId(data.instructorId)
      }
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        instructorId: err instanceof Error ? err.message : "Failed to generate ID",
      }))
    } finally {
      setGeneratingInstructorId(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    onSave({
      instructor: {
        instructorId: instructorId.trim() || null,
        bio: bio.trim() || null,
        expertise: expertise.trim() || null,
        status,
      },
    })
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("Instructor", "শিক্ষক")}</CardTitle>
        <CardDescription>
          {instructor
            ? t("Teaching profile.", "শিক্ষণের প্রোফাইল।")
            : t(
                "This user has no instructor record yet. Saving creates one.",
                "এই ব্যবহারকারীর এখনো কোনো শিক্ষক রেকর্ড নেই। সংরক্ষণ করলে এটি তৈরি হবে।"
              )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.instructorId}>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor="instructor-id">
                    {t("Instructor id", "শিক্ষক আইডি")}
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleGenerateInstructorId}
                    disabled={generatingInstructorId}
                    className="h-6 gap-1 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10"
                    title={t("Generate next sequential ID from settings", "সেটিংস অনুযায়ী পরবর্তী ক্রমিক আইডি তৈরি করুন")}
                  >
                    {generatingInstructorId ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3 text-primary" />
                    )}
                    {t("Generate", "জেনারেট")}
                  </Button>
                </div>
                <Input
                  id="instructor-id"
                  name="instructorId"
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  placeholder="e.g. INS0001"
                  className="font-mono text-xs"
                />
                {errors.instructorId ? (
                  <FieldError>{errors.instructorId}</FieldError>
                ) : (
                  <FieldDescription>
                    {t(
                      "Maintains sequence INS[xxxx] from settings with gap filling.",
                      "সেটিংস থেকে শূন্যস্থান পূরণসহ INS[xxxx] ক্রম বজায় রাখে।"
                    )}
                  </FieldDescription>
                )}
              </Field>
              <EnumSelect
                id="instructor-status"
                label={t("Instructor status", "শিক্ষকের অবস্থা")}
                value={status}
                options={Object.values(InstructorStatus)}
                labelFor={instructorStatusLabel(t)}
                onChange={setStatus}
              />
            </div>

            <TextField
              id="instructor-expertise"
              label={t("Expertise", "দক্ষতা")}
              value={expertise}
              onChange={setExpertise}
              placeholder={t("e.g. Web development, networking", "যেমন ওয়েব ডেভেলপমেন্ট, নেটওয়ার্কিং")}
            />

            <TextAreaField
              id="instructor-bio"
              label={t("Bio", "পরিচিতি")}
              value={bio}
              onChange={setBio}
              rows={5}
            />
          </FieldGroup>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {saving
                ? t("Saving...", "সংরক্ষণ হচ্ছে...")
                : instructor
                  ? t("Save instructor", "শিক্ষক সংরক্ষণ করুন")
                  : t("Create instructor", "শিক্ষক তৈরি করুন")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function AdminCommitteeForm({
  user,
  onUserUpdated,
}: {
  user: AdminUserDetail
  onUserUpdated: (user: AdminUserDetail) => void
}) {
  const { t, lang } = useLanguage()
  const locale = lang === "bn" ? "bn-BD" : "en-US"

  const [committees, setCommittees] = useState<CommitteeOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Assignment form state
  const [selectedCommitteeId, setSelectedCommitteeId] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Action states for existing roles
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/committee-options")
        if (res.ok) {
          const data = await res.json()
          const commList = (data.committees || []) as CommitteeOption[]
          setCommittees(commList)
          if (commList.length > 0) {
            setSelectedCommitteeId(commList[0].id)
            if (commList[0].roles?.length > 0) {
              setSelectedRoleId(commList[0].roles[0].id)
            }
          }
        }
      } finally {
        setLoadingOptions(false)
      }
    }
    load()
  }, [])

  const currentCommittee = committees.find((c) => c.id === selectedCommitteeId)
  const availableRoles = currentCommittee?.roles || []

  function handleCommitteeChange(newCommId: string) {
    setSelectedCommitteeId(newCommId)
    const comm = committees.find((c) => c.id === newCommId)
    if (comm && comm.roles.length > 0) {
      setSelectedRoleId(comm.roles[0].id)
    } else {
      setSelectedRoleId("")
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoleId) {
      setError(t("Please select a committee role", "অনুগ্রহ করে একটি পদবি নির্বাচন করুন"))
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/users/${user.id}/committee-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRoleId,
          startDate: startDate || null,
          endDate: endDate || null,
          isActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to assign committee role")

      onUserUpdated(data as AdminUserDetail)
      setSuccess(t("Committee role assigned successfully.", "কমিটির পদবি সফলভাবে নিযুক্ত হয়েছে।"))
      setStartDate("")
      setEndDate("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(roleEntry: AdminCommitteeRole) {
    setMutatingId(roleEntry.id)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/users/${user.id}/committee-roles/${roleEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !roleEntry.isActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to update role")

      onUserUpdated(data as AdminUserDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setMutatingId(null)
    }
  }

  async function handleRemoveRole(userRoleId: string) {
    setMutatingId(userRoleId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/users/${user.id}/committee-roles/${userRoleId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to remove role")

      onUserUpdated(data as AdminUserDetail)
      setSuccess(t("Committee role removed.", "কমিটির পদবি অপসারিত হয়েছে।"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role")
    } finally {
      setMutatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Committee Roles */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-4 text-primary" />
                {t("Appointed Committee Roles", "নিযুক্ত কমিটির ভূমিকা")}
              </CardTitle>
              <CardDescription>
                {t(
                  "All society committees and executive roles currently or previously held by this user.",
                  "এই ব্যবহারকারীর বর্তমান বা পূর্ববর্তী সমস্ত কমিটির পদবি।"
                )}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {user.committeeRoles.length} {t("roles", "পদবি")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {user.committeeRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {t("This user has no committee roles assigned yet.", "এই ব্যবহারকারীর কোনো কমিটির পদবি নেই।")}
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {user.committeeRoles.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        {entry.roleName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        • {entry.committeeName}
                      </span>
                      <Badge variant={entry.isActive ? "success" : "muted"} className="text-[10px]">
                        {entry.isActive ? t("Active", "সক্রিয়") : t("Ended", "সমাপ্ত")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                      <Calendar className="size-3" />
                      {entry.startDate || entry.endDate ? (
                        <span>
                          {formatDate(entry.startDate, locale)} — {formatDate(entry.endDate, locale)}
                        </span>
                      ) : (
                        <span>{t("No specific dates set", "নির্দিষ্ট মেয়াদ নির্ধারিত নেই")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleToggleActive(entry)}
                      disabled={mutatingId === entry.id}
                    >
                      {entry.isActive ? t("Mark ended", "সমাপ্ত করুন") : t("Set active", "সক্রিয় করুন")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveRole(entry.id)}
                      disabled={mutatingId === entry.id}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("Remove role", "পদবি অপসারণ")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign New Committee Role */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            {t("Assign New Committee Role", "নতুন কমিটির পদবি নিয়োগ করুন")}
          </CardTitle>
          <CardDescription>
            {t(
              "Select a committee and role to appoint this user to.",
              "ব্যবহারকারীকে নিয়োগ করতে একটি কমিটি ও পদবি নির্বাচন করুন।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOptions ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 className="size-3.5 animate-spin" />
              {t("Loading committees...", "কমিটি লোড হচ্ছে...")}
            </div>
          ) : committees.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              <p>{t("No committees available. Please create a committee first.", "কোনো কমিটি উপলব্ধ নেই। অনুগ্রহ করে প্রথমে একটি কমিটি তৈরি করুন।")}</p>
              <Link
                href="/admin/committees"
                className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                {t("Go to Committees", "কমিটি ব্যবস্থাপনায় যান")} →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="user-committee-select" className="text-xs font-medium text-foreground block">
                    {t("Committee", "কমিটি")} *
                  </label>
                  <select
                    id="user-committee-select"
                    value={selectedCommitteeId}
                    onChange={(e) => handleCommitteeChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs/relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {committees.map((comm) => (
                      <option key={comm.id} value={comm.id}>
                        {comm.name} {!comm.isActive ? `(${t("Inactive", "নিষ্ক্রিয়")})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="user-role-select" className="text-xs font-medium text-foreground block">
                    {t("Role", "পদবি")} *
                  </label>
                  <select
                    id="user-role-select"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs/relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={availableRoles.length === 0}
                  >
                    {availableRoles.length === 0 ? (
                      <option value="">{t("No roles in this committee", "এই কমিটিতে পদবি নেই")}</option>
                    ) : (
                      availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="assign-start-date"
                  label={t("Tenure start date (optional)", "শুরুর তারিখ (ঐচ্ছিক)")}
                  type="date"
                  value={startDate}
                  onChange={setStartDate}
                />
                <TextField
                  id="assign-end-date"
                  label={t("Tenure end date (optional)", "শেষের তারিখ (ঐচ্ছিক)")}
                  type="date"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>

              <CheckboxField
                id="assign-is-active"
                label={t("Active role", "সক্রিয় পদবি")}
                checked={isActive}
                onChange={setIsActive}
                hint={t("Mark as active or uncheck if recording past service", "সক্রিয় রাখুন বা পূর্ববর্তী দায়িত্বের ক্ষেত্রে টিক চিহ্ন তুলে দিন")}
              />

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-md bg-success/10 px-3 py-2 text-xs font-medium text-success">
                  {success}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || availableRoles.length === 0}>
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Check data-icon="inline-start" />
                  )}
                  {isSubmitting ? t("Assigning...", "নিয়োগ হচ্ছে...") : t("Assign committee role", "কমিটিতে নিয়োগ দিন")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}