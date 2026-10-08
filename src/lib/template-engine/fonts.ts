import "server-only"

export interface LoadedFont {
  name: string
  data: ArrayBuffer
  weight: 400 | 500 | 600 | 700 | 800
  style: "normal" | "italic"
}

// In-memory cache for loaded TTF font buffers across requests
const fontCache = new Map<string, ArrayBuffer>()

// Reliable TTF font CDNs (jsdelivr / fontsource)
const FONT_URLS: Record<string, string> = {
  "Inter-400": "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
  "Inter-600": "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf",
  "Inter-700": "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
  "Hind Siliguri-400": "https://cdn.jsdelivr.net/fontsource/fonts/hind-siliguri@latest/bengali-400-normal.ttf",
  "Hind Siliguri-600": "https://cdn.jsdelivr.net/fontsource/fonts/hind-siliguri@latest/bengali-600-normal.ttf",
  "Hind Siliguri-700": "https://cdn.jsdelivr.net/fontsource/fonts/hind-siliguri@latest/bengali-700-normal.ttf",
  "Poppins-400": "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-normal.ttf",
  "Poppins-600": "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-600-normal.ttf",
  "Poppins-700": "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-700-normal.ttf",
  "Roboto-400": "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf",
  "Roboto-700": "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.ttf",
}

async function loadFontBuffer(key: string, url: string): Promise<ArrayBuffer | null> {
  if (fontCache.has(key)) {
    return fontCache.get(key)!
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 * 30 }, // 30-day cache
    })
    if (!res.ok) {
      console.warn(`[TemplateEngine] Failed to fetch font ${key} from ${url}: ${res.statusText}`)
      return null
    }
    const buffer = await res.arrayBuffer()
    fontCache.set(key, buffer)
    return buffer
  } catch (err) {
    console.error(`[TemplateEngine] Error loading font ${key}:`, err)
    return null
  }
}

/**
 * Loads and returns all required fonts for ImageResponse based on the fonts used in the template.
 */
export async function getTemplateFonts(
  requestedFamilies: string[] = ["Inter", "Hind Siliguri"]
): Promise<LoadedFont[]> {
  const families = new Set(["Inter", ...requestedFamilies])
  const loaded: LoadedFont[] = []

  const weights: Array<400 | 600 | 700> = [400, 600, 700]

  const loadTasks: Promise<void>[] = []

  for (const family of families) {
    for (const weight of weights) {
      const key = `${family}-${weight}`
      const url = FONT_URLS[key]
      if (!url) continue

      loadTasks.push(
        (async () => {
          const buffer = await loadFontBuffer(key, url)
          if (buffer) {
            loaded.push({
              name: family,
              data: buffer,
              weight,
              style: "normal",
            })
          }
        })()
      )
    }
  }

  // Also ensure Bengali font (Hind Siliguri) is always present for Unicode Bangla rendering
  if (!families.has("Hind Siliguri")) {
    for (const weight of [400, 700] as const) {
      const key = `Hind Siliguri-${weight}`
      const url = FONT_URLS[key]
      if (url) {
        loadTasks.push(
          (async () => {
            const buffer = await loadFontBuffer(key, url)
            if (buffer) {
              loaded.push({
                name: "Hind Siliguri",
                data: buffer,
                weight,
                style: "normal",
              })
            }
          })()
        )
      }
    }
  }

  await Promise.all(loadTasks)
  return loaded
}
