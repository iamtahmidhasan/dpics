"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Filter,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import { departmentLabel, semesterLabel } from "@/lib/profile-labels"
import { Department } from "@/generated/prisma/enums"
import type { MemberListItem } from "@/lib/services/public-profile.service"
import { cn } from "cn"

interface MembersDirectoryProps {
  members: MemberListItem[]
  total: number
  page: number
  totalPages: number
  currentSearch?: string
  currentDepartment?: string
  currentSession?: string
}

export function MembersDirectory({
  members,
  total,
  page,
  totalPages,
  currentSearch = "",
  currentDepartment = "",
  currentSession = "",
}: MembersDirectoryProps) {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = React.useState(currentSearch)
  const [selectedDept, setSelectedDept] = React.useState(currentDepartment)

  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newParams).forEach(([key, val]) => {
      if (val && val.trim().length > 0) {
        params.set(key, val.trim())
      } else {
        params.delete(key)
      }
    })

    params.delete("page") // reset to page 1 on filter change
    router.push(`/members?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchTerm })
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedDept("")
    router.push("/members")
  }

  const hasActiveFilters = Boolean(currentSearch || currentDepartment || currentSession)

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase font-mono tracking-wider">
            <Users className="size-3.5" />
            <span>{t("Community Directory", "কমিউনিটি ডিরেক্টরি")}</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {t("Society Members", "সোসাইটি সদস্যবৃন্দ")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            {t(
              "Discover active students, leaders, and contributors across all departments of Dhaka Polytechnic Institute.",
              "ঢাকা পলিটেকনিক ইনস্টিটিউটের সকল ডিপার্টমেন্টের সক্রিয় শিক্ষার্থী ও সদস্যদের প্রোফাইল।"
            )}
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs self-start md:self-auto py-1 px-3">
          {total} {t("active members", "জন সক্রিয় সদস্য")}
        </Badge>
      </div>

      {/* Filter / Search Bar */}
      <Card size="sm" className="border-border bg-card p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Search by name, student ID, session...", "নাম, স্টুডেন্ট আইডি বা সেশন খুঁজুন...")}
              className="pl-8 text-xs h-9"
            />
          </form>

          {/* Department Select Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value)
              updateFilters({ department: e.target.value })
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
          >
            <option value="">{t("All Departments", "সকল বিভাগ")}</option>
            {Object.values(Department).map((dept) => (
              <option key={dept} value={dept}>
                {departmentLabel(t)(dept)}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => updateFilters({ search: searchTerm, department: selectedDept })}
            className="text-xs h-9 shrink-0 gap-1.5"
          >
            <Filter className="size-3.5" />
            <span>{t("Filter", "ফিল্টার")}</span>
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-9 shrink-0 text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="size-3.5" />
              <span>{t("Clear", "রিসেট")}</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Members Grid */}
      {members.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((m) => {
            const initials = m.name.trim().charAt(0).toUpperCase()

            return (
              <Link
                key={m.id}
                href={`/profile/${m.slug || m.studentId || m.userId || m.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/50 transition-all hover:shadow-sm"
              >
                <div className="space-y-3">
                  {/* Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      <Avatar className="size-14 rounded-xl border border-border shadow-xs bg-muted">
                        {m.avatar ? (
                          <AvatarImage src={m.avatar} alt={m.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -bottom-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xs"
                        title={t("Verified Member", "যাচাইকৃত সদস্য")}
                      >
                        <CheckCircle2 className="size-3" />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {m.isInstructor && (
                        <Badge variant="default" className="text-[9px] px-1.5 py-0 gap-0.5">
                          <GraduationCap className="size-2.5" />
                          <span>{t("Instructor", "শিক্ষক")}</span>
                        </Badge>
                      )}
                      {m.committeeRolesCount > 0 && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {t("Committee", "কমিটি")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Name & Academic info */}
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {m.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {departmentLabel(t)(m.department)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {t("Session", "সেশন")} {m.session} • {semesterLabel(t)(m.semester)}
                    </p>
                  </div>
                </div>

                {/* Bottom metadata */}
                <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  {m.studentId ? (
                    <span className="font-mono text-[10px]">#{m.studentId}</span>
                  ) : (
                    <span />
                  )}

                  <span className="font-medium text-primary group-hover:underline inline-flex items-center gap-1">
                    {t("View profile", "প্রোফাইল")} &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card size="sm" className="p-12 text-center text-muted-foreground border-dashed">
          <Users className="mx-auto size-10 opacity-40 mb-2" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("No members found", "কোনো সদস্য পাওয়া যায়নি")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {t(
              "Try adjusting your search criteria or clearing filters to see more members.",
              "অন্য কোনো নাম বা ডিপার্টমেন্ট দিয়ে চেষ্টা করুন।"
            )}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 text-xs"
            >
              {t("Clear all filters", "ফিল্টার রিসেট করুন")}
            </Button>
          )}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(page - 1))
              router.push(`/members?${params.toString()}`)
            }}
            className="text-xs gap-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>{t("Previous", "আগের")}</span>
          </Button>

          <span className="text-xs text-muted-foreground font-mono px-2">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(page + 1))
              router.push(`/members?${params.toString()}`)
            }}
            className="text-xs gap-1"
          >
            <span>{t("Next", "পরবর্তী")}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
