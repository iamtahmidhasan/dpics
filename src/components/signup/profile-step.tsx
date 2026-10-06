"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { TextField } from "@/components/form-fields"
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

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    onContinue({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      images,
      selectedImageIndex: images.length === 0 ? 0 : selectedImageIndex,
    })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h1 className="text-2xl font-bold">{t("Basic information", "মৌলিক তথ্য")}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t(
            "How you show up across the society. You can change all of this later.",
            "সমিতির সর্বত্র আপনি যেভাবে দেখাবেন। এগুলো পরে যেকোনো সময় বদলাতে পারবেন।"
          )}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: EASE }}
      >
        <FieldGroup>
          <TextField
            id="info-name"
            label={t("Full name", "পূর্ণ নাম")}
            value={name}
            onChange={setName}
            autoComplete="name"
            error={errors.name}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="info-email"
              label={t("Email", "ইমেইল")}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              error={errors.email}
            />

            <TextField
              id="info-phone"
              label={t("Phone", "ফোন")}
              type="tel"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              placeholder="+8801XXXXXXXXX"
              hint={t(
                "Optional, used for society announcements.",
                "ঐচ্ছিক, সমিতির নোটিশে ব্যবহার হয়।"
              )}
            />
          </div>

          <Field data-invalid={!!imageError}>
            <FieldLabel>{t("Pictures", "ছবি")}</FieldLabel>
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