"use client"

import { Info } from "lucide-react"

import { TextField } from "@/components/form-fields"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ToggleRow } from "./toggle-row"
import { AdminSettingsSaveCard } from "./admin-settings-save-card"
import { useAdminSettings } from "./admin-settings-context"

const MAX_FEE = 999_999

export function AdminPaymentsTab() {
  const { t } = useLanguage()
  const {
    isRegistrationFeeRequired,
    setIsRegistrationFeeRequired,
    registrationFee,
    setRegistrationFee,
    bkashPersonalNumber,
    setBkashPersonalNumber,
    bkashAgentNumber,
    setBkashAgentNumber,
    nagadPersonalNumber,
    setNagadPersonalNumber,
    nagadAgentNumber,
    setNagadAgentNumber,
    rocketPersonalNumber,
    setRocketPersonalNumber,
    rocketAgentNumber,
    setRocketAgentNumber,
  } = useAdminSettings()

  return (
    <div className="space-y-4">
      {/* Reuse explanation banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs flex items-start gap-2.5">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground">
            {t("Unified Reusable Payment System", "একীভূত পুনঃব্যবহারযোগ্য পেমেন্ট ব্যবস্থা")}
          </span>
          <p className="text-muted-foreground leading-relaxed">
            {t(
              "The payment methods and recipient numbers configured below are automatically shared and reused across both the Member Registration Form (for initial fee payments) and the Courses Platform (for course enrollments and payment checkouts).",
              "নিচে নির্ধারিত পেমেন্ট মাধ্যম এবং প্রাপক নম্বরগুলো স্বয়ংক্রিয়ভাবে সদস্য নিবন্ধন ফর্ম (ফি প্রদান) এবং কোর্স প্ল্যাটফর্ম (কোর্স ভর্তি ও পেমেন্ট চেকআউট) উভয় স্থানে ব্যবহৃত হবে।"
            )}
          </p>
        </div>
      </div>

      {/* Member registration fee settings */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Member Registration Fee", "সদস্য নিবন্ধন ফি")}</CardTitle>
          <CardDescription>
            {t(
              "Configure registration fee requirements for student members. (Instructors register for free).",
              "শিক্ষার্থী সদস্যদের জন্য নিবন্ধন ফি নির্ধারণ করুন। (শিক্ষকদের নিবন্ধন বিনামূল্যে)।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup className="space-y-3">
            <ToggleRow
              id="is-fee-required"
              label={t("Require registration fee", "নিবন্ধন ফি আবশ্যক")}
              description={t(
                "When turned on, members must pay the registration fee before membership verification.",
                "চালু থাকলে সদস্যদের যাচাইকরণের আগে নিবন্ধন ফি প্রদান করতে হবে।"
              )}
              checked={isRegistrationFeeRequired}
              onChange={setIsRegistrationFeeRequired}
            />

            <Field>
              <FieldLabel htmlFor="registration-fee">
                {t("Registration fee (৳ / Taka)", "নিবন্ধন ফি (৳ / টাকা)")}
              </FieldLabel>
              <Input
                id="registration-fee"
                name="registrationFee"
                type="number"
                min={0}
                max={MAX_FEE}
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
                placeholder="0"
                className="max-w-xs"
              />
              <FieldDescription>
                {t(
                  "The fee amount in whole Bangladeshi Taka (whole numbers only).",
                  "পূর্ণসংখ্যায় বাংলাদেশি টাকায় ফি-এর পরিমাণ।"
                )}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Shared Recipient Account Numbers */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("Payment Recipient Numbers (MFS)", "পেমেন্ট প্রাপক নম্বর (এমএফএস)")}</CardTitle>
          <CardDescription>
            {t(
              "Provide the society official account numbers shown to applicants on member registration and students on course enrollment checkouts.",
              "সদস্য নিবন্ধন ও কোর্স ভর্তি চেকআউটে শিক্ষার্থীদের দেখানো সমিতির অফিসিয়াল অ্যাকাউন্ট নম্বর প্রদান করুন।"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* bKash */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("bKash", "বিকাশ")}
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                {t("Personal & Agent", "পার্সোনাল ও এজেন্ট")}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                id="bkash-personal"
                label={t("bKash Personal Number", "বিকাশ পার্সোনাল নম্বর")}
                value={bkashPersonalNumber}
                onChange={setBkashPersonalNumber}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
              <TextField
                id="bkash-agent"
                label={t("bKash Agent Number", "বিকাশ এজেন্ট নম্বর")}
                value={bkashAgentNumber}
                onChange={setBkashAgentNumber}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Nagad */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("Nagad", "নগদ")}
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                {t("Personal & Agent", "পার্সোনাল ও এজেন্ট")}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                id="nagad-personal"
                label={t("Nagad Personal Number", "নগদ পার্সোনাল নম্বর")}
                value={nagadPersonalNumber}
                onChange={setNagadPersonalNumber}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
              <TextField
                id="nagad-agent"
                label={t("Nagad Agent Number", "নগদ এজেন্ট নম্বর")}
                value={nagadAgentNumber}
                onChange={setNagadAgentNumber}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Rocket */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("Rocket", "রকেট")}
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                {t("Personal & Agent", "পার্সোনাল ও এজেন্ট")}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                id="rocket-personal"
                label={t("Rocket Personal Number", "রকেট পার্সোনাল নম্বর")}
                value={rocketPersonalNumber}
                onChange={setRocketPersonalNumber}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
              <TextField
                id="rocket-agent"
                label={t("Rocket Agent Number", "রকেট এজেন্ট নম্বর")}
                value={rocketAgentNumber}
                onChange={setRocketAgentNumber}
                placeholder="01XXXXXXXXX"
                type="tel"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminSettingsSaveCard />
    </div>
  )
}
