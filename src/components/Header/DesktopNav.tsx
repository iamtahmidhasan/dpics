'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from 'cn'
import type { NavItem } from '@/lib/site-config'

const CLOSE_DELAY_MS = 220

export function DesktopNav({
  items,
  hidden,
}: {
  items: NavItem[]
  hidden: boolean
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [wasHidden, setWasHidden] = useState(hidden)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const [lastPathname, setLastPathname] = useState(pathname)

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearClose()
    closeTimer.current = setTimeout(() => setActiveIndex(null), CLOSE_DELAY_MS)
  }, [clearClose])

  const open = useCallback((i: number) => {
    clearClose()
    setActiveIndex(i)
  }, [clearClose])

  const close = useCallback(() => {
    clearClose()
    setActiveIndex(null)
  }, [clearClose])

  if (hidden !== wasHidden) {
    setWasHidden(hidden)
    if (hidden) setActiveIndex(null)
  }

  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setActiveIndex(null)
  }

  useEffect(() => {
    if (activeIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, close])

  const activeColumns = activeIndex !== null ? items[activeIndex]?.columns ?? [] : []
  const hasDropdown = activeColumns.length > 0

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      onMouseLeave={scheduleClose}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) scheduleClose()
      }}
    >
      {items.map((item, i) => {
        const isActive = activeIndex === i
        const hasChildren = item.columns.length > 0
        const triggerClass = cn(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none text-foreground',
          isActive && 'bg-muted',
        )
        return (
          <div
            key={item.label}
            onMouseEnter={() => open(i)}
            onFocus={() => open(i)}
          >
            {hasChildren ? (
              <Link
                href={item.href}
                aria-haspopup="true"
                aria-expanded={isActive}
                className={cn(triggerClass, 'flex items-center gap-1')}
              >
                {item.label}
                <ChevronDown
                  className={cn('size-3.5 transition-transform', isActive && 'rotate-180')}
                />
              </Link>
            ) : (
              <Link href={item.href} className={triggerClass}>
                {item.label}
              </Link>
            )}
          </div>
        )
      })}

      <AnimatePresence>
        {hasDropdown && (
          <motion.div
            key="mega-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
            className="absolute inset-x-0 top-full z-50 border-y border-border bg-background shadow-lg"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap gap-10 px-4 py-8 md:px-8">
              {activeColumns.map((col, ci) => (
                <div key={ci} className="min-w-48 flex-1">
                  {col.title && (
                    <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {col.title}
                    </p>
                  )}
                  <ul className="space-y-1">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                        >
                          {link.image && (
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={link.image}
                                alt={link.label}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </span>
                          )}
                          <span>
                            <span className="block text-sm font-medium">{link.label}</span>
                            {link.description && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {link.description}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
