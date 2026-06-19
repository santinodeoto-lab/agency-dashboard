import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const OBJETIVO_LABELS: Record<string, string> = {
  sales: 'Ventas',
  leads: 'Leads',
  whatsapp: 'WhatsApp',
  branding: 'Branding',
}

const OBJETIVO_COLORS: Record<string, string> = {
  sales: 'bg-blue-500/20 text-blue-400',
  leads: 'bg-purple-500/20 text-purple-400',
  whatsapp: 'bg-green-500/20 text-green-400',
  branding: 'bg-orange-500/20 text-orange-400',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  inactive: 'bg-red-500/20 text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  inactive: 'Inactivo',
}

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientes } = await supabase
    .from('clients')
    .select('*, campaign_objective_types(key, label)')
    .order('fee_amount', { ascending: false })

  const totalMensual = clientes?.reduce((sum, c) => sum + c.fee_amount, 0) ?? 0
  const activos = clientes?.filter(c => c.status === 'active').length ?? 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
              ← Panel Admin
            </Link>
            <h1 className="text-2xl font-bold mt-1">Clientes</h1>
          </div>
          <Link
            href="/dashboard/clientes/nuevo"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Nuevo cliente
          </Link>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total clientes</p>
            <p className="text-3xl font-bold mt-1">{clientes?.length ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Activos</p>
            <p className="text-3xl font-bold mt-1 text-green-400">{activos}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Ingresos mensuales</p>
            <p className="text-3xl font-bold mt-1">USD {totalMensual.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Próx. vencimiento</p>
            <p className="text-3xl font-bold mt-1">10 Jul</p>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="space-y-3">
          {clientes?.map((cliente) => {
            const objKey = cliente.campaign_objective_types?.key ?? ''
            return (
              <Link
                key={cliente.id}
                href={`/dashboard/clientes/${cliente.id}`}
                className="block bg-gray-900 hover:bg-gray-800 rounded-xl p-5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
                      {cliente.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{cliente.name}</p>
                      <p className="text-gray-400 text-sm">
                        {cliente.payment_condition === 'advance' ? 'Pago adelantado' : 'Pago vencido'} · Día {cliente.payment_due_day}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {objKey && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${OBJETIVO_COLORS[objKey] ?? 'bg-gray-700 text-gray-300'}`}>
                        {OBJETIVO_LABELS[objKey] ?? objKey}
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[cliente.status] ?? ''}`}>
                      {STATUS_LABELS[cliente.status] ?? cliente.status}
                    </span>
                    <p className="text-lg font-bold text-right min-w-[90px]">
                      USD {cliente.fee_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
