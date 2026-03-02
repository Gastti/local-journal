# Local Journal

Diario local automatizado con IA. Scrapea portales de noticias locales, agrupa artículos por tema y genera posts periodísticos completos usando LLMs. Incluye panel de administración y frontend público con estética de diario europeo.

## Flujo

```
RSS / Scraping → raw_articles → Groq (LLaMA 3.3) → posts (draft) → revisión → published
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Base de datos / Auth | Supabase (`@supabase/ssr`) |
| IA | Groq API — `llama-3.3-70b-versatile` |
| Scraping | `rss-parser` (RSS) + `cheerio` (HTML) |
| Estilos | Tailwind CSS v4 |
| Fuentes | Playfair Display · EB Garamond · Libre Franklin |

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crear `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
SCRAPE_SECRET=
AI_MOCK=false
```

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service role (solo server-side) |
| `GROQ_API_KEY` | API key de [console.groq.com](https://console.groq.com) (gratis, sin tarjeta) |
| `SCRAPE_SECRET` | Token Bearer para los endpoints `/api/scrape` y `/api/ai-pipeline` |
| `AI_MOCK=true` | Omite llamadas a Groq y genera posts de prueba localmente |

### 3. Correr en desarrollo

```bash
npm run dev
```

## Arquitectura

### Base de datos (Supabase)

| Tabla | Descripción |
|-------|-------------|
| `sources` | Portales configurados como fuente (RSS o selector HTML) |
| `raw_articles` | Artículos scrapeados en crudo |
| `categories` | Categorías de noticias |
| `posts` | Posts generados por IA (`status: draft \| published \| archived`) |
| `post_sources` | Relación N:N entre posts y raw_articles |
| `ai_run_logs` | Historial de ejecuciones del pipeline |

### Pipelines de IA

#### Pipeline principal (`/api/ai-pipeline`)
1. Fetch de `raw_articles` con `processed = false`
2. Llamada a Groq para agrupar artículos por tema
3. Por cada grupo, llamada a Groq para generar un post completo (título, slug, excerpt, content en markdown, tags, categoría)
4. Insert en `posts`, `post_sources`, marcar artículos como procesados, log en `ai_run_logs`

#### Digest diario (`/api/digest`)
1. Fetch de artículos scrapeados el día anterior
2. Llamada a Groq para generar un resumen narrativo del día
3. Incluye imágenes inline en el markdown
4. Guarda como `draft` en `posts`

### Endpoints HTTP

Ambos endpoints requieren `Authorization: Bearer <SCRAPE_SECRET>`.

```bash
# Ejecutar scraping
POST /api/scrape

# Ejecutar pipeline IA
POST /api/ai-pipeline

# Generar digest del día anterior
POST /api/digest
```

### Panel de administración (`/admin`)

Protegido por Supabase Auth. Incluye:
- CRUD de fuentes y categorías
- Gestión de posts (draft → published / archived)
- Viewer de `ai_run_logs`
- Botones manuales para scraping, pipeline IA y digest diario

### Frontend público

| Ruta | Descripción |
|------|-------------|
| `/` | Portada estilo broadsheet con nota principal y grilla de notas |
| `/posts/[slug]` | Artículo completo con contenido markdown renderizado |

## Desarrollo sin API key

Activar el modo mock para probar el flujo completo sin gastar tokens:

```env
AI_MOCK=true
```

El mock agrupa artículos en pares y genera posts de prueba usando el contenido real scrapeado, sin llamar a Groq.
