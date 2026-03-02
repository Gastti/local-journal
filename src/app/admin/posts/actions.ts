'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function publishPost(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase
    .from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/posts')
  revalidatePath(`/admin/posts/${id}`)
  redirect('/admin/posts')
}

export async function archivePost(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase.from('posts').update({ status: 'archived' }).eq('id', id)

  revalidatePath('/admin/posts')
  revalidatePath(`/admin/posts/${id}`)
  redirect('/admin/posts')
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))

  await supabase.from('posts').delete().eq('id', id)

  revalidatePath('/admin/posts')
  redirect('/admin/posts')
}
