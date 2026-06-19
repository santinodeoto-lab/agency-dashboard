import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from './Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [clientsResult, { data: profile }] = await Promise.all([
    supabase.from('clients').select('id, name, logo_url, status').eq('status', 'active').order('name'),
    supabase.from('profiles').select('agency_name, avatar_url').eq('id', user.id).single(),
  ])
  // If logo_url column missing, fall back without it
  const clients = clientsResult.error?.message?.includes('logo_url')
    ? (await supabase.from('clients').select('id, name, status').eq('status', 'active').order('name')).data
    : clientsResult.data

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar
        clients={clients ?? []}
        agencyName={profile?.agency_name}
        avatarUrl={profile?.avatar_url}
      />
      <main className="ml-52 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
