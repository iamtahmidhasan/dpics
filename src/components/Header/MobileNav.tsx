'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { cn } from 'cn'
import type { MobileNavItem } from '@/lib/site-config'

const linkClass =
  'flex w-full items-center gap-2 overflow-hidden rounded-none p-2 text-left text-xs ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground'

export function MobileNav({
  items,
  onNavigate,
}: {
  items: MobileNavItem[]
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-px">
      {items.map((item, i) => {
        const hasChildren = item.children.length > 0
        const isOpen = openIndex === i
        const isActive = pathname === item.href
        return (
          <div key={item.label}>
            {hasChildren ? (
              <div className="flex w-full items-center">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  data-active={isActive || undefined}
                  className={cn(linkClass, 'flex-1')}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`Toggle ${item.label} submenu`}
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
                {item.label}
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
                    key={child.label}
                    href={child.href}
                    onClick={onNavigate}
                    data-active={pathname === child.href || undefined}
                    className={linkClass}
                  >
                    <span className="text-sidebar-foreground/60">{child.label}</span>
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
