"use client"

import { useEffect, useState, useTransition } from "react"
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Globe, Info, Lock, Mail, RefreshCw, Send, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "cn"

export function AdminSmtpSettings() {
  const [host, setHost] = useState("smtp.gmail.com")
  const [port, setPort] = useState(465)
  const [secure, setSecure] = useState(true)
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [hasPassword, setHasPassword] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("DPI Computing Society")
  const [isEmailEnabled, setIsEmailEnabled] = useState(true)

  const [loading, setLoading] = useState(true)
  const [isSaving, startSaving] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Verify connection state
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/emails/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setHost(data.config.host || "smtp.gmail.com")
          setPort(data.config.port || 465)
          setSecure(data.config.secure ?? true)
          setUser(data.config.user || "")
          setHasPassword(data.config.hasPassword)
          setFromEmail(data.config.fromEmail || "")
          setFromName(data.config.fromName || "DPI Computing Society")
          setIsEmailEnabled(data.config.isEmailEnabled ?? true)
        }
      })
      .catch((err) => console.error("Failed to load SMTP settings:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = () => {
    setSaveError(null)
    setSaveSuccess(false)
    setVerifyResult(null)

    startSaving(async () => {
      try {
        const res = await fetch("/api/admin/emails/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host,
            port,
            secure,
            user,
            pass: pass.trim() || undefined,
            fromEmail,
            fromName,
            isEmailEnabled,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to save settings")
        }

        setSaveSuccess(true)
        if (pass.trim()) {
          setHasPassword(true)
          setPass("")
        }
        setTimeout(() => setSaveSuccess(false), 3000)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Error saving SMTP settings")
      }
    })
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setVerifyResult(null)

    try {
      const res = await fetch("/api/admin/emails/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port,
          secure,
          user,
          pass: pass.trim() || undefined,
          fromEmail,
          fromName,
        }),
      })

      const data = await res.json()
      setVerifyResult(data)
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection failed",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Informational Guidance Box for Gmail */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900/50 dark:bg-sky-950/20 text-xs space-y-2 text-sky-950 dark:text-sky-200">
        <div className="flex items-center gap-2 font-semibold">
          <Info className="size-4 text-sky-600 dark:text-sky-400" />
          <span>Setting up Gmail SMTP with Google App Password</span>
        </div>
        <p className="leading-relaxed">
          For Gmail accounts, you must use a dedicated <strong>Google App Password</strong> (16 characters, without spaces) instead of your primary account password.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-sky-900/80 dark:text-sky-300/80">
          <li>Go to your Google Account Settings &rarr; <strong>Security</strong>.</li>
          <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
          <li>Search for <strong>App passwords</strong>, create a new one (e.g., name it &ldquo;DPICS Mailer&rdquo;).</li>
          <li>Copy the 16-character code and paste it below into the <strong>SMTP Password</strong> field.</li>
        </ol>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Mail className="size-4 text-primary" /> Gmail / SMTP Configuration
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Credentials are encrypted and used for automated notifications and bulk campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Email Dispatch:</span>
            <Switch
              checked={isEmailEnabled}
              onCheckedChange={setIsEmailEnabled}
            />
            <span className={cn("text-xs font-semibold", isEmailEnabled ? "text-emerald-600" : "text-muted-foreground")}>
              {isEmailEnabled ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Server & Port Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground" /> SMTP Host
            </label>
            <Input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.gmail.com"
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Port & SSL</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="465"
                className="text-xs font-mono w-20"
              />
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Switch
                  checked={secure}
                  onCheckedChange={setSecure}
                  className="scale-75"
                />
                <span>SSL/TLS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" /> SMTP Username (Gmail Address)
            </label>
            <Input
              type="email"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="example@gmail.com"
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" /> Google App Password
              </label>
              {hasPassword && (
                <span className="text-[10px] text-emerald-600 font-medium">Password Saved ✓</span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={hasPassword ? "•••••••••••••••• (leave empty to keep unchanged)" : "16-character App Password"}
                className="text-xs font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sender Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-border">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Sender Display Name</label>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="DPI Computing Society"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Sender Reply-To Email</label>
            <Input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@dpics.org"
              className="text-xs font-mono"
            />
          </div>
        </div>

        {/* Verification Status Result */}
        {verifyResult && (
          <div
            className={cn(
              "p-3 rounded-lg text-xs flex items-center gap-2.5",
              verifyResult.success
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-800"
            )}
          >
            {verifyResult.success ? (
              <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="size-5 shrink-0 text-red-600" />
            )}
            <div>
              <p className="font-bold">{verifyResult.success ? "Connection Verified!" : "SMTP Connection Failed"}</p>
              <p className="text-[11px] mt-0.5">{verifyResult.message}</p>
            </div>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-lg bg-destructive/10 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleVerify}
            disabled={isVerifying || !user}
            className="gap-1.5 text-xs"
          >
            {isVerifying ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
            Verify SMTP Connection
          </Button>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Saved successfully
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              {isSaving ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
              Save SMTP Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
