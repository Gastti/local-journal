export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/database'
import { createCategory, deleteCategory } from './actions'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  const categories = (data ?? []) as Category[]

  return (
    <div className="p-10 max-w-4xl">
      {/* Page header */}
      <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-10 flex items-baseline justify-between">
        <h1 className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[var(--color-ink)]">
          Categorías
        </h1>
        <span className="text-[10px] tracking-[0.1em] text-[var(--color-rule)]">
          {categories.length} registradas
        </span>
      </div>

      {/* Table */}
      {categories.length > 0 ? (
        <table className="w-full border-collapse mb-12 text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)]">
              <Th>Nombre</Th>
              <Th>Slug</Th>
              <Th>Color</Th>
              <Th>Descripción</Th>
              <Th>{''}</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-[var(--color-rule)] hover:bg-[var(--color-rule)]/10 transition-colors"
              >
                <Td>
                  <span className="font-medium text-[var(--color-ink)]">{cat.name}</span>
                </Td>
                <Td>
                  <span className="text-[11px] font-mono text-[var(--color-rule)]">
                    {cat.slug}
                  </span>
                </Td>
                <Td>
                  {cat.color ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 border border-[var(--color-rule)]"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[11px] font-mono text-[var(--color-rule)]">
                        {cat.color}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--color-rule)]">—</span>
                  )}
                </Td>
                <Td>
                  <span className="text-[var(--color-rule)] text-xs">
                    {cat.description ?? '—'}
                  </span>
                </Td>
                <Td>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={cat.id} />
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
          No hay categorías registradas.
        </p>
      )}

      {/* Add form */}
      <div className="border-t-2 border-[var(--color-ink)] pt-6">
        <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-6">
          Nueva categoría
        </div>
        <form action={createCategory} className="grid grid-cols-2 gap-x-6 gap-y-4 max-w-xl">
          <Field label="Nombre *" name="name" required />
          <Field label="Slug (auto si vacío)" name="slug" />
          <Field label="Descripción" name="description" />
          <div>
            <label className="block text-[9px] tracking-[0.2em] uppercase text-[var(--color-rule)] mb-1.5">
              Color (hex)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                name="color"
                className="w-10 h-9 border border-[var(--color-rule)] cursor-pointer bg-[var(--color-paper)] p-0.5"
              />
              <input
                type="text"
                placeholder="#000000"
                className="flex-1 border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm px-3 py-2 outline-none focus:border-[var(--color-ink)] transition-colors font-mono"
                readOnly
              />
            </div>
          </div>
          <div className="col-span-2 pt-2">
            <button
              type="submit"
              className="text-[11px] tracking-[0.15em] uppercase bg-[var(--color-ink)] text-[var(--color-paper)] px-5 py-2.5 hover:opacity-70 transition-opacity"
            >
              Agregar categoría
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
  required,
}: {
  label: string
  name: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-[9px] tracking-[0.2em] uppercase text-[var(--color-rule)] mb-1.5">
        {label}
      </label>
      <input
        type="text"
        name={name}
        required={required}
        className="w-full border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] text-sm px-3 py-2 outline-none focus:border-[var(--color-ink)] transition-colors"
      />
    </div>
  )
}
