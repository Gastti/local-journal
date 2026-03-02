'use client'

import { useActionState } from 'react'
import { aiPipelineAction } from '../_actions/ai-pipeline'
import type { AIResult } from '@/lib/ai-pipeline'

type State = AIResult | null

export function AIButton() {
  const [result, action, isPending] = useActionState<State, FormData>(
    async () => aiPipelineAction(),
    null,
  )

  return (
    <div className="border border-[var(--color-rule)] p-6 mt-4">
      <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-4">
        Procesamiento IA
      </div>

      <form action={action}>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[var(--color-ink)] text-[var(--color-paper)] text-[11px] tracking-[0.18em] uppercase px-5 py-2.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? 'Procesando…' : 'Ejecutar IA'}
        </button>
      </form>

      {result && !isPending && (
        <div className="mt-5 pt-5 border-t border-[var(--color-rule)] space-y-1.5">
          <p className="text-sm text-[var(--color-ink)]">
            <span className="font-semibold">{result.articles_fetched}</span> artículos procesados ·{' '}
            <span className="font-semibold">{result.posts_generated}</span> posts generados
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-red-600 font-mono">
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
