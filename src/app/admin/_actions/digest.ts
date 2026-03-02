'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { runDigestPipeline, type DigestResult } from '@/lib/digest-pipeline'

export async function digestAction(): Promise<DigestResult> {
  const supabase = createServiceClient()
  return runDigestPipeline(supabase)
}
