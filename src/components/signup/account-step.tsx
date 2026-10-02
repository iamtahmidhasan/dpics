"use client"

import Link from "next/link"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { MIN_PASSWORD_LENGTH } from "@/components/signup/signup-steps"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn, signUp } from "@/lib/auth-client"

export function AccountStep({
  error,
  onError,
  onCreated,
}: {
  error: string | null
  onError: (message: string | null) => void
  onCreated: (account: { name: string; email: string }) => void
}) {
  const { t } = useLanguage()
  const [pendingAction, setPendingAction] = useState<"credentials" | "google" | null>(null)
  const isPending = pendingAction !== null
  const [isIncomplete, setIsIncomplete] = useState(false)

  // `required` on the inputs is enough for the browser, but the submit handler
  // owns validation here, so an empty submit needs its own message.
  const message = error ?? (isIncomplete ? t("Fill in every field.", "সব ঘর পূরণ করুন।") : null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onError(null)
    setIsIncomplete(false)

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirm-password") ?? "")

    if (!name || !email) {
      setIsIncomplete(true)
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      onError(
        t(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
          `পাসওয়ার্ড অন্তত ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে।`
        )
      )
      return
    }

    if (password !== confirmPassword) {
      onError(t("Passwords do not match.", "পাসওয়ার্ড দুটি মিলছে না।"))
      return
    }

    setPendingAction("credentials")

    const res = await signUp.email({ name, email, password })

    if (res.error) {
      onError(
        res.error.message ||
          t("Something went wrong. Please try again.", "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।")
      )
      setPendingAction(null)
      return
    }

    onCreated({ name, email })
  }

  async function handleGoogleSignUp() {
    onError(null)
    setPendingAction("google")

    const res = await signIn.social({
      provider: "google",
      // Google creates the account itself, so landing back here resumes the
      // timeline on the role step rather than asking for a password again.
      callbackURL: "/sign-up",
      errorCallbackURL: "/sign-up",
    })

    if (res.error) {
      onError(
        res.error.message ||
          t("Google sign-up failed. Please try again.", "গুগল দিয়ে সাইন আপ হয়নি। আবার চেষ্টা করুন।")
      )
      setPendingAction(null)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{t("Create your account", "আপনার অ্যাকাউন্ট তৈরি করুন")}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t(
            "Start with the basics. You will pick your role in the next step.",
            "প্রথমে মৌলিক তথ্য দিন। পরের ধাপে ভূমিকা বেছে নেবেন।"
          )}
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!message}>
          <FieldLabel htmlFor="name">{t("Full name", "পূর্ণ নাম")}</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            aria-invalid={!!message}
            required
          />
        </Field>

        <Field data-invalid={!!message}>
          <FieldLabel htmlFor="email">{t("Email", "ইমেইল")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="m@example.com"
            aria-invalid={!!message}
            required
          />
          <FieldDescription>
            {t(
              "We will use this to contact you. We never share it with anyone else.",
              "যোগাযোগে এটি ব্যবহার করা হবে। অন্য কারও সাথে শেয়ার করা হবে না।"
            )}
          </FieldDescription>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!message}>
            <FieldLabel htmlFor="password">{t("Password", "পাসওয়ার্ড")}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!message}
              required
            />
          </Field>
          <Field data-invalid={!!message}>
            <FieldLabel htmlFor="confirm-password">{t("Confirm", "পুনরায় দিন")}</FieldLabel>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!message}
              required
            />
          </Field>
        </div>

        <FieldDescription>
          {t(
            `Must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
            `অন্তত ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে।`
          )}
        </FieldDescription>
      </FieldGroup>

      {message ? <FieldError>{message}</FieldError> : null}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {pendingAction === "credentials" ? (
          <Spinner className="size-4" data-icon="inline-start" />
        ) : null}
        {pendingAction === "credentials"
          ? t("Creating account...", "অ্যাকাউন্ট তৈরি হচ্ছে...")
          : t("Create account", "অ্যাকাউন্ট তৈরি করুন")}
      </Button>

      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
        {t("Or continue with", "অথবা চালিয়ে যান")}
      </FieldSeparator>

      <Button
        variant="outline"
        type="button"
        size="lg"
        className="w-full mt-5"
        onClick={handleGoogleSignUp}
        disabled={isPending}
      >
        {pendingAction === "google" ? (
          <Spinner className="size-4" data-icon="inline-start" />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {t("Continue with Google", "গুগল দিয়ে চালিয়ে যান")}
      </Button>

      <FieldDescription className="text-center">
        {t("Already have an account?", "অ্যাকাউন্ট আছে?")} <Link href="/sign-in">{t("Sign in", "সাইন ইন করুন")}</Link>
      </FieldDescription>
    </form>
  )
}