"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, UserPlus, Users } from "lucide-react"
import { cn } from "cn"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { UsersTable } from "@/components/admin/users-table"
import { InvitationsTable } from "@/components/admin/invitations-table"
import { InviteUserDialog } from "@/components/admin/invite-user-dialog"
import { Role } from "@/generated/prisma/enums"
import type { UserListResult } from "@/lib/services/user.service"

interface AdminUsersViewProps {
  initialUsersData: UserListResult
  currentUserRoles: Role[]
  pendingInvitationsCount?: number
}

export function AdminUsersView({
  initialUsersData,
  currentUserRoles,
  pendingInvitationsCount = 0,
}: AdminUsersViewProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("users")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"single" | "bulk">("single")
  const [refreshKey, setRefreshKey] = useState(0)

  const tabs = [
    {
      id: "users" as const,
      label: t("Registered Users", "নিবন্ধিত ব্যবহারকারী"),
      icon: Users,
      badge: initialUsersData.total.toLocaleString(),
    },
    {
      id: "invitations" as const,
      label: t("Invitations", "আমন্ত্রণসমূহ"),
      icon: Mail,
      badge: pendingInvitationsCount > 0 ? String(pendingInvitationsCount) : undefined,
      isPendingBadge: pendingInvitationsCount > 0,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header with Title and Primary Invite Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold">{t("User Management", "ব্যবহারকারী ব্যবস্থাপনা")}</h1>
          <p className="text-xs/relaxed text-muted-foreground">
            {t(
              "Manage registered member accounts and send controlled email invitations.",
              "নিবন্ধিত সদস্য অ্যাকাউন্ট পরিচালনা করুন এবং নিয়ন্ত্রিত ইমেইল আমন্ত্রণ পাঠান।"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link href="/admin/emails?template=USER_INVITATION">
            <Button
              variant="outline"
              className="gap-2"
              title={t("Customize Invitation Email Template", "আমন্ত্রণ ইমেইল টেমপ্লেট কাস্টমাইজ করুন")}
            >
              <Mail className="size-4" />
              <span>{t("Email Template", "ইমেইল টেমপ্লেট")}</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              setDialogMode("bulk")
              setIsInviteDialogOpen(true)
            }}
            className="gap-2"
          >
            <Users className="size-4" />
            <span>{t("Bulk Invite", "বাল্ক আমন্ত্রণ")}</span>
          </Button>

          <Button
            onClick={() => {
              setDialogMode("single")
              setIsInviteDialogOpen(true)
            }}
            className="gap-2"
          >
            <UserPlus className="size-4" />
            <span>{t("Invite User", "আমন্ত্রণ জানান")}</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tab Bar matching other admin pages */}
      <div className="border-b border-border">
        <nav
          className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px scrollbar-none"
          aria-label={t("User Management Tabs", "ব্যবহারকারী ব্যবস্থাপনা ট্যাব")}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap outline-none",
                  isActive
                    ? "border-primary text-primary font-semibold bg-primary/5 rounded-t-md"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded font-normal tabular-nums",
                      isActive
                        ? "bg-primary/15 text-primary font-semibold"
                        : tab.isPendingBadge
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "users" && <UsersTable initialData={initialUsersData} />}
        {activeTab === "invitations" && (
          <InvitationsTable
            key={refreshKey}
            currentUserRoles={currentUserRoles}
          />
        )}
      </div>

      <InviteUserDialog
        key={`invite-dialog-${dialogMode}`}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        initialMode={dialogMode}
        onSuccess={() => {
          setActiveTab("invitations")
          setRefreshKey((k) => k + 1)
        }}
        currentUserRoles={currentUserRoles}
      />
    </div>
  )
}
