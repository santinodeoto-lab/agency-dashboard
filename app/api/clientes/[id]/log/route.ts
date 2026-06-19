import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const formData = await request.formData()
  const content = formData.get('content')?.toString().trim()
  if (!content) return NextResponse.redirect(new URL(`/dashboard/clientes/${id}`, request.url))

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()

  await supabase.from('client_log_entries').insert({
    client_id: id,
    content,
    created_by: profile?.id,
  })

  return NextResponse.redirect(new URL(`/dashboard/clientes/${id}`, request.url))
}
