"use client"

import { Check, Loader2, Plus, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { EnumSelect } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Department, Semester, Shift } from "@/generated/prisma/enums"
import { departmentLabel, semesterLabel, shiftLabel } from "@/lib/profile-labels"
import type { Profile, ProfileInput } from "@/lib/services/profile.service"

const MAX_IMAGES = 5

export type ProfileSection = "general" | "member" | "instructor"

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

function toMemberForm(profile: Profile): MemberForm {
  if (!profile.member) return EMPTY_MEMBER

  return {
    whatsapp: profile.member.whatsapp,
    department: profile.member.department,
    session: profile.member.session,
    semester: profile.member.semester,
    shift: profile.member.shift,
    studentId: profile.member.studentId ?? "",
    studentIdCardUrl: profile.member.studentIdCardUrl ?? "",
    nidorbirthUrl: profile.member.nidorbirthUrl ?? "",
  }
}

function toInstructorForm(profile: Profile): InstructorForm {
  if (!profile.instructor) return EMPTY_INSTRUCTOR

  return {
    instructorId: profile.instructor.instructorId ?? "",
    bio: profile.instructor.bio ?? "",
    expertise: profile.instructor.expertise ?? "",
  }
}

function isImageSource(value: string): boolean {
  return value.startsWith("/") || /^https?:\/\//.test(value)
}

