"use client"

import type { VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useAdminUsers } from "@/components/admin/use-admin-users"
import { useLanguage } from "@/components/language-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Role } from "@/generated/prisma/enums"
import type { UserListResult } from "@/lib/services/user.service"

const SEARCH_DEBOUNCE_MS = 300

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant> = {
  [Role.ADMIN]: "default",
  [Role.MEMBER]: "success",
  [Role.INSTRUCTOR]: "warning",
  [Role.USER]: "muted",
}

function roleBadgeVariant(role: Role): BadgeVariant {
  return ROLE_BADGE_VARIANT[role] ?? "muted"
}

function memberStatusBadgeVariant(status: string | null): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success" as const
    case "PENDING":
      return "warning" as const
    case "SUSPENDED":
    case "REJECTED":
    case "CANCELLED":
    case "EXPIRED":
      return "destructive" as const
    default:
      return "muted" as const
  }
}

function UserAvatar({ src, name }: { src: string | null; name: string }) {
  const initials = (name || "?").trim().charAt(0).toUpperCase()

  return (
    <Avatar className="size-8">
      {src && (
        <AvatarImage
          keepMounted
          render={<Image src={src} alt={name} width={32} height={32} unoptimized />}
        />
      )}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

export function UsersTable({ initialData }: { initialData: UserListResult }) {
  const { t, lang } = useLanguage()
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<Role | "">("")
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data, isLoading, error } = useAdminUsers(
    { page, search, role, refreshKey },
    initialData
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
        dateStyle: "medium",
      }),
    [lang]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput])

  const hasPrev = data.page > 1
  const hasNext = data.page < data.totalPages

  return (
    <Card size="sm" className="gap-3">
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-64 sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("Search name, email or phone", "নাম, ইমেইল বা ফোন খুঁজুন")}
              aria-label={t("Search users", "ব্যবহারকারী খুঁজুন")}
              className="pl-7"
            />
          </div>

          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | "")
              setPage(1)
            }}
            aria-label={t("Filter by role", "ভূমিকা দিয়ে ফিল্টার করুন")}
            className="h-7 rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          >
            <option value="">{t("All roles", "সব ভূমিকা")}</option>
            {Object.values(Role).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={isLoading}
            aria-label={t("Refresh", "রিফ্রেশ")}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-xs/relaxed text-destructive">
            {error}
          </p>
        )}

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("Image", "ছবি")}</TableHead>
                <TableHead>{t("User", "ব্যবহারকারী")}</TableHead>
                <TableHead>{t("Phone", "ফোন")}</TableHead>
                <TableHead>{t("Roles", "ভূমিকা")}</TableHead>
                <TableHead>{t("Membership", "সদস্যপদ")}</TableHead>
                <TableHead>{t("Status", "অবস্থা")}</TableHead>
                <TableHead>{t("Joined", "যোগদান")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isLoading ? "opacity-60" : undefined}>
              {data.users.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    {t("No users found", "কোনো ব্যবহারকারী পাওয়া যায়নি")}
                  </TableCell>
                </TableRow>
              ) : (
                data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar src={user.avatar} name={user.name} />
                        {user.imageCount > 1 && (
                          <span className="text-[0.625rem] tabular-nums text-muted-foreground">
                            {(user.selectedImageIndex ?? 0) + 1}/{user.imageCount}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {user.name}
                        </Link>
                        <span className="text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((value) => (
                          <Badge key={value} variant={roleBadgeVariant(value)}>
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={memberStatusBadgeVariant(user.memberStatus)}>
                        {user.memberStatus ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive
                          ? t("Active", "সক্রিয়")
                          : t("Inactive", "নিষ্ক্রিয়")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(user.createdAt))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs/relaxed text-muted-foreground">
            {t("Total", "মোট")}: {data.total.toLocaleString()} · {t("Page", "পৃষ্ঠা")}{" "}
            {data.page}/{data.totalPages}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-lg"
              disabled={!hasPrev || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label={t("Previous page", "আগের পৃষ্ঠা")}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              disabled={!hasNext || isLoading}
              onClick={() => setPage((current) => current + 1)}
              aria-label={t("Next page", "পরের পৃষ্ঠা")}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
