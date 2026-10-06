"use client"

import Image from "next/image"
import { useState } from "react"

import { BloodGroupSelect } from "@/components/media/blood-group-select"
import { CoverImagePicker } from "@/components/media/cover-image-picker"
import { DocumentUploadField } from "@/components/media/document-upload-field"
import { SkillsInput } from "@/components/media/skills-input"
import { UserPhotoUpload } from "@/components/media/user-photo-upload"
import { EnumSelect } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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

export type ProfileSection = "general" | "member" | "instructor"

type MemberForm = {
  boardOrClassRoll: string
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
}

const EMPTY_INSTRUCTOR: InstructorForm = {
  instructorId: "",
}

function toMemberForm(profile: Profile): MemberForm {
  if (!profile.member) return EMPTY_MEMBER

  return {
    boardOrClassRoll: profile.member.boardOrClassRoll ?? "",
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
  }
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
  const [address, setAddress] = useState(profile.address ?? "")
  const [bloodGroup, setBloodGroup] = useState(profile.bloodGroup ?? "")
  const [coverImg, setCoverImg] = useState(profile.coverImg ?? "1")
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")
  const [skills, setSkills] = useState<string[]>(profile.skills ?? [])
  const [imageError, setImageError] = useState<string | null>(null)
  const [member, setMember] = useState<MemberForm>(() => toMemberForm(profile))
  const [instructor, setInstructor] = useState<InstructorForm>(() =>
    toInstructorForm(profile)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const initials = (profile.name || "?").trim().charAt(0).toUpperCase()

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
        address: address.trim() || null,
        bloodGroup: bloodGroup || null,
        coverImg: coverImg || "1",
        whatsappNumber: whatsappNumber.trim() || null,
        bio: bio.trim() || null,
        skills,
      }
    }

    if (section === "member") {
      if (!member.session.trim()) {
        nextErrors.session = t("Session is required", "সেশন আবশ্যক")
      }

      input.member = {
        boardOrClassRoll: member.boardOrClassRoll.trim() || null,
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
                      disabled
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      className="cursor-not-allowed opacity-60"
                    />
                    <FieldDescription>
                      {t("Email address is linked to your account and cannot be changed.", "ইমেইল ঠিকানা আপনার অ্যাকাউন্টের সাথে যুক্ত এবং পরিবর্তন করা যাবে না।")}
                    </FieldDescription>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="whatsapp-number">{t("WhatsApp number", "হোয়াটসঅ্যাপ নম্বর")}</FieldLabel>
                    <Input
                      id="whatsapp-number"
                      type="tel"
                      value={whatsappNumber}
                      onChange={(event) => setWhatsappNumber(event.target.value)}
                      placeholder="+8801XXXXXXXXX"
                    />
                  </Field>
                  <BloodGroupSelect value={bloodGroup} onChange={setBloodGroup} />
                </div>

                <Field>
                  <FieldLabel htmlFor="address">{t("Address", "ঠিকানা")}</FieldLabel>
                  <Input
                    id="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder={t("City, Country or street address", "শহর, দেশ বা ঠিকানা")}
                  />
                </Field>

                <SkillsInput value={skills} onChange={setSkills} />

                <Field>
                  <FieldLabel htmlFor="bio">{t("Bio / About", "পরিচিতি")}</FieldLabel>
                  <textarea
                    id="bio"
                    rows={3}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    className="w-full resize-y rounded-md border border-input bg-input/20 px-2 py-1.5 text-xs/relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
                    placeholder={t("Tell us about yourself.", "আপনার সম্পর্কে লিখুন।")}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("Cover Image", "কভার ছবি")}</CardTitle>
              <CardDescription>
                {t(
                  "Choose a banner design for your profile header.",
                  "আপনার প্রোফাইল হেডারের জন্য একটি ব্যানার ডিজাইন বেছে নিন।"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoverImagePicker value={coverImg} onChange={setCoverImg} />
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

              <UserPhotoUpload
                images={images}
                selectedIndex={selectedImageIndex}
                disabled={isPending}
                onChange={({ images: nextImages, selectedIndex: nextIndex }) => {
                  setImages(nextImages)
                  setSelectedImageIndex(nextIndex)
                  setImageError(null)
                }}
              />
              {imageError ? <FieldError>{imageError}</FieldError> : null}
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
                <Field>
                  <FieldLabel htmlFor="board-or-class-roll">
                    {t("Board or Class Roll", "বোর্ড বা ক্লাস রোল")}
                  </FieldLabel>
                  <Input
                    id="board-or-class-roll"
                    value={member.boardOrClassRoll}
                    onChange={(event) =>
                      setMember((current) => ({ ...current, boardOrClassRoll: event.target.value }))
                    }
                    placeholder="e.g. 612345"
                  />
                </Field>

                <Field data-invalid={!!errors.session}>
                  <FieldLabel htmlFor="session">{t("Session", "সেশন")}</FieldLabel>
                  <Input
                    id="session"
                    value={member.session}
                    onChange={(event) =>
                      setMember((current) => ({ ...current, session: event.target.value }))
                    }
                    placeholder="25-26"
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
                  disabled
                  value={member.studentId}
                  onChange={(event) =>
                    setMember((current) => ({ ...current, studentId: event.target.value }))
                  }
                  placeholder="DPICS[batch][order]"
                />
              </Field>

              <DocumentUploadField
                id="student-id-card"
                label={t("Student ID card", "স্টুডেন্ট আইডি কার্ড")}
                value={member.studentIdCardUrl}
                onChange={(url) =>
                  setMember((current) => ({
                    ...current,
                    studentIdCardUrl: url,
                  }))
                }
                disabled={isPending}
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
                disabled={isPending}
                placeholder={t("Upload NID or birth certificate photo or PDF", "এনআইডি বা জন্ম সনদ আপলোড করুন")}
              />

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
                  disabled
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

              <p className="text-xs text-muted-foreground">
                {t(
                  "Bio and Skills are unified and managed directly under the Basic Information tab.",
                  "পরিচিতি ও দক্ষতা মৌলিক তথ্য ট্যাব থেকে পরিচালিত হয়।"
                )}
              </p>

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
          {isPending ? <Spinner className="size-3.5" data-icon="inline-start" /> : null}
          {isPending ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save changes", "পরিবর্তন সংরক্ষণ")}
        </Button>
      </div>
    </form>
  )
}
