export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Source } from '@/types/database'
import { createSource, deleteSource } from './actions'

export default async function SourcesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: false })

  const sources = (data ?? []) as Source[]

  return (
    <div className="p-10 max-w-5xl">
      {/* Page header */}
      <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-10 flex items-baseline justify-between">
        <h1 className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[var(--color-ink)]">
          Fuentes
        </h1>
        <span className="text-[10px] tracking-[0.1em] text-[var(--color-rule)]">
          {sources.length} registradas
        </span>
      </div>

      {/* Table */}
      {sources.length > 0 ? (
        <table className="w-full border-collapse mb-12 text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)]">
              <Th>Nombre</Th>
              <Th>URL</Th>
              <Th>RSS</Th>
              <Th>Activa</Th>
              <Th>Alta</Th>
              <Th>{''}</Th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr
                key={source.id}
                className="border-b border-[var(--color-rule)] hover:bg-[var(--color-rule)]/10 transition-colors"
              >
                <Td>
                  <span className="font-medium text-[var(--color-ink)]">
                    {source.name}
                  </span>
                </Td>
                <Td>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-rule)] hover:text-[var(--color-ink)] transition-colors truncate max-w-[16rem] block"
                  >
                    {source.url}
                  </a>
                </Td>
                <Td>
                  {source.rss_url ? (
                    <span className="text-[10px] tracking-[0.1em] uppercase border border-[var(--color-ink)] text-[var(--color-ink)] px-1.5 py-0.5">
                      RSS
                    </span>
                  ) : (
                    <span className="text-[var(--color-rule)]">—</span>
                  )}
                </Td>
                <Td>
                  <span
                    className={`text-[10px] tracking-[0.1em] uppercase border px-1.5 py-0.5 ${
                      source.is_active
                        ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
                        : 'border-[var(--color-rule)] text-[var(--color-rule)]'
                    }`}
                  >
                    {source.is_active ? 'sí' : 'no'}
                  </span>
                </Td>
                <Td>
                  <span className="text-[var(--color-rule)]">
                    {new Date(source.created_at).toLocaleDateString('es-AR')}
                  </span>
                </Td>
                <Td>
                  <form action={deleteSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-rule)] hover:text-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-[var(--color-rule)] mb-12">
          No hay fuentes registradas.
        </p>
      )}

      {/* Add form */}
      <div className="border-t-2 border-[var(--color-ink)] pt-6">
        <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-6">
          Nueva fuente
        </div>
        <form action={createSource} className="grid grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
          <Field label="Nombre *" name="name" required />
          <Field label="URL del portal *" name="url" type="url" required />
          <Field label="URL del RSS" name="rss_url" type="url" />
          <Field label="CSS Selector (scraping)" name="scrape_selector" />
          <div className="col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              defaultChecked
              className="accent-[var(--color-ink)]"
            />
            <label
              htmlFor="is_active"
              className="text-xs tracking-[0.08em] uppercase text-[var(--color-ink)] cursor-pointer"
            >
              Activa
            </label>
          </div>
          <div className="col-span-2 pt-2">
            <button
              type="submit"
              className="text-[11px] tracking-[0.15em] uppercase bg-[var(--color-ink)] text-[var(--color-paper)] px-5 py-2.5 hover:opacity-70 transition-opacity"
            >
              Agregar fuente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[9px] tracking-[0.2em] uppercase text-[var(--color-rule)] pb-3 font-normal pr-6">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-3 pr-6 text-sm text-[var(--color-ink)] align-middle">
      {children}
    </td>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.2em] uppercase text-[var(--color-rule)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm px-3 py-2 outline-none focus:border-[var(--color-ink)] transition-colors"
      />
    </div>
  )
}
