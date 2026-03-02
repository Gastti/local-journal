'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/sources', label: 'Fuentes' },
  { href: '/admin/categories', label: 'Categorías' },
  { href: '/admin/posts', label: 'Posts' },
  { href: '/admin/logs', label: 'Logs' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="py-2">
      {links.map((link) => {
        const isActive =
          link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-6 py-2.5 text-[11px] tracking-[0.12em] uppercase transition-colors ${
              isActive
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                : 'text-[var(--color-ink)] hover:bg-[var(--color-rule)]/30'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
