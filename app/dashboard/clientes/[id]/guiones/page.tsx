import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { GuionesEditor } from './GuionesEditor'
import { ShareGuionesButton } from './ShareGuionesButton'

export default async function GuionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: cliente } = await admin
    .from('clients')
    .select('name, creativos_url, share_token')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {cliente.name}</Link>
            <h1 className="text-2xl font-bold mt-1">Guiones · {cliente.name}</h1>
          </div>
          <ShareGuionesButton shareToken={cliente.share_token ?? null} />
        </div>
        <GuionesEditor clientId={id} creativosUrl={cliente.creativos_url ?? ''} />
      </div>
    </div>
  )
}
