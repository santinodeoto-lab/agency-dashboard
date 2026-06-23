import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { GuionesEditor } from './GuionesEditor'

export default async function GuionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clients')
    .select('name, creativos_url')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {cliente.name}</Link>
          <h1 className="text-2xl font-bold mt-1">Guiones · {cliente.name}</h1>
        </div>
        <GuionesEditor clientId={id} creativosUrl={cliente.creativos_url ?? ''} />
      </div>
    </div>
  )
}
