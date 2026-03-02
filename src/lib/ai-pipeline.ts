import Groq from 'groq-sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RawArticle, Category } from '@/types/database'

export type AIResult = {
  articles_fetched: number
  posts_generated: number
  errors: string[]
}

type ArticleGroup = {
  ids: string[]
  topic: string
}

type PostDraft = {
  title: string
  slug: string
  excerpt: string
  content: string
  category_id: string | null
  tags: string[]
}

const isMock = process.env.AI_MOCK === 'true'
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

function snippet(text: string | null, max = 200): string {
  if (!text) return ''
  return text.length <= max ? text : text.slice(0, max) + '…'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// --- Mock implementations ---

function mockGroupArticles(articles: RawArticle[]): ArticleGroup[] {
  const groups: ArticleGroup[] = []
  const size = 2
  for (let i = 0; i < articles.length; i += size) {
    const chunk = articles.slice(i, i + size)
    groups.push({ ids: chunk.map((a) => a.id), topic: `Tema mock ${i / size + 1}` })
  }
  return groups
}

function mockGeneratePost(groupArticles: RawArticle[], categories: Category[]): PostDraft {
  const first = groupArticles[0]
  const title = `[MOCK] ${first.title}`
  const slug = slugify(title)
  const category = categories[0] ?? null
  const content = groupArticles
    .map((a) => `## ${a.title}\n\n${a.content ?? '_Sin contenido._'}\n\nFuente: ${a.url}`)
    .join('\n\n---\n\n')
  return {
    title,
    slug,
    excerpt: `Resumen mock basado en ${groupArticles.length} artículo(s).`,
    content,
    category_id: category?.id ?? null,
    tags: ['mock', 'test'],
  }
}

// --- Real Groq implementations ---

const MODEL = 'llama-3.3-70b-versatile'

// Parse JSON robustly: strips code fences, extracts JSON block,
// and escapes raw control characters inside strings as a last resort.
function parseJSON<T>(raw: string): T {
  // 1. Strip markdown code fences
  let text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  // 2. Extract from first { or [ to last } or ]
  const start = text.search(/[{[]/)
  if (start > 0) text = text.slice(start)
  const isArr = text.startsWith('[')
  const end = isArr ? text.lastIndexOf(']') : text.lastIndexOf('}')
  if (end !== -1) text = text.slice(0, end + 1)

  // 3. Try to parse as-is
  try {
    return JSON.parse(text) as T
  } catch {
    // 4. Escape raw control characters that appear inside JSON strings
    const sanitized = text.replace(/[\x00-\x1F]/g, (c) => {
      if (c === '\n') return '\\n'
      if (c === '\r') return '\\r'
      if (c === '\t') return '\\t'
      return ''
    })
    return JSON.parse(sanitized) as T
  }
}

async function askJSON<T>(prompt: string, maxTokens: number): Promise<T> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    // Force the model to output valid JSON — prevents code fences and prose
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = completion.choices[0]?.message?.content ?? '{}'
  return parseJSON<T>(raw)
}

async function groupArticles(articles: RawArticle[]): Promise<ArticleGroup[]> {
  const payload = articles.map((a) => ({
    id: a.id,
    title: a.title,
    snippet: snippet(a.content),
  }))

  const prompt = `Sos un editor de un diario local. Recibís los siguientes artículos scrapeados.
Agrupalos por tema: artículos que cubren el mismo evento deben ir juntos.
Los que no tienen relación van solos en su propio grupo.

Devolvé un JSON con esta forma exacta (objeto con clave "groups"):
{"groups": [{"ids": ["id1", "id2"], "topic": "descripción breve"}, ...]}

Artículos:
${JSON.stringify(payload, null, 2)}`

  const result = await askJSON<{ groups: ArticleGroup[] }>(prompt, 1024)
  return result.groups
}

async function generatePost(
  groupArticles: RawArticle[],
  categories: Category[],
): Promise<PostDraft> {
  const articlesPayload = groupArticles.map((a) => ({
    title: a.title,
    url: a.url,
    content: a.content ?? '',
  }))

  const categoriesPayload = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  const prompt = `Sos un periodista de un diario local argentino.
Basándote en los siguientes artículos fuente, escribí un post periodístico completo en español.

Categorías disponibles:
${JSON.stringify(categoriesPayload, null, 2)}

Devolvé un JSON con exactamente estas claves:
{
  "title": "titular en español",
  "slug": "slug-url-amigable",
  "excerpt": "resumen de 1-2 oraciones",
  "content": "cuerpo completo en markdown (usar \\n para saltos de línea)",
  "category_id": "uuid o null",
  "tags": ["tag1", "tag2", "tag3"]
}

Artículos fuente:
${JSON.stringify(articlesPayload, null, 2)}`

  return askJSON<PostDraft>(prompt, 4096)
}

export async function runAIPipeline(supabase: SupabaseClient): Promise<AIResult> {
  const errors: string[] = []
  let postsGenerated = 0

  // 1. Fetch unprocessed articles
  const { data: rawArticles, error: articlesError } = await supabase
    .from('raw_articles')
    .select('*')
    .eq('processed', false)

  if (articlesError) {
    return { articles_fetched: 0, posts_generated: 0, errors: [articlesError.message] }
  }

  const articles = (rawArticles ?? []) as RawArticle[]

  if (articles.length === 0) {
    await logRun(supabase, 0, 0, 'success', null)
    return { articles_fetched: 0, posts_generated: 0, errors: [] }
  }

  // 2. Fetch categories
  const { data: categoriesData } = await supabase.from('categories').select('*')
  const categories = (categoriesData ?? []) as Category[]

  // 3. Group articles by topic
  let groups: ArticleGroup[]
  try {
    groups = isMock ? mockGroupArticles(articles) : await groupArticles(articles)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Grouping failed: ${msg}`)
    await logRun(supabase, articles.length, 0, 'failed', errors.join(' | '))
    return { articles_fetched: articles.length, posts_generated: 0, errors }
  }

  const articleMap = new Map(articles.map((a) => [a.id, a]))

  // 4. Generate a post per group
  const groupResults = await Promise.allSettled(
    groups.map(async (group) => {
      const groupArticles = group.ids
        .map((id) => articleMap.get(id))
        .filter((a): a is RawArticle => !!a)

      if (groupArticles.length === 0) return

      const draft = isMock ? mockGeneratePost(groupArticles, categories) : await generatePost(groupArticles, categories)

      // Resolve slug collision
      let slug = draft.slug
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('slug', slug)
      if ((count ?? 0) > 0) {
        slug = `${slug}-${Date.now()}`
      }

      // Pick cover image from first article that has one
      const coverImageUrl = groupArticles.find((a) => a.image_url)?.image_url ?? null

      // Insert post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: draft.title,
          slug,
          excerpt: draft.excerpt,
          content: draft.content,
          category_id: draft.category_id,
          tags: draft.tags,
          status: 'draft',
          ai_generated: true,
          cover_image_url: coverImageUrl,
        })
        .select('id')
        .single()

      if (postError) throw new Error(`Insert post: ${postError.message}`)

      const postId = postData.id

      // Insert post_sources
      const postSources = groupArticles.map((a) => ({
        post_id: postId,
        raw_article_id: a.id,
      }))
      await supabase.from('post_sources').insert(postSources)

      // Mark articles as processed
      await supabase
        .from('raw_articles')
        .update({ processed: true })
        .in('id', groupArticles.map((a) => a.id))
    }),
  )

  for (const result of groupResults) {
    if (result.status === 'fulfilled') {
      postsGenerated++
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason))
    }
  }

  const logStatus =
    errors.length === 0
      ? 'success'
      : postsGenerated === 0
        ? 'failed'
        : 'partial'

  await logRun(supabase, articles.length, postsGenerated, logStatus, errors.join(' | ') || null)

  return { articles_fetched: articles.length, posts_generated: postsGenerated, errors }
}

async function logRun(
  supabase: SupabaseClient,
  articlesFetched: number,
  postsGenerated: number,
  status: 'success' | 'partial' | 'failed',
  errorMessage: string | null,
) {
  await supabase.from('ai_run_logs').insert({
    articles_fetched: articlesFetched,
    posts_generated: postsGenerated,
    status,
    error_message: errorMessage,
  })
}
