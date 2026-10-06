import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing behind the wall should ever be indexed, and the authoring
        // routes are useless to a crawler. Event tickets are private passes.
        disallow: ["/admin", "/admin/", "/api/", "/events/ticket/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL.origin,
  }
}