function PicturePicker({
  images,
  selectedIndex,
  onSelect,
  onRemove,
}: {
  images: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  onRemove: (index: number) => void
}) {
  const { t } = useLanguage()

  if (images.length === 0) {
    return (
      <p className="text-xs/relaxed text-muted-foreground">
        {t("No picture yet.", "এখনো কোনো ছবি নেই।")}
      </p>
    )
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {images.map((image, index) => {
        const isSelected = index === selectedIndex

        return (
          <li key={image} className="relative">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={isSelected}
              aria-label={t("Use this picture", "এই ছবিটি ব্যবহার করুন")}
              className={`size-14 overflow-hidden rounded-md border-2 transition-colors ${
                isSelected ? "border-primary" : "border-border hover:border-ring"
              }`}
            >
              <Image
                src={image}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="size-full object-cover"
              />
              {isSelected && (
                <span className="absolute right-0.5 bottom-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                  <Check className="size-2.5" />
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={t("Remove this picture", "এই ছবিটি সরান")}
              className="absolute -top-1.5 -right-1.5 rounded-full border border-border bg-background p-0.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-2.5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function ProfileForm({
  profile,
  section,
  isPending,
  error,
  onSubmit,
}: {
  profile: Profile
  section: ProfileSection
  isPending: boolean
  error: string | null
  onSubmit: (input: ProfileInput) => void
}) {
  const { t } = useLanguage()
  const tDepartment = departmentLabel(t)
  const tSemester = semesterLabel(t)
  const tShift = shiftLabel(t)

  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [images, setImages] = useState(profile.images)
  const [selectedImageIndex, setSelectedImageIndex] = useState(profile.selectedImageIndex)
  const [imageUrl, setImageUrl] = useState("")
  const [imageError, setImageError] = useState<string | null>(null)
  const [member, setMember] = useState<MemberForm>(() => toMemberForm(profile))
  const [instructor, setInstructor] = useState<InstructorForm>(() =>
    toInstructorForm(profile)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const initials = (profile.name || "?").trim().charAt(0).toUpperCase()

  function handleAddImage() {
    const url = imageUrl.trim()

    if (!isImageSource(url)) {
      setImageError(
        t("Enter a full url starting with http or a / path.", "http বা / দিয়ে শুরু হওয়া লিংক দিন।")
      )
      return
    }

    if (images.length >= MAX_IMAGES) {
      setImageError(
        t(`You can keep at most ${MAX_IMAGES} pictures.`, `সর্বোচ্চ ${MAX_IMAGES}টি ছবি রাখা যাবে।`)
      )
      return
    }

    if (images.includes(url)) {
      setImageError(t("That picture is already added.", "ছবিটি ইতিমধ্যেই যোগ করা আছে।"))
      return
    }

    setImages((current) => [...current, url])
    setSelectedImageIndex(images.length)
    setImageUrl("")
    setImageError(null)
  }

  function handleRemoveImage(index: number) {
    setImages((current) => current.filter((_, position) => position !== index))
    setSelectedImageIndex((current) => {
      if (index < current) return current - 1
      if (index === current) return Math.max(0, current - 1)

      return current
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    const input: ProfileInput = {}

    if (section === "general") {
      if (!name.trim()) {
        nextErrors.name = t("Name is required", "নাম আবশ্যক")
      }

      if (!email.trim()) {
        nextErrors.email = t("Email is required", "ইমেইল আবশ্যক")
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = t("Email is not valid", "ইমেইল সঠিক নয়")
      }

      input.user = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        images,
        selectedImageIndex: images.length === 0 ? 0 : selectedImageIndex,
      }
    }

    if (section === "member") {
      if (!member.whatsapp.trim()) {
        nextErrors.whatsapp = t("Whatsapp is required", "হোয়াটসঅ্যাপ আবশ্যক")
      }

      if (!member.session.trim()) {
        nextErrors.session = t("Session is required", "সেশন আবশ্যক")
      }

      input.member = {
        whatsapp: member.whatsapp.trim(),
        department: member.department,
        session: member.session.trim(),
        semester: member.semester,
        shift: member.shift,
        studentId: member.studentId.trim() || null,
        studentIdCardUrl: member.studentIdCardUrl.trim() || null,
        nidorbirthUrl: member.nidorbirthUrl.trim() || null,
      }
    }

    if (section === "instructor") {
      input.instructor = {
        instructorId: instructor.instructorId.trim() || null,
        bio: instructor.bio.trim() || null,
        expertise: instructor.expertise.trim() || null,
      }
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onSubmit(input)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      {section === "general" ? (
        <>
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("Basic information", "মৌলিক তথ্য")}</CardTitle>
              <CardDescription>
                {t("How you show up across the society.", "সমিতির সর্বত্র আপনি যেভাবে দেখাবেন।")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">{t("Full name", "পূর্ণ নাম")}</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name ? <FieldError>{errors.name}</FieldError> : null}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">{t("Email", "ইমেইল")}</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email ? <FieldError>{errors.email}</FieldError> : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phone">{t("Phone", "ফোন")}</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                      placeholder="+8801XXXXXXXXX"
                    />
                    <FieldDescription>
                      {t("Optional, used for society announcements.", "ঐচ্ছিক, সমিতির নোটিশে ব্যবহৃত হয়।")}
                    </FieldDescription>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("Pictures", "ছবি")}</CardTitle>
              <CardDescription>
                {t(
                  "Add up to a few links and pick the one used as your avatar.",
                  "কয়েকটি লিংক যোগ করে এবং যেটি অ্যাভাটার হবে সেটি বেছে নিন।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  {images[selectedImageIndex] && (
                    <AvatarImage
                      keepMounted
                      render={
                        <Image
                          src={images[selectedImageIndex]}
                          alt={profile.name}
                          width={48}
                          height={48}
                          unoptimized
                        />
                      }
                    />
                  )}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <p className="text-xs/relaxed text-muted-foreground">
                  {t("Current avatar", "বর্তমান অ্যাভাটার")}
                </p>
              </div>

              <PicturePicker
                images={images}
                selectedIndex={selectedImageIndex}
                onSelect={setSelectedImageIndex}
                onRemove={handleRemoveImage}
              />

              <Field data-invalid={!!imageError}>
                <FieldLabel htmlFor="image-url">{t("Picture url", "ছবির লিংক")}</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(event) => {
                      setImageUrl(event.target.value)
                      setImageError(null)
                    }}
                    placeholder="https://example.com/me.jpg"
                    aria-invalid={!!imageError}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddImage}
                    disabled={isPending || images.length >= MAX_IMAGES}
                  >
                    <Plus data-icon="inline-start" />
                    {t("Add", "যোগ করুন")}
                  </Button>
                </div>
                {imageError ? <FieldError>{imageError}</FieldError> : null}
              </Field>
            </CardContent>
          </Card>
        </>
      ) : null}

      {section === "member" ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("Member details", "সদস্যের তথ্য")}</CardTitle>
            <CardDescription>
              {t("Saved with your membership record.", "আপনার সদস্যপদ রেকর্ডের সাথে সংরক্ষিত হয়।")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.whatsapp}>
                  <FieldLabel htmlFor="whatsapp">{t("Whatsapp", "হোয়াটসঅ্যাপ")}</FieldLabel>
                  <Input
                    id="whatsapp"
                    value={member.whatsapp}
                    onChange={(event) =>
                      setMember((current) => ({ ...current, whatsapp: event.target.value }))
                    }
                    placeholder="+8801XXXXXXXXX"
                    aria-invalid={!!errors.whatsapp}
                  />
                  {errors.whatsapp ? <FieldError>{errors.whatsapp}</FieldError> : null}
                </Field>

                <Field data-invalid={!!errors.session}>
                  <FieldLabel htmlFor="session">{t("Session", "সেশন")}</FieldLabel>
                  <Input
                    id="session"
                    value={member.session}
                    onChange={(event) =>
                      setMember((current) => ({ ...current, session: event.target.value }))
                    }
                    placeholder="2024"
                    aria-invalid={!!errors.session}
                  />
                  {errors.session ? <FieldError>{errors.session}</FieldError> : null}
                </Field>
              </div>

              <EnumSelect
                id="department"
                label={t("Department", "বিভাগ")}
                value={member.department}
                options={Object.values(Department)}
                labelFor={tDepartment}
                onChange={(department) =>
                  setMember((current) => ({ ...current, department }))
                }
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

              <Field>
                <FieldLabel htmlFor="student-id">{t("Student id", "স্টুডেন্ট আইডি")}</FieldLabel>
                <Input
                  id="student-id"
                  value={member.studentId}
                  onChange={(event) =>
                    setMember((current) => ({ ...current, studentId: event.target.value }))
                  }
                  placeholder="DPI-2024-001"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="student-id-card">
                  {t("Student id card url", "স্টুডেন্ট আইডি কার্ড লিংক")}
                </FieldLabel>
                <Input
                  id="student-id-card"
                  value={member.studentIdCardUrl}
                  onChange={(event) =>
                    setMember((current) => ({
                      ...current,
                      studentIdCardUrl: event.target.value,
                    }))
                  }
                  placeholder="https://example.com/id-card.jpg"
                />
                <FieldDescription>
                  {t("An administrator verifies this.", "একজন প্রশাসক এটি যাচাই করবেন।")}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="nid">
                  {t("Nid or birth certificate url", "এনআইডি বা জন্ম সার্টিফিকেট লিংক")}
                </FieldLabel>
                <Input
                  id="nid"
                  value={member.nidorbirthUrl}
                  onChange={(event) =>
                    setMember((current) => ({ ...current, nidorbirthUrl: event.target.value }))
                  }
                  placeholder="https://example.com/nid.jpg"
                />
              </Field>

              {profile.member === null ? (
                <p className="text-xs/relaxed text-muted-foreground">
                  {t(
                    "You have no membership record yet, saving here creates one for review.",
                    "আপনার এখনো সদস্যপদ রেকর্ড নেই, এখানে সংরক্ষণ করলে যাচাইয়ের জন্য একটি রেকর্ড তৈরি হবে।"
                  )}
                </p>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {section === "instructor" ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("Instructor details", "শিক্ষকের তথ্য")}</CardTitle>
            <CardDescription>
              {t("Only for society instructors.", "শুধুমাত্র সমিতির শিক্ষকদের জন্য।")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="instructor-id">
                  {t("Instructor id", "শিক্ষক আইডি")}
                </FieldLabel>
                <Input
                  id="instructor-id"
                  value={instructor.instructorId}
                  onChange={(event) =>
                    setInstructor((current) => ({
                      ...current,
                      instructorId: event.target.value,
                    }))
                  }
                  placeholder="DPI-INS-001"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="expertise">{t("Expertise", "বিশেষজ্ঞতা")}</FieldLabel>
                <Input
                  id="expertise"
                  value={instructor.expertise}
                  onChange={(event) =>
                    setInstructor((current) => ({ ...current, expertise: event.target.value }))
                  }
                  placeholder="Web development, networking"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="bio">{t("Bio", "পরিচিতি")}</FieldLabel>
                <textarea
                  id="bio"
                  rows={4}
                  value={instructor.bio}
                  onChange={(event) =>
                    setInstructor((current) => ({ ...current, bio: event.target.value }))
                  }
                  className="w-full resize-y rounded-md border border-input bg-input/20 px-2 py-1.5 text-xs/relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
                  placeholder={t("Tell us about yourself.", "আপনার সম্পর্কে লিখুন।")}
                />
              </Field>

              {profile.instructor === null ? (
                <p className="text-xs/relaxed text-muted-foreground">
                  {t(
                    "You have no instructor record yet, saving here creates one for review.",
                    "আপনার এখনো শিক্ষক রেকর্ড নেই, এখানে সংরক্ষণ করলে যাচাইয়ের জন্য একটি রেকর্ড তৈরি হবে।"
                  )}
                </p>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {isPending ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save changes", "পরিবর্তন সংরক্ষণ")}
        </Button>
      </div>
    </form>
  )
}
