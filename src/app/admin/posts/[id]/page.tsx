export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Post, RawArticle, Category } from '@/types/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { publishPost, archivePost, deletePost, changeCategory } from '../actions'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'border-[var(--color-rule)] text-[var(--color-rule)]',
  published: 'border-[var(--color-ink)] text-[var(--color-ink)]',
  archived: 'border-[var(--color-rule)] text-[var(--color-rule)]',
}

export default async function PostDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  const { data: postData } = await supabase
    .from('posts')
    .select('*, category:categories(id,name,slug,color,description,created_at)')
    .eq('id', params.id)
    .single()

  if (!postData) notFound()
  const post = postData as Post

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  const categories = (categoriesData ?? []) as Pick<Category, 'id' | 'name'>[]

  // Fetch source articles
  const { data: postSources } = await supabase
    .from('post_sources')
    .select('raw_article_id')
    .eq('post_id', post.id)

  const rawArticleIds = (postSources ?? []).map((ps) => ps.raw_article_id)

  let sourceArticles: RawArticle[] = []
  if (rawArticleIds.length > 0) {
    const { data } = await supabase
      .from('raw_articles')
      .select('*')
      .in('id', rawArticleIds)
    sourceArticles = (data ?? []) as RawArticle[]
  }

  return (
    <div className="p-10 max-w-3xl">
      {/* Back + header */}
      <div className="border-b-2 border-[var(--color-ink)] pb-3 mb-10 flex items-baseline justify-between">
        <Link
          href="/admin/posts"
          className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-rule)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← Posts
        </Link>
        <span
          className={`text-[9px] tracking-[0.18em] uppercase border px-1.5 py-0.5 ${STATUS_BADGE[post.status]}`}
        >
          {STATUS_LABELS[post.status]}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-6">
        {post.category && (
          <span className="text-[10px] tracking-[0.12em] uppercase font-medium text-[var(--color-ink)]">
            {post.category.name}
          </span>
        )}
        {post.tags?.map((tag) => (
          <span
            key={tag}
            className="text-[10px] text-[var(--color-rule)] border border-[var(--color-rule)] px-1.5 py-px"
          >
            {tag}
          </span>
        ))}
        {post.ai_generated && (
          <span className="text-[9px] tracking-[0.12em] uppercase text-[var(--color-rule)]">
            Generado por IA
          </span>
        )}
        <span className="text-[10px] text-[var(--color-rule)]">
          {new Date(post.created_at).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Title */}
      <h1
        className="text-3xl font-bold text-[var(--color-ink)] leading-tight mb-4"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-sm text-[var(--color-rule)] border-l-2 border-[var(--color-rule)] pl-4 mb-8 italic">
          {post.excerpt}
        </p>
      )}

      {/* Content */}
      <div className="border-t border-[var(--color-rule)] pt-6 mb-8">
        <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-4">
          Contenido (Markdown)
        </div>
        <pre className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed font-mono bg-[var(--color-rule)]/5 border border-[var(--color-rule)] p-4 overflow-x-auto">
          {post.content}
        </pre>
      </div>

      {/* Source articles */}
      {sourceArticles.length > 0 && (
        <div className="border-t border-[var(--color-rule)] pt-6 mb-8">
          <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-4">
            Artículos fuente ({sourceArticles.length})
          </div>
          <div className="divide-y divide-[var(--color-rule)]">
            {sourceArticles.map((article) => (
              <div key={article.id} className="py-2.5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-ink)] hover:opacity-60 transition-opacity block truncate"
                  >
                    {article.title}
                  </a>
                  <span className="text-[10px] text-[var(--color-rule)]">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString('es-AR')
                      : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change category */}
      {categories.length > 0 && (
        <div className="border-t border-[var(--color-rule)] pt-6 mb-8">
          <div className="text-[9px] tracking-[0.25em] uppercase text-[var(--color-rule)] mb-3">
            Cambiar categoría
          </div>
          <form action={changeCategory} className="flex items-center gap-3">
            <input type="hidden" name="id" value={post.id} />
            <select
              name="category_id"
              defaultValue={post.category_id ?? ''}
              className="text-sm border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] px-3 py-2 focus:outline-none focus:border-[var(--color-ink)]"
            >
              <option value="" disabled>Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="text-[11px] tracking-[0.15em] uppercase border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
            >
              Guardar
            </button>
          </form>
        </div>
      )}

      {/* Actions */}
      <div className="border-t-2 border-[var(--color-ink)] pt-6 flex flex-wrap gap-3">
        {post.status === 'draft' && (
          <form action={publishPost}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="text-[11px] tracking-[0.15em] uppercase bg-[var(--color-ink)] text-[var(--color-paper)] px-5 py-2.5 hover:opacity-70 transition-opacity"
            >
              Publicar
            </button>
          </form>
        )}
        {post.status !== 'archived' && (
          <form action={archivePost}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="text-[11px] tracking-[0.15em] uppercase border border-[var(--color-rule)] text-[var(--color-ink)] px-5 py-2.5 hover:bg-[var(--color-rule)]/20 transition-colors"
            >
              Archivar
            </button>
          </form>
        )}
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <button
            type="submit"
            className="text-[11px] tracking-[0.15em] uppercase border border-red-200 text-red-600 px-5 py-2.5 hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        </form>
      </div>
    </div>
  )
}
