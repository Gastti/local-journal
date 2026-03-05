export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Post, Category } from '@/types/database'
import SiteHeader from '@/app/_components/site-header'
import SiteFooter from '@/app/_components/site-footer'

const F = {
  headline: 'var(--font-playfair), Georgia, serif',
  ui:       'var(--font-franklin), Helvetica Neue, sans-serif',
} as const

// ── Category grouping ────────────────────────────────────────────────────────

type PostWithCategory = Post & { category?: Category | null }
type CategoryGroup = { label: string; posts: PostWithCategory[] }

function groupByCategory(posts: PostWithCategory[]): CategoryGroup[] {
  const map = new Map<string, PostWithCategory[]>()

  for (const post of posts) {
    const key = post.category?.name ?? 'Sin categoría'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(post)
  }

  return [...map.entries()]
    .sort(([labelA, postsA], [labelB, postsB]) => {
      const slugA = postsA[0]?.category?.slug ?? null
      const slugB = postsB[0]?.category?.slug ?? null
      if (slugA === 'resumen-del-dia') return -1
      if (slugB === 'resumen-del-dia') return 1
      return labelA.localeCompare(labelB, 'es')
    })
    .map(([label, posts]) => ({ label, posts }))
}

// ── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: PostWithCategory }) {
  const date = new Date(post.published_at ?? post.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="flex flex-col gap-4 bg-[#f5f5f5] hover:bg-[#ebebeb] transition-colors duration-150 p-5 md:p-6 group flex-1"
    >
      <p className="text-[11px]" style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
        {date}
      </p>
      <h3
        className="font-bold leading-snug group-hover:opacity-60 transition-opacity"
        style={{ fontFamily: F.headline, fontSize: '1.2rem' }}
      >
        {post.title}
      </h3>
      {post.excerpt && (
        <p
          className="text-sm leading-relaxed flex-1 line-clamp-4"
          style={{ fontFamily: F.ui, color: 'var(--color-ink)' }}
        >
          {post.excerpt}
        </p>
      )}
      <p
        className="text-[11px] font-semibold group-hover:opacity-50 transition-opacity"
        style={{ fontFamily: F.ui }}
      >
        Leer más ›
      </p>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()

  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, tags, published_at, created_at, category:categories(id, name, slug)')
    .eq('status', 'published')
    .gte('published_at', since48h)
    .order('published_at', { ascending: false })

  const posts = (data ?? []) as unknown as PostWithCategory[]
  const categories = groupByCategory(posts)

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-6 pb-16 mt-4 md:mt-6">

        {posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm" style={{ fontFamily: F.ui, color: 'var(--color-ink-muted)' }}>
              Sin publicaciones por el momento.
            </p>
          </div>
        ) : (
          categories.map(({ label, posts: catPosts }) => (
            <section key={label} className="mb-10 md:mb-16">

              {/* Category header */}
              <div className="flex items-center gap-4 mb-5 md:mb-8">
                <h2
                  className="text-xl md:text-2xl font-semibold capitalize shrink-0"
                  style={{ fontFamily: F.headline }}
                >
                  {label}
                </h2>
                <div className="h-px flex-1 bg-[var(--color-ink)] mt-1" />
              </div>

              {/* Cards — mobile: scroll horizontal, desktop: grid */}
              <div className="relative">
                {/* Scroll track */}
                <div
                  className="
                    flex gap-3 overflow-x-auto pb-2
                    md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5 md:overflow-visible md:pb-0
                    [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                    snap-x snap-mandatory scroll-smooth
                  "
                >
                  {catPosts.map((post) => (
                    <div
                      key={post.id}
                      className="min-w-[calc(100vw-5rem)] sm:min-w-[44vw] md:min-w-0 shrink-0 snap-start flex flex-col"
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                  {/* Spacer para que el último card no quede pegado al fade */}
                  <div className="min-w-3 shrink-0 md:hidden" aria-hidden="true" />
                </div>

                {/* Fade derecho — solo mobile */}
                <div
                  className="absolute inset-y-0 right-0 w-14 pointer-events-none md:hidden"
                  style={{ background: 'linear-gradient(to right, transparent, var(--color-paper))' }}
                />
              </div>

              {/* Indicador de scroll — solo mobile */}
              {catPosts.length > 1 && (
                <p className="scroll-swipe-hint flex items-center md:hidden mt-2.5">deslizá</p>
              )}

            </section>
          ))
        )}

      </main>
      <SiteFooter />
    </div>
  )
}
