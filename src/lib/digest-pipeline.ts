import Groq from 'groq-sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RawArticle } from '@/types/database'

export type DigestResult = {
  post_generated: boolean
  articles_used: number
  error: string | null
}

const MODEL = 'llama-3.3-70b-versatile'
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseJSON<T>(raw: string): T {
  let text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const start = text.search(/[{[]/)
  if (start > 0) text = text.slice(start)
  const end = text.lastIndexOf('}')
  if (end !== -1) text = text.slice(0, end + 1)
  try {
    return JSON.parse(text) as T
  } catch {
    const sanitized = text.replace(/[\x00-\x1F]/g, (c) => {
      if (c === '\n') return '\\n'
      if (c === '\r') return '\\r'
      if (c === '\t') return '\\t'
      return ''
    })
    return JSON.parse(sanitized) as T
  }
}

type DigestDraft = {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
}

async function getOrCreateResumenCategory(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'resumen-del-dia')
    .maybeSingle()

  if (data) return data.id

  const { data: inserted, error } = await supabase
    .from('categories')
    .insert({ name: 'Resumen', slug: 'resumen-del-dia' })
    .select('id')
    .single()

  if (error) return null
  return inserted.id
}

async function generateDigest(
  articles: RawArticle[],
  since: Date,
  until: Date,
  label?: string,
): Promise<DigestDraft> {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
  const dayLabel = until.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  const dateLabel = `${dayLabel}, ${fmt(since)} – ${fmt(until)}`

  const payload = articles.map((a) => ({
    title: a.title,
    url: a.url,
    content: a.content?.slice(0, 400) ?? '',
    image_url: a.image_url ?? null,
  }))

  const prompt = `Sos un redactor de un diario local argentino.
Escribí un resumen periodístico de las noticias del ${dateLabel}.
El post debe repasar los principales temas del día de forma cohesiva y detallada, no como una lista.

Donde corresponda, podés incluir imágenes en el markdown usando este formato:
![descripción breve](url_de_la_imagen)
IMPORTANTE sobre las imágenes:
- Usá únicamente URLs de image_url que aparecen en los artículos fuente. No inventes URLs.
- Las imágenes deben estar solas en su propia línea, separadas del texto por una línea en blanco antes y después.
- Nunca pongas una imagen inmediatamente después de dos puntos ni pegada a una oración. Siempre en su propia línea.

Devolvé un JSON con exactamente estas claves:
{
  "title": "titular del resumen (ej: 'Las noticias del [fecha]')",
  "slug": "slug-url-amigable",
  "excerpt": "resumen de 1-2 oraciones del día",
  "content": "cuerpo completo en markdown (usar \\n para saltos de línea)",
  "tags": ["tag1", "tag2", "tag3"]
}

Artículos del día:
${JSON.stringify(payload, null, 2)}`

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const draft = parseJSON<DigestDraft>(raw)

  // Override title/slug with the provided label if given
  if (label) {
    draft.title = `${label} — ${dayLabel}`
    draft.slug = slugify(draft.title)
  }

  return draft
}

export async function runDigestPipeline(
  supabase: SupabaseClient,
  window?: { from: Date; to: Date },
  label?: string,
): Promise<DigestResult> {
  const now = new Date()
  const since = window?.from ?? new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const until = window?.to ?? now

  // Fetch articles in the time window
  const { data, error } = await supabase
    .from('raw_articles')
    .select('*')
    .gte('fetched_at', since.toISOString())
    .lte('fetched_at', until.toISOString())
    .order('fetched_at', { ascending: false })
    .limit(30)

  if (error) {
    return { post_generated: false, articles_used: 0, error: error.message }
  }

  const articles = (data ?? []) as RawArticle[]

  if (articles.length === 0) {
    return {
      post_generated: false,
      articles_used: 0,
      error: 'No se encontraron artículos en las últimas 24 horas.',
    }
  }

  // Generate digest
  let draft: DigestDraft
  try {
    draft = await generateDigest(articles, since, until, label)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { post_generated: false, articles_used: articles.length, error: msg }
  }

  // Resolve slug collision
  let slug = draft.slug || slugify(draft.title)
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
  if ((count ?? 0) > 0) slug = `${slug}-${Date.now()}`

  // Cover image: first article that has one
  const coverImageUrl = articles.find((a) => a.image_url)?.image_url ?? null

  // Ensure "Resumen del día" category exists
  const categoryId = await getOrCreateResumenCategory(supabase)

  const { error: insertError } = await supabase.from('posts').insert({
    title: draft.title,
    slug,
    excerpt: draft.excerpt,
    content: draft.content,
    category_id: categoryId,
    tags: draft.tags,
    status: 'published',
    published_at: new Date().toISOString(),
    ai_generated: true,
    cover_image_url: coverImageUrl,
  })

  if (insertError) {
    return { post_generated: false, articles_used: articles.length, error: insertError.message }
  }

  return { post_generated: true, articles_used: articles.length, error: null }
}
