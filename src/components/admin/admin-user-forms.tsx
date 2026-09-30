"use client"

import { Check, Loader2, Plus, Star, X } from "lucide-react"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import type { AdminUserDetail } from "@/lib/services/admin-user.service"
import {
  CheckboxField,
  EnumSelect,
  TextAreaField,
  TextField,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "./admin-user-fields"

type Errors = Record<string, string | undefined>

// Kept local rather than imported from `@/lib/validation`, which is server only.
const MAX_IMAGES = 5

/** Photos with a "set as avatar" action, mirroring the profile picture picker. */
function PicturePicker({
  images,
  selectedIndex,
  onChange,
}: {
  images: string[]
  selectedIndex: number
  onChange: (next: { images: string[]; selectedIndex: number }) => void
}) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)

  function add() {
    const value = draft.trim()

    if (!value) return

    if (images.length >= MAX_IMAGES) {
      setError(t(`You can keep at most ${MAX_IMAGES} pictures`, `সর্বোচ্চ ${MAX_IMAGES}টি ছবি রাখা যাবে`))
      return
    }

    if (!value.startsWith("/") && !/^https?:\/\//.test(value)) {
      setError(t("Enter a valid url", "একটি বৈধ url দিন"))
      return
    }

    if (images.includes(value)) {
      setError(t("That picture is already added", "ছবিটি ইতিমধ্যে যোগ করা আছে"))
      return
    }

    onChange({ images: [...images, value], selectedIndex })
    setDraft("")
    setError(null)
  }

  function remove(index: number) {
    const next = images.filter((_, position) => position !== index)

    onChange({
      images: next,
      selectedIndex: next.length === 0 ? 0 : Math.min(selectedIndex, next.length - 1),
    })
  }

  return (
    <Field>
      <span className="text-xs/relaxed font-medium">{t("Pictures", "ছবি")}</span>

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={t("Paste an image url", "একটি ছবির url দিন")}
          aria-label={t("Picture url", "ছবির url")}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" size="icon-lg" onClick={add} aria-label={t("Add picture", "ছবি যোগ করুন")}>
          <Plus />
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-xs/relaxed text-destructive">
          {error}
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="text-muted-foreground">{t("No pictures yet", "কোনো ছবি নেই")}</p>
      ) : (
        <ul className="flex flex-wrap gap-2 pt-1">
          {images.map((image, index) => (
            <li key={image} className="flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={t("Picture", "ছবি")}
                className="size-16 rounded-md border border-border object-cover"
              />
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={index === selectedIndex ? "default" : "outline"}
                  size="icon-sm"
                  disabled={index === selectedIndex}
                  onClick={() => onChange({ images, selectedIndex: index })}
                  aria-label={t("Set as avatar", "অ্যাভাটার হিসেবে সেট করুন")}
                >
                  <Star />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  aria-label={t("Remove picture", "ছবি সরান")}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

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

            <PicturePicker
              images={images}
              selectedIndex={selectedImageIndex}
              onChange={(next) => {
                setImages(next.images)
                setSelectedImageIndex(next.selectedIndex)
              }}
            />

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
              <TextField
                id="member-student-id"
                label={t("Student id", "শিক্ষা আইডি")}
                value={studentId}
                onChange={setStudentId}
                hint={t("Must be unique across all members", "সব সদস্যের মধ্যে অনন্য হতে হবে")}
              />
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
              <TextField
                id="member-id-card"
                label={t("Student id card url", "শিক্ষা আইডি কার্ডের url")}
                type="url"
                value={studentIdCardUrl}
                onChange={setStudentIdCardUrl}
              />
              <TextField
                id="member-nid"
                label={t("Nid or birth certificate url", "নিড বা জন্ম সার্টিফিকেটের url")}
                type="url"
                value={nidorbirthUrl}
                onChange={setNidorbirthUrl}
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
              <TextField
                id="instructor-id"
                label={t("Instructor id", "শিক্ষক আইডি")}
                value={instructorId}
                onChange={setInstructorId}
                error={errors.instructorId}
                hint={t("Must be unique across all instructors", "সব শিক্ষকের মধ্যে অনন্য হতে হবে")}
              />
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