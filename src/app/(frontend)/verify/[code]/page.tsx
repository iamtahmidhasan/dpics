import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  Award,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  GraduationCap,
  MapPin,
  Printer,
  QrCode,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  UserCheck,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { VerificationService } from "@/lib/services/verification.service"
import { departmentLabel, semesterLabel, shiftLabel } from "@/lib/profile-labels"
import { makeT } from "@/lib/i18n"
import { getLang } from "@/lib/i18n-server"

import { getSession, isAdmin } from "@/lib/session"
import { AdminVerifyActions } from "@/components/verify/admin-verify-actions"

type Props = {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const decoded = decodeURIComponent(code)
  const result = await VerificationService.verifyCode(decoded)

  if (!result.isValid) {
    return {
      title: "Credential Verification | Not Found",
      description: "Credential verification record could not be found or is invalid.",
    }
  }

  return {
    title: `Verified: ${result.recipientName} - ${result.title} | DPI Computing Society`,
    description: `Official credential verification for ${result.recipientName}. Issued by Dhaka Polytechnic Institute Computing Society. Credential ID: ${result.code}.`,
    openGraph: {
      title: `Verified Credential: ${result.recipientName}`,
      description: `${result.title} • Issued by DPI Computing Society`,
    },
  }
}

export default async function VerifyCodePage({ params }: Props) {
  const { code } = await params
  const decoded = decodeURIComponent(code)
  const [lang, session, result] = await Promise.all([
    getLang(),
    getSession(),
    VerificationService.verifyCode(decoded),
  ])
  const t = makeT(lang)
  const isBn = lang === "bn"
  const isAdminUser = session?.user ? isAdmin(session.user) : false

  const formattedIssueDate = result.issuedAt
    ? new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(result.issuedAt))
    : "N/A"

  const formattedValidUntil = result.validUntil
    ? new Intl.DateTimeFormat(isBn ? "bn-BD" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(result.validUntil))
    : null

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 md:py-16 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/verify" />}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("Back to Verification Portal", "যাচাইকরণ পোর্টালে ফিরুন")}
        </Button>

        {result.isValid && (
          <Button
            variant="outline"
            size="sm"
            onClick={undefined}
            className="gap-1.5 text-xs print:hidden"
            nativeButton={true}
          >
            <Printer className="size-3.5" />
            {t("Print Record", "প্রিন্ট করুন")}
          </Button>
        )}
      </div>

      {result.isValid ? (
        /* Valid Credential Certificate */
        <Card className="overflow-hidden border-2 border-emerald-500/30 shadow-2xl bg-card text-card-foreground">
          {/* Top Verification Ribbon */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-95">
                  {t("Verified Authentic Credential", "যাচাইকৃত অফিসিয়াল সনদ")}
                </span>
              </div>
              <Badge className="bg-white/20 text-white font-semibold backdrop-blur-xs border-0 text-xs">
                {result.statusLabel}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-border/60 text-center sm:text-left">
              <Avatar className="size-16 sm:size-20 border-2 border-emerald-500/40 shadow-sm shrink-0">
                {result.recipientAvatar && <AvatarImage src={result.recipientAvatar} />}
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {result.recipientName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {result.credentialType === "EVENT_PASS"
                    ? t("Event Participant / Pass", "ইভেন্ট অংশগ্রহণকারী")
                    : result.credentialType === "MEMBER_ID"
                      ? t("Registered Society Member", "নিবন্ধিত সোসাইটি সদস্য")
                      : t("Certified Recipient", "সনদপ্রাপ্ত ব্যক্তি")}
                </span>
                <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground truncate">
                  {result.recipientName}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {result.studentId ? `${result.studentId} • ` : ""}
                  {result.department || result.institution || "Dhaka Polytechnic Institute"}
                </p>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Award className="size-3 text-primary" />
                  {t("Credential Title", "সনদের শিরোনাম")}
                </span>
                <p className="font-semibold text-xs sm:text-sm text-foreground">
                  {isBn && result.titleBn ? result.titleBn : result.title}
                </p>
              </div>

              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <QrCode className="size-3 text-primary" />
                  {t("Verification Identifier", "যাচাইকরণ কোড")}
                </span>
                <p className="font-mono font-bold text-xs sm:text-sm text-primary">
                  {result.code}
                </p>
              </div>

              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-primary" />
                  {t("Date of Issue", "ইস্যুর তারিখ")}
                </span>
                <p className="font-semibold text-xs sm:text-sm text-foreground">
                  {formattedIssueDate}
                </p>
              </div>

              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Building className="size-3 text-primary" />
                  {t("Issuing Authority", "প্রদানকারী কর্তৃপক্ষ")}
                </span>
                <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                  {result.issuer}
                </p>
              </div>
            </div>

            {/* Official Seal Banner */}
            <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">
                    {t("Official Digital Record", "অফিসিয়াল ডিজিটাল রেকর্ড")}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t(
                      "Matched against the official database registry of DPI Computing Society.",
                      "ডিপিআইসিএস ডাটাবেজ রেজিস্ট্রির সাথে সফলভাবে মিল পাওয়া গেছে।"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Management Toolbar */}
            {isAdminUser && Boolean(result.metadata?.registrationId) && (
              <AdminVerifyActions
                registrationId={String(result.metadata!.registrationId)}
                currentStatus={result.status || "CONFIRMED"}
                ticketCode={result.code}
              />
            )}

            {/* Public Link */}
            {result.detailsUrl && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={result.detailsUrl} />}
                  className="gap-2 text-xs"
                >
                  <ExternalLink className="size-3.5" />
                  {t("View Public Page", "পাবলিক পেজ দেখুন")}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/30 px-6 py-4 border-t border-border/50 text-center text-[11px] text-muted-foreground justify-center">
            {t(
              "Dhaka Polytechnic Institute Computing Society • Tejgaon, Dhaka-1208, Bangladesh",
              "ঢাকা পলিটেকনিক ইনস্টিটিউট কম্পিউটিং সোসাইটি • তেজগাঁও, ঢাকা-১২০৮"
            )}
          </CardFooter>
        </Card>
      ) : (
        /* Invalid Credential Record */
        <Card className="border-2 border-destructive/30 shadow-xl text-center p-8 space-y-4">
          <div className="mx-auto size-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="size-8 text-destructive" />
          </div>

          <div className="space-y-1">
            <Badge variant="destructive" className="text-xs uppercase">
              {t("Verification Failed", "যাচাইকরণ ব্যর্থ")}
            </Badge>
            <h2 className="font-heading text-xl font-bold text-foreground">
              {t("Credential Not Found or Invalid", "কোনো রেকর্ড পাওয়া যায়নি")}
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t(
                `No active credential record exists matching code "${decoded}". Please verify the code or scan the QR code again.`,
                `"${decoded}" কোডের সাথে কোনো বৈধ রেকর্ড খুঁজে পাওয়া যায়নি। কোডটি সঠিকভাবে যাচাই করুন।`
              )}
            </p>
          </div>

          <div className="pt-4">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/verify" />}
              className="gap-2 text-xs"
            >
              {t("Try Another Search", "অন্য কোড দিয়ে খুঁজুন")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
