"use client"

import type { VariantProps } from "class-variance-authority"
import Image from "next/image"
import { useMemo } from "react"

import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Role } from "@/generated/prisma/enums"
import { DetailRow } from "@/components/form-fields"
import {
  instructorStatusLabel,
  membershipStatusLabel,
} from "@/lib/profile-labels"
import { resolveCoverImage } from "@/lib/cover-images"
import type { AdminUserDetail } from "@/lib/services/admin-user.service"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant> = {
  [Role.SUPER_ADMIN]: "default",
  [Role.ADMIN]: "default",
  [Role.MEMBER]: "success",
  [Role.INSTRUCTOR]: "warning",
  [Role.USER]: "muted",
}

function VerificationBadge({ status }: { status: string | null }) {
  const variant: BadgeVariant =
    status === "VERIFIED" ? "success" : status === "REJECTED" ? "destructive" : "warning"

  return <Badge variant={status ? variant : "muted"}>{status ?? "—"}</Badge>
}

export function AdminUserOverview({
  user,
  isSelf,
  onManageCommittees,
}: {
  user: AdminUserDetail
  isSelf: boolean
  onManageCommittees?: () => void
}) {
  const { t, lang } = useLanguage()

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [lang]
  )

  const formatDate = (value: string | null) => (value ? dateFormatter.format(new Date(value)) : "—")

  const initials = (user.name || user.email || "?").trim().charAt(0).toUpperCase()

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            {t("Account", "অ্যাকাউন্ট")}
            {isSelf ? <Badge variant="outline">{t("This is you", "এটি আপনি")}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar className="size-14">
              {user.avatar && (
                <AvatarImage
                  keepMounted
                  render={<Image src={user.avatar} alt={user.name} width={56} height={56} unoptimized />}
                />
              )}
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant={ROLE_BADGE_VARIANT[role] ?? "muted"}>
                    {role}
                  </Badge>
                ))}
                <Badge variant={user.isActive ? "success" : "destructive"}>
                  {user.isActive ? t("Active", "সক্রিয়") : t("Inactive", "নিষ্ক্রিয়")}
                </Badge>
                <Badge variant={user.emailVerified ? "success" : "warning"}>
                  {user.emailVerified ? t("Email verified", "ইমেইল যাচাই") : t("Email unverified", "ইমেইল অযাচাই")}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow label={t("User id", "ব্যবহারকারী আইডি")} value={user.id} mono />
            <DetailRow label={t("Phone", "ফোন")} value={user.phone} />
            <DetailRow label={t("WhatsApp", "হোয়াটসঅ্যাপ")} value={user.whatsappNumber} />
            <DetailRow label={t("Blood group", "রক্তের গ্রুপ")} value={user.bloodGroup} />
            <DetailRow label={t("Address", "ঠিকানা")} value={user.address} />
            <DetailRow label={t("Pictures", "ছবি")} value={user.images.length} />
            <DetailRow label={t("Created", "তৈরি")} value={formatDate(user.createdAt)} />
            <DetailRow label={t("Last updated", "সর্বশেষ হালনাগাদ")} value={formatDate(user.updatedAt)} />
          </div>

          {user.bio ? (
            <div className="rounded-md border p-3 bg-muted/20">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                {t("Bio / About", "পরিচিতি")}
              </span>
              <p className="text-xs/relaxed text-foreground whitespace-pre-wrap">{user.bio}</p>
            </div>
          ) : null}

          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("Skills", "দক্ষতা")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {user.coverImg ? (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("Cover Image", "কভার ছবি")} (Index {user.coverImg})
              </span>
              <div className="relative h-20 w-full overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveCoverImage(user.coverImg)}
                  alt="Cover image"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}

          {user.images.length > 0 ? (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">{t("All pictures", "সব ছবি")}</span>
                <div className="flex flex-wrap gap-2">
                  {user.images.map((image, index) => (
                    <div key={image} className="flex flex-col gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={t("Picture", "ছবি")}
                        className="size-14 rounded-md border border-border object-cover"
                      />
                      {index === user.selectedImageIndex ? (
                        <Badge variant="success">{t("Avatar", "অ্যাভাটার")}</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("Membership", "সদস্যপদ")}</CardTitle>
          </CardHeader>
          <CardContent>
            {user.member ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label={t("Status", "অবস্থা")}
                  value={<Badge variant="outline">{membershipStatusLabel(t)(user.member.status)}</Badge>}
                />
                <DetailRow
                  label={t("Verification", "যাচাই")}
                  value={<VerificationBadge status={user.member.verificationStatus} />}
                />
                <DetailRow label={t("Student id", "শিক্ষা আইডি")} value={user.member.studentId} />
                <DetailRow label={t("Board / Class Roll", "বোর্ড / ক্লাস রোল")} value={user.member.boardOrClassRoll} />
                <DetailRow label={t("Department", "বিভাগ")} value={user.member.department} />
                <DetailRow label={t("Session", "সেশন")} value={user.member.session} />
                <DetailRow label={t("Semester", "সেমিস্টার")} value={user.member.semester} />
                <DetailRow label={t("Shift", "শিফট")} value={user.member.shift} />
                <DetailRow label={t("Fee paid", "ফি পরিশোধ")} value={user.member.hasPaidMembershipFee ? t("Yes", "হ্যাঁ") : t("No", "না")} />
                <DetailRow label={t("Payment method", "পেমেন্ট পদ্ধতি")} value={user.member.paymentMethod} />
                <DetailRow label={t("Sender number", "প্রেরক নম্বর")} value={user.member.senderNumber} />
                <DetailRow label={t("Transaction id", "ট্রানজেকশন আইডি")} value={user.member.transactionId} mono />
                <DetailRow label={t("Joined at", "যোগদানের তারিখ")} value={formatDate(user.member.joinedAt)} />
                <DetailRow label={t("Expires at", "মেয়াদ শেষ")} value={formatDate(user.member.expiresAt)} />
                <DetailRow label={t("Verified at", "যাচাইয়ের সময়")} value={formatDate(user.member.verifiedAt)} />
              </div>
            ) : (
              <p className="text-muted-foreground">{t("No membership record", "কোনো সদস্যপদ রেকর্ড নেই")}</p>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("Instructor", "শিক্ষক")}</CardTitle>
          </CardHeader>
          <CardContent>
            {user.instructor ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label={t("Status", "অবস্থা")}
                  value={<Badge variant="outline">{instructorStatusLabel(t)(user.instructor.status)}</Badge>}
                />
                <DetailRow label={t("Instructor id", "শিক্ষক আইডি")} value={user.instructor.instructorId} />
              </div>
            ) : (
              <p className="text-muted-foreground">{t("No instructor record", "কোনো শিক্ষক রেকর্ড নেই")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("Committee roles", "কমিটির ভূমিকা")}</CardTitle>
            {onManageCommittees && (
              <Button variant="outline" size="xs" onClick={onManageCommittees}>
                {t("Manage", "পরিচালনা")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {user.committeeRoles.length === 0 ? (
              <p className="text-muted-foreground">{t("No committee roles", "কোনো কমিটির ভূমিকা নেই")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {user.committeeRoles.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-col">
                      <span className="font-medium">{entry.roleName}</span>
                      <span className="text-muted-foreground">{entry.committeeName}</span>
                    </span>
                    <Badge variant={entry.isActive ? "success" : "muted"}>
                      {entry.isActive ? t("Active", "সক্রিয়") : t("Inactive", "নিষ্ক্রিয়")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("Security & logins", "নিরাপত্তা ও লগইন")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label={t("Connected accounts", "যুক্ত অ্যাকাউন্ট")} value={user.accounts.length} />
              <DetailRow label={t("Active sessions", "সক্রিয় সেশন")} value={user.sessions.total} />
              <DetailRow label={t("Last login", "শেষ লগইন")} value={formatDate(user.sessions.latestCreatedAt)} />
              <DetailRow label={t("Session expires", "সেশন মেয়াদ")} value={formatDate(user.sessions.latestExpiresAt)} />
              <DetailRow label={t("Last IP", "শেষ আইপি")} value={user.sessions.latestIpAddress} mono />
            </div>

            {user.accounts.length > 0 ? (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("Provider", "প্রোভাইডার")}</TableHead>
                      <TableHead>{t("Account id", "অ্যাকাউন্ট আইডি")}</TableHead>
                      <TableHead>{t("Linked", "যুক্ত")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.providerId}</TableCell>
                        <TableCell className="font-mono text-[0.6875rem] break-all">
                          {account.accountId}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(account.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {user.sessions.latestUserAgent ? (
              <p className="break-all text-muted-foreground">{user.sessions.latestUserAgent}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}