export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { AIRunLog } from '@/types/database'
import { ScrapeButton } from './_components/scrape-button'
import { AIButton } from './_components/ai-button'
import { DigestButton } from './_components/digest-button'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalSources },
    { count: activeSources },
    { count: draftPosts },
    { count: publishedPosts },
    { count: archivedPosts },
    { data: lastLog },
  ] = await Promise.all([
    supabase.from('sources').select('*', { count: 'exact', head: true }),
    supabase
      .from('sources')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'archived'),
    supabase
      .from('ai_run_logs')
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const log = lastLog as AIRunLog | null

  return (
    <div className="p-10 max-w-3xl">
      {/* Page header */}
      <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-10">
        <h1
          className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[var(--color-ink)]"
        >
          Dashboard
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 border border-[var(--color-rule)] mb-8">
        <StatBox
          label="Fuentes activas"
          value={`${activeSources ?? 0} / ${totalSources ?? 0}`}
          sub="portales configurados"
        />
        <StatBox
          label="Borradores"
          value={String(draftPosts ?? 0)}
          sub="posts por revisar"
          leftBorder
        />
        <StatBox
          label="Publicados"
          value={String(publishedPosts ?? 0)}
          sub="visibles al público"
          topBorder
        />
        <StatBox
          label="Archivados"
          value={String(archivedPosts ?? 0)}
          sub="fuera de circulación"
          topBorder
          leftBorder
        />
      </div>

      {/* Last AI run */}
      <div className="border border-[var(--color-rule)] p-6">
        <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-4">
          Último procesamiento IA
        </div>
        {log ? (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="text-sm text-[var(--color-ink)]">
              {new Date(log.ran_at).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <StatusBadge status={log.status} />
            <span className="text-xs text-[var(--color-rule)]">
              {log.articles_fetched} artículos → {log.posts_generated} posts generados
            </span>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-rule)]">
            Sin ejecuciones registradas.
          </p>
        )}
      </div>

      {/* Manual scrape trigger */}
      <ScrapeButton />

      {/* AI pipeline trigger */}
      <AIButton />

      {/* Daily digest trigger */}
      <DigestButton />
    </div>
  )
}

function StatBox({
  label,
  value,
  sub,
  topBorder,
  leftBorder,
}: {
  label: string
  value: string
  sub: string
  topBorder?: boolean
  leftBorder?: boolean
}) {
  return (
    <div
      className={`p-6 ${topBorder ? 'border-t border-[var(--color-rule)]' : ''} ${leftBorder ? 'border-l border-[var(--color-rule)]' : ''}`}
    >
      <div className="text-[9px] tracking-[0.22em] uppercase text-[var(--color-rule)] mb-3">
        {label}
      </div>
      <div
        className="text-5xl font-bold text-[var(--color-ink)] mb-1 leading-none"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-[var(--color-rule)] mt-2">{sub}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: AIRunLog['status'] }) {
  const styles: Record<AIRunLog['status'], string> = {
    success: 'border-[var(--color-ink)] text-[var(--color-ink)]',
    partial: 'border-[var(--color-rule)] text-[var(--color-rule)]',
    failed: 'border-red-600 text-red-600',
  }
  const labels: Record<AIRunLog['status'], string> = {
    success: 'éxito',
    partial: 'parcial',
    failed: 'error',
  }
  return (
    <span
      className={`text-[9px] tracking-[0.18em] uppercase border px-1.5 py-0.5 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
