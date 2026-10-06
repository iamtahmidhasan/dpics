"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { TextAreaField, TextField } from "@/components/form-fields"
import { BloodGroupSelect } from "@/components/media/blood-group-select"
import { CoverImagePicker } from "@/components/media/cover-image-picker"
import { SkillsInput } from "@/components/media/skills-input"
import { UserPhotoUpload } from "@/components/media/user-photo-upload"
import { useLanguage } from "@/components/language-provider"
import { normalizeImageList } from "@/lib/user-image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

const EASE = [0.25, 0.1, 0.25, 1] as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** What the account step (or the session) already knows about the person. */
export type UserSeed = {
  name: string
  email: string
  phone: string
  image?: string | string[] | null
  images?: string[] | null
}

export type UserDetails = {
  name: string
  email: string
  phone: string | null
  images: string[]
  selectedImageIndex: number
  address: string | null
  bloodGroup: string | null
  coverImg: string
  whatsappNumber: string | null
  bio: string | null
  skills: string[]
}

export function ProfileStep({
  seed,
  error,
  onError,
  onContinue,
}: {
  seed: UserSeed
  error: string | null
  onError: (message: string | null) => void
  onContinue: (details: UserDetails) => void
}) {
  const { t } = useLanguage()

  const [name, setName] = useState(seed.name)
  const [email, setEmail] = useState(seed.email)
  const [phone, setPhone] = useState(seed.phone)
  const [images, setImages] = useState<string[]>(() =>
    normalizeImageList(seed.images ?? seed.image)
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageError, setImageError] = useState<string | null>(null)

  // New & relocated fields
  const [whatsappNumber, setWhatsappNumber] = useState(seed.phone || "")
  const [bloodGroup, setBloodGroup] = useState("")
  const [address, setAddress] = useState("")
  const [coverImg, setCoverImg] = useState("1")
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState<string[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const initials = (name || "?").trim().charAt(0).toUpperCase()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError(null)

    const nextErrors: Record<string, string> = {}

    if (!name.trim()) {
      nextErrors.name = t("Name is required", "নাম আবশ্যক")
    }

    if (!email.trim()) {
      nextErrors.email = t("Email is required", "ইমেইল আবশ্যক")
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = t("Email is not valid", "ইমেইল সঠিক নয়")
    }

    if (!whatsappNumber.trim()) {
      nextErrors.whatsappNumber = t("WhatsApp number is required", "হোয়াটসঅ্যাপ নম্বর আবশ্যক")
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onContinue({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      images,
      selectedImageIndex: images.length === 0 ? 0 : selectedImageIndex,
      address: address.trim() || null,
      bloodGroup: bloodGroup.trim() || null,
      coverImg: coverImg || "1",
      whatsappNumber: whatsappNumber.trim() || null,
      bio: bio.trim() || null,
      skills,
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h1 className="text-2xl font-bold">{t("Basic information", "মৌলিক তথ্য")}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t(
            "Set up your profile, identity details, and cover styling. You can edit this anytime.",
            "আপনার প্রোফাইল, পরিচয়ের বিবরণ এবং কভার ডিজাইন সেট করুন। এগুলো পরে পরিবর্তন করা যাবে।"
          )}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: EASE }}
      >
        <FieldGroup>
          {/* Cover Image Picker */}
          <div className="space-y-2">
            <FieldLabel>{t("Profile Cover Image", "প্রোফাইল কভার ছবি")}</FieldLabel>
            <CoverImagePicker value={coverImg} onChange={setCoverImg} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="info-name"
              label={t("Full name", "পূর্ণ নাম")}
              value={name}
              onChange={setName}
              autoComplete="name"
              error={errors.name}
            />
            <TextField
              id="info-email"
              label={t("Email", "ইমেইল")}
              type="email"
              value={email}
              disabled
              onChange={setEmail}
              autoComplete="email"
              error={errors.email}
              hint={t("Linked to your account and cannot be changed.", "আপনার অ্যাকাউন্টের সাথে যুক্ত এবং পরিবর্তন করা যাবে না।")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="info-whatsapp"
              label={t("WhatsApp number", "হোয়াটসঅ্যাপ নম্বর")}
              type="tel"
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              autoComplete="tel"
              placeholder="+8801XXXXXXXXX"
              error={errors.whatsappNumber}
              hint={t(
                "Used for society member group communications.",
                "সমিতির সদস্য গ্রুপ ও যোগাযোগের জন্য ব্যবহৃত হবে।"
              )}
            />

            <TextField
              id="info-phone"
              label={t("Alternate phone", "বিকল্প ফোন নম্বর")}
              type="tel"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              placeholder="+8801XXXXXXXXX"
              hint={t("Optional secondary contact number.", "ঐচ্ছিক যোগাযোগের নম্বর।")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <BloodGroupSelect
              id="info-blood"
              value={bloodGroup}
              onChange={setBloodGroup}
              hint={t("For club blood-donor network.", "ক্লাবের রক্তদান নেটওয়ার্কের জন্য।")}
            />

            <TextField
              id="info-address"
              label={t("Address", "ঠিকানা")}
              value={address}
              onChange={setAddress}
              placeholder={t("e.g. Mirpur, Dhaka", "যেমন মিরপুর, ঢাকা")}
              hint={t("Current residential area or district.", "বর্তমান বাসস্থান বা জেলা।")}
            />
          </div>

          {/* Bio */}
          <TextAreaField
            id="info-bio"
            label={t("Biography / About", "পরিচিতি / নিজের সম্পর্কে")}
            rows={3}
            value={bio}
            onChange={setBio}
            placeholder={t(
              "Briefly describe your background, interests, and goals...",
              "আপনার পটভূমি, আগ্রহ এবং লক্ষ্য সম্পর্কে সংক্ষিপ্ত বিবরণ দিন..."
            )}
          />

          {/* Skills */}
          <div className="space-y-1.5">
            <FieldLabel>{t("Skills & Technologies", "দক্ষতা ও প্রযুক্তি")}</FieldLabel>
            <SkillsInput
              id="info-skills"
              skills={skills}
              onChange={setSkills}
              placeholder={t("e.g. React, Python, C++, UI/UX...", "যেমন React, Python, C++, UI/UX...")}
            />
          </div>

          {/* Photos / Avatar */}
          <Field data-invalid={!!imageError}>
            <FieldLabel>{t("Avatar Photo", "অ্যাভাটার ছবি")}</FieldLabel>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                {images[selectedImageIndex] && (
                  <AvatarImage
                    keepMounted
                    render={
                      <Image
                        src={images[selectedImageIndex]}
                        alt={name}
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
              onChange={({ images: nextImages, selectedIndex: nextIndex }) => {
                setImages(nextImages)
                setSelectedImageIndex(nextIndex)
                setImageError(null)
              }}
            />
            {imageError ? <FieldError>{imageError}</FieldError> : null}
          </Field>
        </FieldGroup>
      </motion.div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          {t("Continue", "পরবর্তী")}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </form>
  )
}