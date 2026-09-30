'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { cn } from 'cn'
import { useLanguage } from '@/components/language-provider'
import type { LocalizedText } from '@/lib/i18n'

const linkClass =
  'flex w-full items-center gap-2 overflow-hidden rounded-none p-2 text-left text-xs ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground'

export type MobileNavItem = {
  label: LocalizedText
  href: string
  children: { label: LocalizedText; href: string }[]
}

export function MobileNav({
  items,
  onNavigate,
}: {
  items: MobileNavItem[]
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-px">
      {items.map((item, i) => {
        const hasChildren = item.children.length > 0
        const isOpen = openIndex === i
        const isActive = pathname === item.href
        return (
          <div key={item.href}>
            {hasChildren ? (
              <div className="flex w-full items-center">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  data-active={isActive || undefined}
                  className={cn(linkClass, 'flex-1')}
                >
                  {t(item.label)}
                </Link>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={t(`Toggle ${item.label.en} submenu`, `${item.label.bn} সাবমেনু টগল করুন`)}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex size-9 shrink-0 items-center justify-center text-sidebar-foreground/60 transition-colors outline-hidden hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring active:text-sidebar-foreground"
                >
                  <ChevronDown
                    className={cn(
                      'size-4 transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
              </div>
            ) : (
              <Link
                href={item.href}
                onClick={onNavigate}
                data-active={isActive || undefined}
                className={linkClass}
              >
                {t(item.label)}
              </Link>
            )}

            {hasChildren && (
              <div
                className={cn(
                  'ml-4 overflow-hidden border-l border-sidebar-border pl-2 transition-all duration-200',
                  isOpen ? 'max-h-96' : 'max-h-0',
                )}
              >
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    data-active={pathname === child.href || undefined}
                    className={linkClass}
                  >
                    <span className="text-sidebar-foreground/60">
                      {t(child.label)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
