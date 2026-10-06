"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  GraduationCap,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"
import type { InstructorListItem } from "@/lib/services/public-profile.service"

interface InstructorsDirectoryProps {
  instructors: InstructorListItem[]
  total: number
  page: number
  totalPages: number
  currentSearch?: string
}

export function InstructorsDirectory({
  instructors,
  total,
  page,
  totalPages,
  currentSearch = "",
}: InstructorsDirectoryProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = React.useState(currentSearch)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    } else {
      params.delete("search")
    }
    params.delete("page")
    router.push(`/instructors?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    router.push("/instructors")
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase font-mono tracking-wider">
            <GraduationCap className="size-3.5" />
            <span>{t("Mentorship & Instruction", "মেন্টরশিপ ও শিক্ষকতা")}</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {t("Instructors & Mentors", "ইনস্ট্রাক্টর ও মেন্টরবৃন্দ")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            {t(
              "Learn from talented seniors, industry practitioners, and faculty members guiding the future engineers of DPI.",
              "ঢাকা পলিটেকনিকের দক্ষ সিনিয়র, ইন্ডাস্ট্রি প্রফেশনাল ও মেন্টরদের সাথে পরিচিত হন।"
            )}
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs self-start md:self-auto py-1 px-3">
          {total} {t("instructors", "জন ইনস্ট্রাক্টর")}
        </Badge>
      </div>

      {/* Filter / Search Bar */}
      <Card size="sm" className="border-border bg-card p-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("Search by instructor name, expertise, or bio...", "ইনস্ট্রাক্টরের নাম বা দক্ষতা খুঁজুন...")}
              className="pl-8 text-xs h-9"
            />
          </div>

          <Button type="submit" size="sm" className="text-xs h-9 shrink-0 gap-1.5">
            <Search className="size-3.5" />
            <span>{t("Search", "খুঁজুন")}</span>
          </Button>

          {currentSearch && (
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
        </form>
      </Card>

      {/* Instructors Grid */}
      {instructors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((inst) => {
            const initials = inst.name.trim().charAt(0).toUpperCase()

            return (
              <Link
                key={inst.id}
                href={`/profile/${inst.slug || inst.studentId || inst.instructorId || inst.userId || inst.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 transition-all hover:shadow-sm space-y-4"
              >
                <div className="space-y-3">
                  {/* Avatar, Name & Expertise */}
                  <div className="flex items-start gap-3.5">
                    <Avatar className="size-16 rounded-2xl border-2 border-border shadow-xs bg-muted shrink-0">
                      {inst.avatar ? (
                        <AvatarImage src={inst.avatar} alt={inst.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="font-bold text-lg bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {inst.name}
                        </h3>
                      </div>

                      {inst.skills && inst.skills.length > 0 ? (
                        <p className="text-xs text-primary font-medium line-clamp-1">
                          {inst.skills.join(", ")}
                        </p>
                      ) : null}

                      {inst.instructorId && (
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          #{inst.instructorId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {inst.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {inst.bio}
                    </p>
                  )}
                </div>

                {/* Bottom stats row */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <GraduationCap className="size-3 text-emerald-500" />
                      <span>{inst.coursesCount} {t("courses", "টি কোর্স")}</span>
                    </span>

                    {inst.postsCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <FileText className="size-3 text-sky-500" />
                        <span>{inst.postsCount} {t("posts", "টি লেখা")}</span>
                      </span>
                    )}
                  </div>

                  <span className="font-medium text-primary group-hover:underline text-[11px] inline-flex items-center gap-1">
                    {t("View profile", "প্রোফাইল")} &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card size="sm" className="p-12 text-center text-muted-foreground border-dashed">
          <GraduationCap className="mx-auto size-10 opacity-40 mb-2" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("No instructors found", "কোনো ইনস্ট্রাক্টর পাওয়া যায়নি")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {t(
              "Try searching for another topic or clear the search query.",
              "অন্য কোনো নাম বা দক্ষতা দিয়ে চেষ্টা করুন।"
            )}
          </p>
          {currentSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 text-xs"
            >
              {t("Clear search", "সার্চ রিসেট করুন")}
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
              router.push(`/instructors?${params.toString()}`)
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
              router.push(`/instructors?${params.toString()}`)
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
