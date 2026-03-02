'use client'

import { useActionState } from 'react'
import { scrapeAction } from '../_actions/scrape'
import type { ScrapeResult } from '@/lib/scraper'

type State = ScrapeResult | null

export function ScrapeButton() {
  const [result, action, isPending] = useActionState<State, FormData>(
    async () => scrapeAction(),
    null,
  )

  return (
    <div className="border border-[var(--color-rule)] p-6">
      <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-4">
        Ingesta manual
      </div>

      <form action={action}>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[var(--color-ink)] text-[var(--color-paper)] text-[11px] tracking-[0.18em] uppercase px-5 py-2.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? 'Ejecutando…' : 'Ejecutar scraping'}
        </button>
      </form>

      {result && !isPending && (
        <div className="mt-5 pt-5 border-t border-[var(--color-rule)] space-y-1.5">
          <p className="text-sm text-[var(--color-ink)]">
            <span className="font-semibold">{result.scraped}</span> encontrados ·{' '}
            <span className="font-semibold">{result.saved}</span> guardados
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
