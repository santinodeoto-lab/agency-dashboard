import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  // Try full save
  const { error } = await supabase.from('clients').update(body).eq('id', id)

  if (error) {
    console.error('Client update error:', error)
    // If objectives or logo_url column missing, retry without them
    if (error.message.includes('objectives') || error.message.includes('logo_url')) {
      const { objectives, logo_url, ...rest } = body
      const { error: fallbackError } = await supabase.from('clients').update(rest).eq('id', id)
      if (fallbackError) {
        console.error('Client update fallback error:', fallbackError)
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }
      return NextResponse.json({
        ok: true,
        warning: 'Guardado sin logo/objetivos. Corré el SQL de migración en Supabase.',
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
