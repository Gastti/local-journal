'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { runScraper, type ScrapeResult } from '@/lib/scraper'

export async function scrapeAction(): Promise<ScrapeResult> {
  const supabase = createServiceClient()
  return runScraper(supabase)
}
