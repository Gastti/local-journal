export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types/database'
import Link from 'next/link'

type StatusFilter = 'all' | 'draft' | 'published' | 'archived'

const STATUS_LABELS: Record<string, string> = {
  all: 'Todos',
  draft: 'Borrador',
  published: 'Publicados',
  archived: 'Archivados',
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'border-[var(--color-rule)] text-[var(--color-rule)]',
  published: 'border-[var(--color-ink)] text-[var(--color-ink)]',
  archived: 'border-[var(--color-rule)] text-[var(--color-rule)]',
}

export default async function PostsPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const searchParams = await props.searchParams
  const filter = (searchParams.status ?? 'all') as StatusFilter

  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select('*, category:categories(id,name,slug,color,description,created_at)')
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data } = await query
  const posts = (data ?? []) as Post[]

  // Get counts per status
  const [{ count: draftCount }, { count: publishedCount }, { count: archivedCount }] =
    await Promise.all([
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
    ])

  const totalCount = (draftCount ?? 0) + (publishedCount ?? 0) + (archivedCount ?? 0)

  const tabs: { key: StatusFilter; count: number }[] = [
    { key: 'all', count: totalCount },
    { key: 'draft', count: draftCount ?? 0 },
    { key: 'published', count: publishedCount ?? 0 },
    { key: 'archived', count: archivedCount ?? 0 },
  ]

  return (
    <div className="p-10 max-w-5xl">
      {/* Page header */}
      <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-8">
        <h1 className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[var(--color-ink)]">
          Posts
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-[var(--color-rule)] mb-8">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'all' ? '/admin/posts' : `/admin/posts?status=${tab.key}`}
            className={`px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-colors border-b-2 -mb-px ${
              filter === tab.key
                ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-rule)] hover:text-[var(--color-ink)]'
            }`}
          >
            {STATUS_LABELS[tab.key]}{' '}
            <span className="ml-1 text-[9px]">({tab.count})</span>
          </Link>
        ))}
      </div>

      {/* Post list */}
      {posts.length > 0 ? (
        <div className="divide-y divide-[var(--color-rule)]">
          {posts.map((post) => (
            <div key={post.id} className="py-4 flex items-start gap-6">
              {/* Left: status + date */}
              <div className="shrink-0 w-28 pt-0.5">
                <span
                  className={`text-[9px] tracking-[0.15em] uppercase border px-1.5 py-0.5 ${STATUS_BADGE[post.status]}`}
                >
                  {STATUS_LABELS[post.status]}
                </span>
                <div className="text-[10px] text-[var(--color-rule)] mt-2">
                  {new Date(post.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Center: content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-base font-semibold text-[var(--color-ink)] hover:opacity-60 transition-opacity leading-snug block"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {post.title}
                </Link>
                {post.excerpt && (
                  <p className="text-xs text-[var(--color-rule)] mt-1 line-clamp-1">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {post.category && (
                    <span className="text-[10px] tracking-[0.08em] text-[var(--color-ink)] uppercase">
                      {post.category.name}
                    </span>
                  )}
                  {post.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-[var(--color-rule)] border border-[var(--color-rule)] px-1.5 py-0"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.ai_generated && (
                    <span className="text-[9px] tracking-[0.1em] uppercase text-[var(--color-rule)]">
                      IA
                    </span>
                  )}
                </div>
              </div>

              {/* Right: link */}
              <div className="shrink-0 pt-0.5">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-[10px] tracking-[0.1em] uppercase text-[var(--color-rule)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Ver →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-rule)]">
          No hay posts con este filtro.
        </p>
      )}
    </div>
  )
}
