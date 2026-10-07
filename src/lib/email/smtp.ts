import "server-only"

import dns from "node:dns"
import nodemailer, { type Transporter } from "nodemailer"
import prisma from "@/lib/prisma"

// Ensure IPv4 is prioritized in Node.js to prevent IPv6 DNS connection timeouts on Windows / Gmail
try {
  dns.setDefaultResultOrder?.("ipv4first")
} catch {
  // Ignore on runtimes where not supported
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromEmail: string
  fromName: string
  isEmailEnabled: boolean
}

let cachedTransporter: Transporter | null = null
let cachedConfigKey = ""

/**
 * Invalidates the cached Nodemailer transporter (e.g. after settings change or on connection drop)
 */
export function invalidateTransporterCache(): void {
  if (cachedTransporter) {
    try {
      cachedTransporter.close()
    } catch {
      // Ignore closing error
    }
    cachedTransporter = null
  }
  cachedConfigKey = ""
}

/**
 * Loads SMTP configuration from DB Setting with fallback to process.env
 */
export async function getSmtpConfig(): Promise<SmtpConfig> {
  const setting = await prisma.setting.findUnique({
    where: { id: "global" },
    select: {
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUser: true,
      smtpPass: true,
      smtpFromEmail: true,
      smtpFromName: true,
      isEmailEnabled: true,
    },
  })

  const host =
    setting?.smtpHost?.trim() ||
    process.env.SMTP_HOST?.trim() ||
    "smtp.gmail.com"

  const port =
    setting?.smtpPort ??
    (process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 465)

  const secure =
    setting?.smtpSecure ??
    (process.env.SMTP_SECURE === "false" ? false : port === 465)

  const user =
    setting?.smtpUser?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""

  const pass =
    setting?.smtpPass?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    ""

  const fromEmail =
    setting?.smtpFromEmail?.trim() ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    user ||
    "noreply@dpics.org"

  const fromName =
    setting?.smtpFromName?.trim() ||
    process.env.SMTP_FROM_NAME?.trim() ||
    "DPI Computing Society"

  const isEmailEnabled =
    setting?.isEmailEnabled ??
    (process.env.ENABLE_EMAIL !== "false")

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    isEmailEnabled,
  }
}

/**
 * Formats a valid RFC 2822 sender string (e.g. "DPI Computing Society" <info@gmail.com>)
 */
export function formatFromAddress(config: SmtpConfig): string {
  const cleanName = (config.fromName || "DPI Computing Society")
    .replace(/["\r\n]/g, "")
    .trim()
  const cleanEmail =
    config.fromEmail && config.fromEmail.includes("@")
      ? config.fromEmail.trim()
      : config.user.trim()

  return `"${cleanName}" <${cleanEmail}>`
}

/**
 * Creates or retrieves a cached Nodemailer transporter instance
 */
export async function createEmailTransporter(customConfig?: Partial<SmtpConfig>) {
  const config = customConfig
    ? { ...(await getSmtpConfig()), ...customConfig }
    : await getSmtpConfig()

  const cleanUser = config.user.trim()
  // Clean all spaces from Google App Password (Google displays them as 4x4 with spaces)
  const cleanPass = config.pass.replace(/\s+/g, "").replace(/['"]/g, "").trim()

  if (!cleanUser || !cleanPass) {
    throw new Error(
      "SMTP credentials are not configured. Please provide SMTP_USER (Gmail address) and SMTP_PASS (16-character Google App Password in Settings or .env)."
    )
  }

  const isPort465 = config.port === 465
  const configKey = `${config.host}:${config.port}:${cleanUser}:${cleanPass}:${isPort465}`

  // For custom configs (e.g. testing credentials in admin modal), create a temporary non-cached transporter
  if (customConfig) {
    const directTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isPort465,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      pool: false,
    })
    return {
      transporter: directTransporter,
      config: { ...config, user: cleanUser, pass: cleanPass },
    }
  }

  // Reuse cached transporter if config hasn't changed
  if (cachedTransporter && cachedConfigKey === configKey) {
    return {
      transporter: cachedTransporter,
      config: { ...config, user: cleanUser, pass: cleanPass },
    }
  }

  // Invalidate any old transporter before creating new one
  invalidateTransporterCache()

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: isPort465,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  })

  cachedTransporter = transporter
  cachedConfigKey = configKey

  return { transporter, config: { ...config, user: cleanUser, pass: cleanPass } }
}

/**
 * Verifies that the SMTP credentials are valid and connection can be established
 */
export async function verifySmtpConnection(customConfig?: Partial<SmtpConfig>): Promise<{
  success: boolean
  message: string
}> {
  try {
    const { transporter } = await createEmailTransporter(customConfig)
    await transporter.verify()
    return {
      success: true,
      message: "SMTP connection verified successfully with Gmail/Host!",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify SMTP connection"
    return {
      success: false,
      message,
    }
  }
}
