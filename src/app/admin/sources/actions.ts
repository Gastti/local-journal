'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSource(formData: FormData) {
  const supabase = await createClient()

  await supabase.from('sources').insert({
    name: String(formData.get('name')),
    url: String(formData.get('url')),
    rss_url: formData.get('rss_url') ? String(formData.get('rss_url')) : null,
    scrape_selector: formData.get('scrape_selector')
      ? String(formData.get('scrape_selector'))
      : null,
    is_active: formData.get('is_active') === 'on',
  })

  revalidatePath('/admin/sources')
}

export async function deleteSource(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase.from('sources').delete().eq('id', id)

  revalidatePath('/admin/sources')
}
