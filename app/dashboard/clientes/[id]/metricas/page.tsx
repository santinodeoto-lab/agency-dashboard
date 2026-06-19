import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { MetricasDashboard } from './MetricasDashboard'

export default async function MetricasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clients')
    .select('name, objectives')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  const { data: connections } = await supabase
    .from('ad_platform_connections')
    .select('id, account_name, account_id, status')
    .eq('client_id', id)
    .eq('platform', 'meta')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objectiveKey = ((cliente as any).objectives?.[0]) ?? 'leads'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href={`/dashboard/clientes/${id}`}
            className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
            ← {cliente.name}
          </Link>
          <h1 className="text-2xl font-bold mt-1">Métricas · {cliente.name}</h1>
        </div>

        {!connections || connections.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-10 text-center">
            <p className="text-gray-400 mb-4">No hay cuentas de Meta Ads conectadas para este cliente.</p>
            <Link href={`/dashboard/clientes/${id}`}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Volver a conectar
            </Link>
          </div>
        ) : (
          <MetricasDashboard
            clientId={id}
            objectiveKey={objectiveKey as 'branding' | 'leads' | 'whatsapp' | 'sales'}
            connections={connections}
          />
        )}
      </div>
    </div>
  )
}
