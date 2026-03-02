# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Local Journal is an AI-automated local news digest. It scrapes local news portals, groups articles by topic, and generates full posts using Claude. The content flow is:

```
RSS / Scraping → raw_articles → Claude API → posts (draft) → revisión → published
```

## Stack

- **Frontend:** Next.js with App Router and TypeScript
- **Backend/DB/Auth:** Supabase (`@supabase/ssr`)
- **AI:** Claude API (Anthropic) — used to group raw articles and generate post content
- **Scraping:** `rss-parser` for RSS feeds, `cheerio` for HTML scraping
- **Automation:** Supabase Edge Functions (cron, once daily)

## Development Commands

```bash
npm install
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

## Architecture

### Database Schema (`types/database.ts`)

All DB types live in `types/database.ts`. Key tables:

| Type | Table | Notes |
|------|-------|-------|
| `Source` | `sources` | News portals; has `rss_url` and/or `scrape_selector` |
| `RawArticle` | `raw_articles` | Scraped articles; `processed: boolean` controls the queue |
| `Post` | `posts` | AI-generated articles; `status: 'draft' \| 'published' \| 'archived'` |
| `PostSource` | `post_sources` | N:N join between `posts` and `raw_articles` |
| `AIRunLog` | `ai_run_logs` | Cron execution history with status and error info |
| `Category` | `categories` | News categories with slug and optional color |

### AI Processing Logic

The core AI pipeline (Etapa 4):
1. Fetch all `raw_articles` where `processed = false`
2. Send to Claude to group by topic
3. For each group, generate a full post: `title`, `slug`, `excerpt`, `content` (markdown), `category_id`, `tags`
4. Save to `posts` with `status = 'draft'`
5. Populate `post_sources`, mark raw articles as `processed = true`, log to `ai_run_logs`

### Admin Panel (`/admin`)

Protected route (Supabase Auth). Covers:
- CRUD for sources and categories
- Post list with status management (draft → publish/archive)
- `ai_run_logs` viewer
- Manual trigger for the cron pipeline

### Supabase Edge Functions

Used for the automated daily cron that chains scraping → AI generation. Also callable manually from the admin panel.

## UI Development

For all UI work (pages, components, layouts, styling), use the `/frontend-design` skill. This ensures consistent, high-quality design following the broadsheet European aesthetic.

## Current State

Etapa 1 complete. Next.js initialized, Supabase SSR configured, auth pages created. Working on Etapa 2 (Admin Panel).
