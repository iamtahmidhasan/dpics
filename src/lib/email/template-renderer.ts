import { SITE_NAME, SITE_URL } from "@/lib/site"

/**
 * Replaces {{variable}} placeholders in a string with matching values from a dictionary
 */
export function interpolateVariables(template: string, variables: Record<string, unknown>): string {
  if (!template) return ""

  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
    const value = variables[key]
    if (value === null || value === undefined) {
      return ""
    }
    return String(value)
  })
}

/**
 * Wraps content inside the standard, high-deliverability DPICS email HTML shell
 */
export function wrapInBrandedLayout(innerHtml: string, title?: string): string {
  if (
    innerHtml.includes("<!DOCTYPE") ||
    (innerHtml.includes("<html") && innerHtml.includes("</html>"))
  ) {
    return innerHtml
  }

  const origin = SITE_URL.origin
  const logoUrl = `${origin}/DPICS_logo_vector.svg`
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || SITE_NAME}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 30px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 24px 32px;
      text-align: left;
    }
    .header-logo {
      display: inline-block;
      vertical-align: middle;
      height: 38px;
      max-height: 38px;
      width: auto;
      max-width: 140px;
    }
    .header-title {
      display: inline-block;
      vertical-align: middle;
      margin-left: 12px;
      color: #f8fafc;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header-tagline {
      display: block;
      color: #94a3b8;
      font-size: 11px;
      margin-top: 2px;
    }
    .content {
      padding: 32px;
      font-size: 15px;
      color: #334155;
    }
    .button {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      margin-top: 10px;
      margin-bottom: 10px;
      transition: background-color 0.2s;
    }
    .footer {
      padding: 24px 32px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #0284c7;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .content {
        padding: 24px 20px !important;
      }
      .header {
        padding: 20px !important;
      }
      .footer {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" class="main" align="center" width="100%" cellpadding="0" cellspacing="0">
      <!-- HEADER -->
      <tr>
        <td class="header">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <img src="${logoUrl}" alt="DPICS Logo" class="header-logo" height="38" style="display:inline-block; vertical-align:middle; height:38px; width:auto; max-width:140px;" />
                <div style="display:inline-block; vertical-align:middle; margin-left:12px;">
                  <span class="header-title">${SITE_NAME}</span>
                  <span class="header-tagline">Dhaka Polytechnic Institute</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td class="content">
          ${innerHtml}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td class="footer">
          <p style="margin: 0 0 8px 0;">
            This email was sent by <strong>${SITE_NAME}</strong>
          </p>
          <p style="margin: 0 0 12px 0;">
            Dhaka Polytechnic Institute, Tejgaon I/A, Dhaka-1208
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            <a href="${origin}">Website</a> &bull;
            <a href="${origin}/courses">Courses</a> &bull;
            <a href="${origin}/events">Events</a> &bull;
            <a href="${origin}/privacy">Privacy Policy</a>
          </p>
          <p style="margin: 12px 0 0 0; font-size: 11px; color: #cbd5e1;">
            &copy; ${year} DPI Computing Society. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
}

/**
 * Strips HTML tags to produce a clean plain-text alternative
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
