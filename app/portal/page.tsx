import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, client_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Mi Portal</h1>
        <p className="text-gray-400">Bienvenido, {profile?.full_name ?? user.email}</p>
        <div className="mt-8 bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400">Tus métricas aparecerán aquí próximamente.</p>
        </div>
      </div>
    </div>
  )
}
