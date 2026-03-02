'use client'

import { useActionState } from 'react'
import { digestAction } from '../_actions/digest'
import type { DigestResult } from '@/lib/digest-pipeline'

type State = DigestResult | null

export function DigestButton() {
  const [result, action, isPending] = useActionState<State, FormData>(
    async () => digestAction(),
    null,
  )

  return (
    <div className="border border-[var(--color-rule)] p-6 mt-4">
      <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-4">
        Resumen del día anterior
      </div>

      <form action={action}>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[var(--color-ink)] text-[var(--color-paper)] text-[11px] tracking-[0.18em] uppercase px-5 py-2.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? 'Generando…' : 'Generar digest'}
        </button>
      </form>

      {result && !isPending && (
        <div className="mt-5 pt-5 border-t border-[var(--color-rule)] space-y-1.5">
          {result.post_generated ? (
            <p className="text-sm text-[var(--color-ink)]">
              Post generado con{' '}
              <span className="font-semibold">{result.articles_used}</span> artículos.
              Revisalo en Borradores.
            </p>
          ) : (
            <p className="text-sm text-[var(--color-rule)]">
              {result.error ?? 'No se generó ningún post.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
