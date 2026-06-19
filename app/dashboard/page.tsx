import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const OBJECTIVE_COLORS: Record<string, string> = {
  sales:    'bg-blue-500/20 text-blue-400',
  leads:    'bg-purple-500/20 text-purple-400',
  whatsapp: 'bg-green-500/20 text-green-400',
  branding: 'bg-orange-500/20 text-orange-400',
}

const OBJECTIVE_LABELS: Record<string, string> = {
  sales: 'Ventas', leads: 'Leads', whatsapp: 'WhatsApp', branding: 'Branding',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: clientes } = await supabase
    .from('clients')
    .select('id, name, status, fee_amount, fee_currency, objectives, logo_url')
    .eq('status', 'active')
    .order('name')

  // Fallback if new columns not in schema cache yet
  if (!clientes) {
    const fallback = await supabase
      .from('clients')
      .select('id, name, status, fee_amount, fee_currency')
      .eq('status', 'active')
      .order('name')
    clientes = fallback.data
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-200 mb-6">Clientes activos</h1>

      {(!clientes || clientes.length === 0) && (
        <p className="text-gray-500 text-sm">No hay clientes activos.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {clientes?.map((cliente) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const objKey = ((cliente as any).objectives?.[0]) ?? ''
          return (
            <Link
              key={cliente.id}
              href={`/dashboard/clientes/${cliente.id}`}
              className="group bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 flex flex-col items-center gap-3 transition-colors border border-transparent hover:border-gray-700"
            >
              <div className="w-16 h-16 rounded-full bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center text-2xl font-bold text-white transition-colors flex-shrink-0">
                {cliente.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white leading-tight">{cliente.name}</p>
                {objKey && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${OBJECTIVE_COLORS[objKey] ?? 'bg-gray-700 text-gray-400'}`}>
                    {OBJECTIVE_LABELS[objKey] ?? objKey}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
