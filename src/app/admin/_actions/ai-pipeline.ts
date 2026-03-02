'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { runAIPipeline, type AIResult } from '@/lib/ai-pipeline'

export async function aiPipelineAction(): Promise<AIResult> {
  const supabase = createServiceClient()
  return runAIPipeline(supabase)
}
