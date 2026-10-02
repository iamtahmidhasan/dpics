"use client"

import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { DetailsStep, type OnboardingDetails } from "@/components/signup/details-step"
import { ProfileStep, type UserDetails, type UserSeed } from "@/components/signup/profile-step"
import { RoleStep } from "@/components/signup/role-step"
import { LAST_STEP, SIGNUP_STEPS, stepLabel } from "@/components/signup/signup-steps"
import { Card, CardContent } from "@/components/ui/card"
import { FieldDescription } from "@/components/ui/field"
import type { SelfAssignableRole } from "@/lib/roles"
import { cn } from "cn"

const EASE = [0.25, 0.1, 0.25, 1] as const

/** Panels slide along the timeline rather than cross fading in place. */
const panelVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
}

type StepState = "done" | "current" | "todo"

/**
 * Which stepper nodes act as jump targets.
 * Visited steps can be revisited. Forward jump is allowed straight to details
 * once a role has been picked.
 */
function canJumpTo(
  index: number,
  step: number,
  furthest: number,
  role: SelfAssignableRole | null
): boolean {
  if (index === step) return false

  if (index <= furthest) return true

  return index === LAST_STEP && index === furthest + 1 && role !== null
}

function StepNode({ index, state }: { index: number; state: StepState }) {
  return (
    <motion.span
      animate={{ scale: state === "current" ? 1 : 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs/relaxed font-medium transition-colors",
        state === "done" && "border-primary bg-primary text-primary-foreground",
        state === "current" && "border-primary bg-background text-primary ring-2 ring-primary/25",
        state === "todo" && "border-border bg-background text-muted-foreground"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state === "done" ? "done" : "number"}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE }}
          className="flex items-center"
        >
          {state === "done" ? <Check className="size-3.5" /> : index + 1}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

function StepLabel({ state, children }: { state: StepState; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "text-center text-[0.625rem]/tight font-medium transition-colors",
        state === "todo" ? "text-muted-foreground" : "text-foreground"
      )}
    >
      {children}
    </span>
  )
}

export type { SignupStudentIdPolicy } from "@/components/signup/details-step"
import type { SignupStudentIdPolicy } from "@/components/signup/details-step"

export type SignupPolicy = {
  isSignupEnabled: boolean
  isMemberSignupEnabled: boolean
  isInstructorSignupEnabled: boolean
  availableRoles: readonly SelfAssignableRole[]
  payment: {
    isRegistrationFeeRequired: boolean
    fee: number
    bkashPersonalNumber: string | null
    bkashAgentNumber: string | null
    nagadPersonalNumber: string | null
    nagadAgentNumber: string | null
    rocketPersonalNumber: string | null
    rocketAgentNumber: string | null
  }
  studentId?: SignupStudentIdPolicy | null
}

const EMPTY_SEED: UserSeed = { name: "", email: "", phone: "" }

export function SignupWizard({
  startStep = 0,
  initialUser,
  signupPolicy,
}: {
  startStep?: number
  initialUser?: UserSeed | null
  signupPolicy?: SignupPolicy | null
}) {
  const router = useRouter()
  const { t } = useLanguage()

  const [step, setStep] = useState(startStep)
  // The furthest step reached, which is what makes a node a jump target: steps
  // past this one still have to be submitted rather than skipped.
  const [furthest, setFurthest] = useState(startStep)
  const [direction, setDirection] = useState(1)
  const [seed, setSeed] = useState<UserSeed>(initialUser ?? EMPTY_SEED)
  const [user, setUser] = useState<UserDetails | null>(null)
  const [role, setRole] = useState<SelfAssignableRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  function goTo(next: number) {
    const target = Math.min(Math.max(next, 0), LAST_STEP)

    setDirection(target > step ? 1 : -1)
    setError(null)
    setStep(target)
    setFurthest((current) => Math.max(current, target))
  }

  function handleProfileContinued(details: UserDetails) {
    setUser(details)
    goTo(1)
  }

  async function handleComplete(details: OnboardingDetails) {
    if (!role || !user) return

    setIsPending(true)

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, user, ...details }),
      })
      const body = await response.json()

      if (!response.ok) throw new Error(body?.error?.message)

      setIsPending(false)
      router.push("/dashboard")
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : t("Something went wrong. Please try again.", "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।")
      )
      setIsPending(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="flex flex-col gap-6"
      >
        <nav aria-label={t("Sign up progress", "সাইন আপ অগ্রগতি")}>
          <ol className="flex items-start">
            {SIGNUP_STEPS.map((value, index) => {
              const state: StepState =
                index < step ? "done" : index === step ? "current" : "todo"
              const isJumpTarget = canJumpTo(index, step, furthest, role)
              const label = t(stepLabel(value, role))

              return (
                <li key={value} className="flex flex-1 items-start last:flex-none">
                  {isJumpTarget ? (
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={t(`Go to ${label}`, `${label}-এ যান`)}
                      className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-md px-1 py-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <StepNode index={index} state={state} />
                      <StepLabel state={state}>{label}</StepLabel>
                    </button>
                  ) : (
                    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 px-1 py-1">
                      <StepNode index={index} state={state} />
                      <StepLabel state={state}>{label}</StepLabel>
                    </div>
                  )}

                  {index < LAST_STEP ? (
                    <span className="relative mt-3.5 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                      <motion.span
                        className="absolute inset-0 origin-left rounded-full bg-primary"
                        initial={false}
                        animate={{ scaleX: index < step ? 1 : 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      />
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>

        <Card className="overflow-hidden p-0">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: EASE }}
              >
                {step === 0 ? (
                  // Remounting on the seed change keeps the fields in step with
                  // whichever account path got the wizard here.
                  <ProfileStep
                    key={seed.email}
                    seed={seed}
                    error={error}
                    onError={setError}
                    onContinue={handleProfileContinued}
                  />
                ) : null}

                {step === 1 ? (
                  <RoleStep
                    role={role}
                    availableRoles={signupPolicy?.availableRoles}
                    onSelect={setRole}
                    onContinue={() => role && goTo(2)}
                  />
                ) : null}

                {step === 2 && role ? (
                  <DetailsStep
                    // Remounting on role change resets the form fields.
                    key={role}
                    role={role}
                    payment={signupPolicy?.payment}
                    studentIdPolicy={signupPolicy?.studentId}
                    error={error}
                    isPending={isPending}
                    onError={setError}
                    onBack={() => goTo(1)}
                    onComplete={handleComplete}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <FieldDescription className="px-6 text-center">
          {t("By clicking continue, you agree to our", "চালিয়ে গেলে আপনি আমাদের")}{" "}
          <Link href="/">{t("Terms of Service", "পরিষেবার শর্তাবলিতে")}</Link>{" "}
          {t("and", "এবং")} <Link href="/">{t("Privacy Policy", "গোপনীয়তা নীতিতে")}</Link>{" "}
          {t("agree.", "সম্মতি জানান।")}
        </FieldDescription>
      </motion.div>
    </MotionConfig>
  )
}