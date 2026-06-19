import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './SettingsForm'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, agency_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-200 mb-6">Configuración</h1>
      <SettingsForm
        profile={{
          id: user.id,
          email: user.email ?? '',
          full_name: profile?.full_name ?? null,
          agency_name: profile?.agency_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        }}
      />
    </div>
  )
}
