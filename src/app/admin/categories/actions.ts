'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const name = String(formData.get('name'))
  const slug = String(formData.get('slug')) || name.toLowerCase().replace(/\s+/g, '-')

  await supabase.from('categories').insert({
    name,
    slug,
    description: formData.get('description') ? String(formData.get('description')) : null,
    color: formData.get('color') ? String(formData.get('color')) : null,
  })

  revalidatePath('/admin/categories')
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase.from('categories').delete().eq('id', id)

  revalidatePath('/admin/categories')
}
