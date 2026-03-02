export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { AIRunLog } from '@/types/database'

const STATUS_STYLES: Record<AIRunLog['status'], string> = {
  success: 'border-[var(--color-ink)] text-[var(--color-ink)]',
  partial: 'border-[var(--color-rule)] text-[var(--color-rule)]',
  failed: 'border-red-500 text-red-600',
}

const STATUS_LABELS: Record<AIRunLog['status'], string> = {
  success: 'éxito',
  partial: 'parcial',
  failed: 'error',
}

export default async function LogsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_run_logs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(100)

  const logs = (data ?? []) as AIRunLog[]

  const successCount = logs.filter((l) => l.status === 'success').length
  const failedCount = logs.filter((l) => l.status === 'failed').length

  return (
    <div className="p-10 max-w-5xl">
      {/* Page header */}
      <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-10 flex items-baseline justify-between">
        <h1 className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[var(--color-ink)]">
          Logs de ejecución
        </h1>
        <div className="flex gap-4 text-[10px] tracking-[0.1em] text-[var(--color-rule)]">
          <span>{logs.length} registros</span>
          {failedCount > 0 && (
            <span className="text-red-600">{failedCount} con error</span>
          )}
          <span>{successCount} exitosos</span>
        </div>
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)]">
              <Th>Fecha y hora</Th>
              <Th>Estado</Th>
              <Th>Artículos</Th>
              <Th>Posts generados</Th>
              <Th>Error</Th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-[var(--color-rule)] hover:bg-[var(--color-rule)]/10 transition-colors"
              >
                <Td>
                  <span className="text-[var(--color-ink)] tabular-nums">
                    {new Date(log.ran_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}{' '}
                    <span className="text-[var(--color-rule)]">
                      {new Date(log.ran_at).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </Td>
                <Td>
                  <span
                    className={`text-[9px] tracking-[0.18em] uppercase border px-1.5 py-0.5 ${STATUS_STYLES[log.status]}`}
                  >
                    {STATUS_LABELS[log.status]}
                  </span>
                </Td>
                <Td>
                  <span className="tabular-nums text-[var(--color-ink)]">
                    {log.articles_fetched}
                  </span>
                </Td>
                <Td>
                  <span className="tabular-nums text-[var(--color-ink)]">
                    {log.posts_generated}
                  </span>
                </Td>
                <Td>
                  {log.error_message ? (
                    <span
                      className="text-red-600 text-xs truncate max-w-xs block"
                      title={log.error_message}
                    >
                      {log.error_message}
                    </span>
                  ) : (
                    <span className="text-[var(--color-rule)]">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="border border-[var(--color-rule)] p-6">
          <p className="text-sm text-[var(--color-rule)]">
            No hay ejecuciones registradas todavía.
          </p>
          <p className="text-xs text-[var(--color-rule)] mt-1">
            Los logs aparecerán aquí después de la primera ejecución del cron de IA.
          </p>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[var(--color-rule)] pb-3 font-normal pr-8">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-3 pr-8 text-sm text-[var(--color-ink)] align-middle">
      {children}
    </td>
  )
}
