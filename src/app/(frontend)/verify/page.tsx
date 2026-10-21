"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Award,
  Calendar,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  UserCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

export default function VerificationPortalPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [code, setCode] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    // Extract code if user pasted a full URL
    const trimmed = code.trim()
    const match = trimmed.match(/(?:verify|tickets?|cert|u)\/([A-Za-z0-9_-]+)/i)
    const finalCode = match ? match[1] : trimmed
    router.push(`/verify/${encodeURIComponent(finalCode)}`)
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 md:py-16 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1"
        >
          <ShieldCheck className="size-3.5" />
          {t({ en: "Official Verification System", bn: "অফিসিয়াল যাচাইকরণ পোর্টাল" })}
        </Badge>

        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t({
            en: "Verify DPICS Credentials & Passes",
            bn: "ডিপিআইসিএস সনদপত্র ও পাস যাচাই করুন",
          })}
        </h1>

        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t({
            en: "Authenticate official student membership cards, event entry passes, and course certificates issued by Dhaka Polytechnic Institute Computing Society.",
            bn: "ঢাকা পলিটেকনিক ইনস্টিটিউট কম্পিউটিং সোসাইটি কর্তৃক ইস্যুকৃত অফিসিয়াল সদস্য কার্ড, ইভেন্ট এন্ট্রি পাস ও সার্টিফিকেট যাচাই করুন।",
          })}
        </p>
      </div>

      {/* Universal Search Card */}
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden bg-card/60 backdrop-blur-xs">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-blue-500" />
        <CardContent className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={t({
                    en: "Enter Ticket Code, Student ID, or Certificate Number...",
                    bn: "টিকেট কোড, স্টুডেন্ট আইডি বা সার্টিফিকেট নম্বর লিখুন...",
                  })}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-10 h-12 text-sm sm:text-base font-mono bg-background"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 font-semibold gap-2 shadow-xs shrink-0"
                disabled={!code.trim()}
              >
                <ShieldCheck className="size-4" />
                {t({ en: "Verify Credential", bn: "যাচাই করুন" })}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t({
                en: "Format examples: TKT-2026-8941 • DPICS-26-0012 • CERT-2026-0812 or paste the QR code URL directly.",
                bn: "উদাহরণ: TKT-2026-8941 • DPICS-26-0012 • CERT-2026-0812 অথবা সম্পূর্ণ কিউআর লিংক পেস্ট করুন।",
              })}
            </p>
          </form>

          {/* Quick Category Badges */}
          <div className="pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <Ticket className="size-5 text-purple-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">
                  {t({ en: "Event Entry Passes", bn: "ইভেন্ট এন্ট্রি পাস" })}
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {t({ en: "Validate registration authenticity", bn: "নিবন্ধন ও টিকেটের বৈধতা যাচাই" })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <UserCheck className="size-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">
                  {t({ en: "Membership Cards", bn: "সদস্যপদ কার্ড" })}
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {t({ en: "Confirm active society membership", bn: "সক্রিয় সদস্যের স্ট্যাটাস নিশ্চিত করুন" })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <Award className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">
                  {t({ en: "Certificates & Awards", bn: "সনদপত্র ও সম্মাননা" })}
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {t({ en: "Verify course & bootcamp completion", bn: "কোর্স সমাপ্তির সত্যতা যাচাই" })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Verification Standards */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 sm:p-8 space-y-4">
        <h3 className="font-heading font-bold text-base flex items-center gap-2 text-foreground">
          <Shield className="size-4 text-emerald-500" />
          {t({
            en: "Cryptographic Tamper-Evident Verification",
            bn: "নিরাপদ ও নির্ভরযোগ্য যাচাইকরণ পদ্ধতি",
          })}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {t({
            en: "Every credential issued by DPI Computing Society incorporates a unique cryptographic identifier registered directly on our secure database. Recruiters, partner institutions, and event organizers can independently verify credentials without contacting society leadership.",
            bn: "ডিপিআই কম্পিউটিং সোসাইটি কর্তৃক প্রদত্ত প্রতিটি সনদপত্রে একটি ইউনিক আইডেন্টিফায়ার যুক্ত থাকে। নিয়োগকর্তা, পার্টনার প্রতিষ্ঠান ও আয়োজকগণ সরাসরি এই পোর্টালে এসে যেকোনো সনদপত্রের সত্যতা যাচাই করতে পারবেন।",
          })}
        </p>
      </div>
    </div>
  )
}
