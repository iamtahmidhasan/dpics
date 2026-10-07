"use client"

import { useState } from "react"
import { FileCode, History, Mail, Settings, Users } from "lucide-react"

import { AdminEmailTemplates } from "@/components/admin/email/admin-email-templates"
import { AdminBulkEmail } from "@/components/admin/email/admin-bulk-email"
import { AdminEmailLogs } from "@/components/admin/email/admin-email-logs"
import { AdminSmtpSettings } from "@/components/admin/email/admin-smtp-settings"
import { cn } from "cn"

export function AdminEmailsContainer() {
  const [activeTab, setActiveTab] = useState<"templates" | "bulk" | "logs" | "settings">("templates")

  const tabs = [
    {
      id: "templates" as const,
      label: "Email Templates",
      description: "Manage and edit dynamic notification triggers",
      icon: FileCode,
    },
    {
      id: "bulk" as const,
      label: "Bulk Mailer",
      description: "Send filtered campaigns to targeted audiences",
      icon: Users,
    },
    {
      id: "logs" as const,
      label: "Delivery Logs",
      description: "Audit trail of all sent and failed messages",
      icon: History,
    },
    {
      id: "settings" as const,
      label: "SMTP Settings",
      description: "Configure Gmail credentials and verify connection",
      icon: Settings,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Navigation Tab Bar */}
      <div className="flex border-b border-border gap-1 overflow-x-auto pb-px scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                isActive
                  ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-t-lg"
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "templates" && <AdminEmailTemplates />}
        {activeTab === "bulk" && <AdminBulkEmail />}
        {activeTab === "logs" && <AdminEmailLogs />}
        {activeTab === "settings" && <AdminSmtpSettings />}
      </div>
    </div>
  )
}
