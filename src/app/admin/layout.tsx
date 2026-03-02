import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from './_components/nav'
import { logoutAction } from './_actions/logout'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-[var(--color-rule)] flex flex-col bg-[var(--color-paper)]">
        {/* Masthead */}
        <div className="border-b border-[var(--color-rule)] px-6 py-5">
          <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-0.5">
            Local Journal
          </div>
          <div className="text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--color-ink)]">
            Redacción
          </div>
        </div>

        {/* Nav */}
        <AdminNav />

        {/* User / Logout */}
        <div className="mt-auto border-t border-[var(--color-rule)] px-6 py-4">
          <div className="text-[10px] text-[var(--color-rule)] truncate mb-2">
            {user.email}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-ink)] hover:opacity-40 transition-opacity"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[var(--color-paper)]">
        {children}
      </main>
    </div>
  )
}
