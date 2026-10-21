"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, FileCode, History, Mail, Settings, Users } from "lucide-react"

import { AdminEmailTemplates } from "@/components/admin/email/admin-email-templates"
import { AdminBulkEmail } from "@/components/admin/email/admin-bulk-email"
import { AdminEmailLogs } from "@/components/admin/email/admin-email-logs"
import { AdminSmtpSettings } from "@/components/admin/email/admin-smtp-settings"
import { useLanguage } from "@/components/language-provider"
import { cn } from "cn"

type EmailTab = "templates" | "bulk" | "logs" | "settings"

export function AdminEmailsContainer() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<EmailTab>("templates")
  const [mobileTab, setMobileTab] = useState<EmailTab | null>(null)

  const tabs = [
    {
      id: "templates" as const,
      label: { en: "Email Templates", bn: "ইমেইল টেমপ্লেট" },
      description: {
        en: "Manage and edit dynamic notification triggers",
        bn: "নোটিফিকেশন ও অটোমেটেড ইমেইল টেমপ্লেট সম্পাদনা",
      },
      icon: FileCode,
      colorClass: {
        bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      },
    },
    {
      id: "bulk" as const,
      label: { en: "Bulk Mailer", bn: "বাল্ক মেইলার" },
      description: {
        en: "Send filtered campaigns to targeted audiences",
        bn: "টার্গেটেড মেম্বারদের কাছে বাল্ক ইমেইল পাঠান",
      },
      icon: Users,
      colorClass: {
        bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      },
    },
    {
      id: "logs" as const,
      label: { en: "Delivery Logs", bn: "ডেলিভারি লগ" },
      description: {
        en: "Audit trail of all sent and failed messages",
        bn: "সকল প্রেরিত ও ব্যর্থ বার্তার অডিট হিস্টোরি",
      },
      icon: History,
      colorClass: {
        bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      },
    },
    {
      id: "settings" as const,
      label: { en: "SMTP Settings", bn: "এসএমটিপি সেটিংস" },
      description: {
        en: "Configure Gmail credentials and verify connection",
        bn: "ইমেইল ক্রেডেনশিয়াল ও সংযোগ যাচাইকরণ",
      },
      icon: Settings,
      colorClass: {
        bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      },
    },
  ]

  function handleSelectTab(tabId: EmailTab) {
    setActiveTab(tabId)
    setMobileTab(tabId)
  }

  const activeTabMeta = tabs.find((t) => t.id === activeTab)

  return (
    <div className="space-y-6">
      {/* Desktop Navigation Tab Bar (>= md) */}
      <div className="hidden md:flex border-b border-border gap-1 overflow-x-auto pb-px scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                isActive
                  ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
              )}
            >
              <Icon className="size-4" />
              <span>{t(tab.label.en, tab.label.bn)}</span>
            </button>
          )
        })}
      </div>

      {/* Mobile Tabs List (< md when on master list) */}
      {mobileTab === null && (
        <div className="space-y-2.5 md:hidden pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-1 pt-1">
            {t("Email Modules & Tools", "ইমেইল মডিউল ও টুলস")}
          </h2>

          <div className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className="w-full text-left group flex items-center justify-between gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/40 active:bg-accent/70 active:scale-[0.99] transition-all duration-150 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                        tab.colorClass.bg
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {t(tab.label.en, tab.label.bn)}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {t(tab.description.en, tab.description.bn)}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile Back Header (< md when viewing a tab panel) */}
      {mobileTab !== null && (
        <div className="md:hidden flex items-center justify-between pb-3 mb-1 border-b border-border/60">
          <button
            type="button"
            onClick={() => setMobileTab(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all -ml-1"
          >
            <ChevronLeft className="size-4" />
            <span>{t("All Email Tools", "সকল ইমেইল টুলস")}</span>
          </button>

          {activeTabMeta && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <activeTabMeta.icon className="size-3.5 text-primary" />
              <span className="truncate max-w-[170px]">
                {t(activeTabMeta.label.en, activeTabMeta.label.bn)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab Panels (Always visible on desktop, visible on mobile when tab is selected) */}
      <div className={mobileTab === null ? "hidden md:block" : "block"}>
        {activeTab === "templates" && <AdminEmailTemplates />}
        {activeTab === "bulk" && <AdminBulkEmail />}
        {activeTab === "logs" && <AdminEmailLogs />}
        {activeTab === "settings" && <AdminSmtpSettings />}
      </div>
    </div>
  )
}
