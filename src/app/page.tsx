export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types/database'

// Font helpers — referencia directa sin cadena doble var()
const F = {
  headline: 'var(--font-playfair), Georgia, serif',
  serif:    'var(--font-garamond), Georgia, serif',
  ui:       'var(--font-franklin), Helvetica Neue, sans-serif',
} as const

export default async function HomePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, tags, published_at, created_at, cover_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const posts = (data ?? []) as Post[]
  const [lead, ...rest] = posts

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Masthead */}
        <header className="text-center mb-10">
          <p className="text-[10px] tracking-[0.45em] uppercase mb-4"
            style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
            Noticias locales · Generadas con IA
          </p>
          <h1
            className="font-bold leading-none mb-3"
            style={{
              fontFamily: F.headline,
              fontSize: 'clamp(3.5rem, 10vw, 7rem)',
              letterSpacing: '-0.01em',
            }}
          >
            Local Journal
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="h-px flex-1 bg-[var(--color-ink)]" />
            <p className="text-[10px] tracking-[0.3em] uppercase shrink-0"
              style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
              {today}
            </p>
            <div className="h-px flex-1 bg-[var(--color-ink)]" />
          </div>
        </header>

        {posts.length === 0 ? (
          <div className="py-24 text-center border-t border-[var(--color-rule)]">
            <p className="text-sm tracking-wide"
              style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
              Sin publicaciones por el momento.
            </p>
          </div>
        ) : (
          <>
            {/* Lead story */}
            {lead && (
              <Link
                href={`/posts/${lead.slug}`}
                className="block group border-t-2 border-[var(--color-ink)]"
              >
                {lead.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lead.cover_image_url}
                    alt={lead.title}
                    className="w-full object-cover border-b border-[var(--color-rule)] group-hover:opacity-90 transition-opacity duration-300"
                    style={{ maxHeight: '26rem' }}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 border-b border-[var(--color-rule)]">
                  <div className="lg:col-span-2 p-8 lg:border-r border-[var(--color-rule)]">
                    <p className="text-[9px] tracking-[0.35em] uppercase mb-5"
                      style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
                      Nota principal
                    </p>
                    <h2
                      className="font-bold leading-tight mb-5 group-hover:opacity-60 transition-opacity duration-200"
                      style={{
                        fontFamily: F.headline,
                        fontSize: 'clamp(1.9rem, 4vw, 3rem)',
                      }}
                    >
                      {lead.title}
                    </h2>
                    {lead.excerpt && (
                      <p className="text-[1.05rem] leading-relaxed opacity-80 italic"
                        style={{ fontFamily: F.serif }}>
                        {lead.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="p-8 flex flex-col justify-between gap-6">
                    <div className="text-[9px] tracking-[0.2em] uppercase leading-loose"
                      style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
                      {lead.tags?.map((tag) => (
                        <span key={tag} className="block">{tag}</span>
                      ))}
                    </div>
                    <p className="text-[10px] tracking-[0.25em] uppercase group-hover:opacity-50 transition-opacity"
                      style={{ fontFamily: F.ui }}>
                      Leer nota →
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Secondary grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.slug}`}
                    className={[
                      'block group hover:bg-[#f4f1ec] transition-colors duration-150 border-b border-[var(--color-rule)]',
                      (i + 1) % 3 !== 0 ? 'lg:border-r' : '',
                      (i + 1) % 2 !== 0 ? 'sm:border-r lg:border-r-0' : 'sm:border-r-0',
                      (i + 1) % 3 !== 0 && (i + 1) % 2 !== 0 ? 'lg:border-r' : '',
                    ].join(' ')}
                  >
                    {post.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-40 object-cover border-b border-[var(--color-rule)] group-hover:opacity-90 transition-opacity duration-200"
                      />
                    )}
                    <div className="p-6">
                      <h3
                        className="font-bold leading-snug mb-3 group-hover:opacity-60 transition-opacity"
                        style={{ fontFamily: F.headline, fontSize: '1.2rem' }}
                      >
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm leading-relaxed line-clamp-3"
                          style={{
                            fontFamily: F.serif,
                            color: 'var(--color-ink-muted)',
                            fontSize: '0.9rem',
                          }}>
                          {post.excerpt}
                        </p>
                      )}
                      <p className="text-[9px] tracking-[0.25em] uppercase mt-5 group-hover:opacity-50 transition-opacity"
                        style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
                        Leer →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-5 border-t border-[var(--color-rule)] flex justify-between items-center">
          <p className="text-[9px] tracking-[0.3em] uppercase"
            style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
            Local Journal
          </p>
          <p className="text-[9px] tracking-[0.2em] uppercase"
            style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
            Generado con IA · Groq
          </p>
        </footer>
      </div>
    </div>
  )
}
