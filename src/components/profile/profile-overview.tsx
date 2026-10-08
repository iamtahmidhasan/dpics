"use client"

import type { VariantProps } from "class-variance-authority"
import { BadgeCheck, CalendarClock, CreditCard, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

import { useLanguage } from "@/components/language-provider"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Role } from "@/generated/prisma/enums"
import {
  instructorStatusLabel,
  membershipStatusLabel,
  paymentMethodLabel,
  verificationStatusLabel,
} from "@/lib/profile-labels"
import type {
  CommitteeRoleSummary,
  InstructorProfile,
  MemberProfile,
  Profile,
} from "@/lib/services/profile.service"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant> = {
  [Role.SUPER_ADMIN]: "default",
  [Role.ADMIN]: "default",
  [Role.MEMBER]: "success",
  [Role.INSTRUCTOR]: "warning",
  [Role.USER]: "muted",
}

function membershipBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success"
    case "PENDING":
      return "warning"
    case "SUSPENDED":
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      return "destructive"
    default:
      return "muted"
  }
}

function verificationBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "VERIFIED":
      return "success"
    case "PENDING":
      return "warning"
    default:
      return "destructive"
  }
}

function instructorBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success"
    case "PENDING":
      return "warning"
    case "SUSPENDED":
    case "REJECTED":
      return "destructive"
    default:
      return "muted"
  }
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—"

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value))
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  )
}

function AccountSection({ profile }: { profile: Profile }) {
  const { t, lang } = useLanguage()
  const locale = lang === "bn" ? "bn-BD" : "en-US"

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-muted-foreground" />
          {t("Account", "অ্যাকাউন্ট")}
        </CardTitle>
        <CardDescription>
          {t("Managed by the society, you cannot change these.", "সমিতি পরিচালিত, এগুলো পরিবর্তন করা যাবে না।")}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <DetailRow label={t("Roles", "ভূমিকা")}>
          <span className="flex flex-wrap justify-end gap-1">
            {profile.roles.map((role) => (
              <Badge key={role} variant={ROLE_BADGE_VARIANT[role] ?? "muted"}>
                {role}
              </Badge>
            ))}
          </span>
        </DetailRow>
        <DetailRow label={t("Account status", "অ্যাকাউন্ট অবস্থা")}>
          <Badge variant={profile.isActive ? "success" : "destructive"}>
            {profile.isActive ? t("Active", "সক্রিয়") : t("Inactive", "নিষ্ক্রিয়")}
          </Badge>
        </DetailRow>
        <DetailRow label={t("Email verified", "ইমেইল যাচাই")}>
          {profile.emailVerified ? (
            <span className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="size-3.5" />
              {t("Verified", "যাচাইকৃত")}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("Not verified", "যাচাই হয়নি")}</span>
          )}
        </DetailRow>
        {profile.whatsappNumber ? (
          <DetailRow label={t("WhatsApp", "হোয়াটসঅ্যাপ")}>
            <span>{profile.whatsappNumber}</span>
          </DetailRow>
        ) : null}
        {profile.bloodGroup ? (
          <DetailRow label={t("Blood group", "রক্তের গ্রুপ")}>
            <Badge variant="outline">{profile.bloodGroup}</Badge>
          </DetailRow>
        ) : null}
        {profile.address ? (
          <DetailRow label={t("Address", "ঠিকানা")}>
            <span>{profile.address}</span>
          </DetailRow>
        ) : null}
        {profile.skills && profile.skills.length > 0 ? (
          <DetailRow label={t("Skills", "দক্ষতা")}>
            <span className="flex flex-wrap justify-end gap-1">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </span>
          </DetailRow>
        ) : null}
        {profile.bio ? (
          <DetailRow label={t("Bio", "পরিচিতি")}>
            <span className="max-w-xs text-xs text-muted-foreground line-clamp-2">{profile.bio}</span>
          </DetailRow>
        ) : null}
        <DetailRow label={t("Joined", "যোগদান")}>
          <time dateTime={profile.createdAt}>
            {formatDate(profile.createdAt, locale)}
          </time>
        </DetailRow>
      </CardContent>
    </Card>
  )
}

