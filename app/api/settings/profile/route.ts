import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { full_name, agency_name, avatar_url } = body

  // Try full update first (requires agency_name + avatar_url columns to exist)
  const fullUpdates: Record<string, string | null> = {}
  if (full_name !== undefined) fullUpdates.full_name = full_name
  if (agency_name !== undefined) fullUpdates.agency_name = agency_name
  if (avatar_url !== undefined) fullUpdates.avatar_url = avatar_url

  const { error } = await supabase.from('profiles').update(fullUpdates).eq('id', user.id)

  if (error) {
    // If new columns don't exist yet, fall back to updating only full_name
    if (error.message.includes('agency_name') || error.message.includes('avatar_url')) {
      const { error: fallbackError } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', user.id)

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        warning: 'Nombre guardado. Para guardar el nombre de agencia y foto de perfil, corré este SQL en Supabase:\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS agency_name TEXT;\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;',
      })
    }

    console.error('Profile update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
