"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"

import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Role } from "@/generated/prisma/enums"
import { signIn, signOut } from "@/lib/auth-client"

interface AcceptInviteCardProps {
  invitation: {
    id: string
    email: string
    name: string | null
    role: Role
    status: string
    invitedByName: string | null
    expiresAt: Date | string
    customMessage: string | null
    token?: string
  }
  sessionUser: {
    id: string
    name: string
    email: string
    image?: string[] | string | null
    roles?: unknown
  } | null
  token: string
}

function roleLabel(role: Role): string {
  switch (role) {
    case Role.SUPER_ADMIN:
      return "Super Administrator"
    case Role.ADMIN:
      return "Administrator"
    case Role.INSTRUCTOR:
      return "Instructor"
    case Role.MEMBER:
      return "Society Member"
    case Role.USER:
    default:
      return "Member"
  }
}

export function AcceptInviteCard({
  invitation,
  sessionUser,
  token,
}: AcceptInviteCardProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [isAccepting, setIsAccepting] = useState(false)
  const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isMatchingEmail =
    sessionUser &&
    sessionUser.email.trim().toLowerCase() === invitation.email.trim().toLowerCase()

  const expiryDate = new Date(invitation.expiresAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  async function handleOAuthSignIn(provider: "google" | "github") {
    setErrorMessage(null)
    setOauthPending(provider)

    try {
      await signIn.social({
        provider,
        callbackURL: `/invite/${token}`,
        errorCallbackURL: `/invite/${token}`,
      })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Sign-in failed")
      setOauthPending(null)
    }
  }

  async function handleAccept() {
    setIsAccepting(true)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Failed to accept invitation")
      }

      toast.success(
        t(
          `Welcome aboard! You now have ${roleLabel(invitation.role)} access.`,
          `স্বাগতম! আপনি এখন ${roleLabel(invitation.role)} সুবিধা উপভোগ করতে পারবেন।`
        )
      )

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error accepting invitation")
      setIsAccepting(false)
    }
  }

  async function handleSwitchAccount() {
    setIsSigningOut(true)
    try {
      await signOut()
      router.refresh()
    } catch {
      toast.error(t("Failed to sign out", "সাইন আউট করতে ব্যর্থ হয়েছে"))
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Card className="w-full max-w-lg border-border/80 shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-7" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
          {t("You're Invited!", "আপনাকে আমন্ত্রণ জানানো হয়েছে!")}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t(
            `You have been invited by ${invitation.invitedByName || "an Administrator"} to join DPI Computing Society as a ${roleLabel(
              invitation.role
            )}.`,
            `আপনাকে ${invitation.invitedByName || "অ্যাডমিনের"} পক্ষ থেকে DPI Computing Society-তে ${roleLabel(
              invitation.role
            )} হিসেবে যোগদানের আমন্ত্রণ জানানো হয়েছে।`
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs/relaxed text-destructive"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Custom Personal Note if included */}
        {invitation.customMessage && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs/relaxed italic text-foreground/90">
            &ldquo;{invitation.customMessage}&rdquo;
          </div>
        )}

        {/* Invitation Metadata Details */}
        <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("Assigned Role", "নির্ধারিত পদবি")}:</span>
            <Badge variant="default">{roleLabel(invitation.role)}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("Authorized Email", "অনুমোদিত ইমেইল")}:</span>
            <span className="font-mono font-medium text-foreground">{invitation.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("Valid Until", "মেয়াদ শেষ")}:</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3" />
              <span>{expiryDate}</span>
            </span>
          </div>
        </div>

        {/* Action Section based on Auth State */}
        {!sessionUser ? (
          <div className="space-y-3 pt-2">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <p>
                {t(
                  `Please sign in using the Google or GitHub account associated with ${invitation.email} to claim this invitation.`,
                  `এই আমন্ত্রণটি গ্রহণ করতে অনুগ্রহ করে ${invitation.email}-এর সাথে সম্পর্কিত গুগল বা গিটহাব অ্যাকাউন্ট দিয়ে সাইন ইন করুন।`
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                variant="outline"
                type="button"
                className="w-full h-10 gap-2.5"
                onClick={() => handleOAuthSignIn("google")}
                disabled={oauthPending !== null}
              >
                {oauthPending === "google" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
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
                <span>{t("Continue with Google", "গুগল দিয়ে সাইন ইন করুন")}</span>
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full h-10 gap-2.5"
                onClick={() => handleOAuthSignIn("github")}
                disabled={oauthPending !== null}
              >
                {oauthPending === "github" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="size-4.5 fill-current" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                )}
                <span>{t("Continue with GitHub", "গিটহাব দিয়ে সাইন ইন করুন")}</span>
              </Button>
            </div>
          </div>
        ) : isMatchingEmail ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <UserCheck className="size-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-foreground">
                  {t("Authenticated as", "লগইন অবস্থায় আছেন")}: {sessionUser.name}
                </p>
                <p className="text-muted-foreground">{sessionUser.email}</p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full gap-2 text-sm font-semibold h-11"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("Activating Account...", "অ্যাকাউন্ট সক্রিয় হচ্ছে...")}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4.5" />
                  <span>{t("Accept Invitation & Activate Access", "আমন্ত্রণ গ্রহণ করুন ও সুবিধা সক্রিয় করুন")}</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs/relaxed text-destructive space-y-1">
              <p className="font-semibold">{t("Account Email Mismatch", "ইমেইল মেলেনি")}</p>
              <p>
                {t(
                  `You are currently signed in as ${sessionUser.email}, but this invitation was issued strictly for ${invitation.email}.`,
                  `আপনি বর্তমানে ${sessionUser.email} দিয়ে সাইন ইন আছেন, তবে এই আমন্ত্রণটি শুধুমাত্র ${invitation.email}-এর জন্য বরাদ্দ করা হয়েছে।`
                )}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleSwitchAccount}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              <span>{t("Sign in with another account", "অন্য অ্যাকাউন্ট দিয়ে সাইন ইন করুন")}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