function MembershipSection({ member }: { member: MemberProfile }) {
  const { t, lang } = useLanguage()
  const locale = lang === "bn" ? "bn-BD" : "en-US"
  const tMembership = membershipStatusLabel(t)
  const tVerification = verificationStatusLabel(t)
  const tPayment = paymentMethodLabel(t)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BadgeCheck className="size-3.5 text-muted-foreground" />
          {t("Membership record", "সদস্যপদ রেকর্ড")}
        </CardTitle>
        <CardDescription>
          {t("Approved by an administrator.", "একজন প্রশাসক অনুমোদন করেছেন।")}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <DetailRow label={t("Membership status", "সদস্যপদ অবস্থা")}>
          <Badge variant={membershipBadgeVariant(member.status)}>
            {tMembership(member.status)}
          </Badge>
        </DetailRow>
        {member.boardOrClassRoll ? (
          <DetailRow label={t("Board or Class Roll", "বোর্ড বা ক্লাস রোল")}>
            <span>{member.boardOrClassRoll}</span>
          </DetailRow>
        ) : null}
        <DetailRow label={t("Verification", "যাচাই")}>
          <span className="flex items-center justify-end gap-2">
            {member.verifiedAt && (
              <span className="text-muted-foreground">
                {formatDate(member.verifiedAt, locale)}
              </span>
            )}
            <Badge variant={verificationBadgeVariant(member.verificationStatus)}>
              {tVerification(member.verificationStatus)}
            </Badge>
          </span>
        </DetailRow>
        <DetailRow label={t("Membership fee", "সদস্য ফি")}>
          <Badge variant={member.hasPaidMembershipFee ? "success" : "warning"}>
            {member.hasPaidMembershipFee ? t("Paid", "পরিশোধিত") : t("Unpaid", "অপরিশোধিত")}
          </Badge>
        </DetailRow>
        <DetailRow label={t("Payment method", "পেমেন্ট পদ্ধতি")}>
          {member.paymentMethod ? tPayment(member.paymentMethod) : "—"}
        </DetailRow>
        <DetailRow label={t("Transaction id", "ট্রানজেকশন আইডি")}>
          {member.transactionId ?? "—"}
        </DetailRow>
        <DetailRow label={t("Sender number", "প্রেরক নম্বর")}>
          {member.senderNumber ?? "—"}
        </DetailRow>
        <DetailRow label={t("Membership period", "সদস্যপদের মেয়াদ")}>
          <span className="flex items-center justify-end gap-1.5 tabular-nums">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            {formatDate(member.joinedAt, locale)} — {formatDate(member.expiresAt, locale)}
          </span>
        </DetailRow>
      </CardContent>
    </Card>
  )
}

function InstructorSection({ instructor }: { instructor: InstructorProfile }) {
  const { t } = useLanguage()
  const tStatus = instructorStatusLabel(t)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <CreditCard className="size-3.5 text-muted-foreground" />
          {t("Instructor record", "ইনস্ট্রাক্টর রেকর্ড")}
        </CardTitle>
        <CardDescription>
          {t("Approved by an administrator.", "একজন প্রশাসক অনুমোদন করেছেন।")}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <DetailRow label={t("Instructor status", "ইনস্ট্রাক্টর অবস্থা")}>
          <Badge variant={instructorBadgeVariant(instructor.status)}>
            {tStatus(instructor.status)}
          </Badge>
        </DetailRow>
        {instructor.instructorId ? (
          <DetailRow label={t("Instructor ID", "শিক্ষক আইডি")}>
            <span className="font-mono">{instructor.instructorId}</span>
          </DetailRow>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CommitteeSection({ roles }: { roles: CommitteeRoleSummary[] }) {
  const { t, lang } = useLanguage()
  const locale = lang === "bn" ? "bn-BD" : "en-US"

  if (roles.length === 0) return null

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("Committees", "কমিটি")}</CardTitle>
        <CardDescription>
          {t("Positions you were assigned to.", "আপনাকে যে দায়িত্ব দেওয়া হয়েছে।")}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        {roles.map((entry) => (
          <DetailRow key={entry.id} label={entry.committeeName}>
            <span className="flex flex-wrap items-center justify-end gap-1.5">
              <Badge variant="outline">{entry.roleName}</Badge>
              {!entry.isActive && <Badge variant="muted">{t("Ended", "শেষ")}</Badge>}
              <span className="text-muted-foreground tabular-nums">
                {formatDate(entry.startDate, locale)} — {formatDate(entry.endDate, locale)}
              </span>
            </span>
          </DetailRow>
        ))}
      </CardContent>
    </Card>
  )
}

export function ProfileOverview({ profile }: { profile: Profile }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-3">
      <AccountSection profile={profile} />
      {profile.member ? <MembershipSection member={profile.member} /> : null}
      {profile.instructor ? <InstructorSection instructor={profile.instructor} /> : null}
      <CommitteeSection roles={profile.committeeRoles} />
      {!profile.member && !profile.instructor ? (
        <Card size="sm">
          <CardContent className="py-6 text-center text-muted-foreground">
            {t(
              "You do not have a membership or instructor record yet.",
              "আপনার এখনো কোনো সদস্যপদ বা ইনস্ট্রাক্টর রেকর্ড নেই।"
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
