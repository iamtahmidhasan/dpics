import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, Home, XCircle } from "lucide-react"

import { AcceptInviteCard } from "@/components/invite/accept-invite-card"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvitationStatus } from "@/generated/prisma/enums"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"
import { InvitationService } from "@/lib/services/invitation.service"
import { getSession } from "@/lib/session"
import { NOINDEX } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Invitation | DPI Computing Society",
  description: "Accept your invitation to join DPI Computing Society",
  robots: NOINDEX,
}

export default async function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [invitation, session, lang] = await Promise.all([
    InvitationService.getInvitationByToken(token),
    getSession(),
    getLang(),
  ])

  const t = makeT(lang)

  if (!invitation) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-lg font-bold">
              {t("Invalid Invitation Link", "অকার্যকর আমন্ত্রণ লিংক")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "This invitation link does not exist, has already been removed, or was copied incorrectly.",
                "এই আমন্ত্রণ লিংকটির কোনো অস্তিত্ব নেই, ইতিমধ্যে মুছে ফেলা হয়েছে অথবা ভুলভাবে কপি করা হয়েছে।"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 flex justify-center">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <Home className="size-4 mr-2" />
              <span>{t("Back to Home", "হোমে ফিরুন")}</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status === InvitationStatus.EXPIRED) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-500/10 text-muted-foreground">
            <Clock className="size-6" />
          </div>
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-lg font-bold">
              {t("Invitation Expired", "আমন্ত্রণের মেয়াদ শেষ হয়েছে")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                `This invitation for ${invitation.email} has expired. Please contact an administrator to request a renewed invitation link.`,
                `${invitation.email}-এর জন্য পাঠানো এই আমন্ত্রণটির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন আমন্ত্রণের জন্য প্রশাসকের সাথে যোগাযোগ করুন।`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 flex justify-center gap-2">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <span>{t("Back to Home", "হোমে ফিরুন")}</span>
            </Link>
            <Link href="/contact" className={buttonVariants({ variant: "default" })}>
              <span>{t("Contact Us", "যোগাযোগ করুন")}</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-6" />
          </div>
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-lg font-bold">
              {t("Invitation Revoked", "আমন্ত্রণ বাতিল করা হয়েছে")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "This invitation has been cancelled or revoked by the administrator.",
                "এই আমন্ত্রণটি প্রশাসক কর্তৃক বাতিল করা হয়েছে।"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 flex justify-center">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <span>{t("Back to Home", "হোমে ফিরুন")}</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-6" />
          </div>
          <CardHeader className="p-0 space-y-1">
            <CardTitle className="text-lg font-bold">
              {t("Invitation Already Accepted", "আমন্ত্রণ ইতিমধ্যে গৃহীত হয়েছে")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t(
                "This invitation has already been accepted and claimed.",
                "এই আমন্ত্রণটি ইতিমধ্যে গ্রহণ করা হয়েছে।"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 flex justify-center gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "default" })}>
              <span>{t("Go to Dashboard", "ড্যাশবোর্ডে যান")}</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <AcceptInviteCard
        invitation={invitation}
        sessionUser={session?.user ?? null}
        token={token}
      />
    </div>
  )
}
