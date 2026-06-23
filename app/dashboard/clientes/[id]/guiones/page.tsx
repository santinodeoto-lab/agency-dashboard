import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { GuionesView } from './GuionesView'

export default async function GuionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clients')
    .select('name, guiones_url, creativos_url')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  return (
    <GuionesView
      clientId={id}
      clientName={cliente.name}
      guionesUrl={cliente.guiones_url ?? null}
      creativosUrl={cliente.creativos_url ?? null}
    />
  )
}
