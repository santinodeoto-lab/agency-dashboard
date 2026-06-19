import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const OBJETIVO_COLORS: Record<string, string> = {
  sales: 'bg-blue-500/20 text-blue-400',
  leads: 'bg-purple-500/20 text-purple-400',
  whatsapp: 'bg-green-500/20 text-green-400',
  branding: 'bg-orange-500/20 text-orange-400',
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clients')
    .select('*, campaign_objective_types(key, label)')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  const { data: logs } = await supabase
    .from('client_log_entries')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: notas } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', id)
    .order('updated_at', { ascending: false })

  const { data: metaConnections } = await supabase
    .from('ad_platform_connections')
    .select('id, account_name, account_id, status, token_expires_at')
    .eq('client_id', id)
    .eq('platform', 'meta')

  const objKey = cliente.campaign_objective_types?.key ?? ''

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href="/dashboard/clientes" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
              ← Clientes
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                {cliente.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold">{cliente.name}</h1>
              {objKey && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${OBJETIVO_COLORS[objKey] ?? 'bg-gray-700 text-gray-300'}`}>
                  {cliente.campaign_objective_types?.label}
                </span>
              )}
            </div>
          </div>
          <Link href={`/dashboard/clientes/${id}/editar`}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Editar
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Columna izquierda — ficha */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 mb-4">Ficha del cliente</h2>
              <div className="space-y-3">
                {cliente.company_name && (
                  <div>
                    <p className="text-xs text-gray-500">Empresa</p>
                    <p className="text-sm">{cliente.company_name}</p>
                  </div>
                )}
                {cliente.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm">{cliente.email}</p>
                  </div>
                )}
                {cliente.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="text-sm">{cliente.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Fee mensual</p>
                  <p className="text-lg font-bold">{cliente.fee_currency} {Number(cliente.fee_amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Condición de pago</p>
                  <p className="text-sm">{cliente.payment_condition === 'advance' ? 'Adelantado' : 'Mes vencido'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vencimiento</p>
                  <p className="text-sm">Día {cliente.payment_due_day} de cada mes</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <p className="text-sm capitalize">{cliente.status === 'active' ? 'Activo' : cliente.status === 'paused' ? 'Pausado' : 'Inactivo'}</p>
                </div>
              </div>
            </div>

            {/* Meta Ads */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Meta Ads</h2>
              {metaConnections && metaConnections.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {metaConnections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{conn.account_name}</p>
                        <p className="text-xs text-gray-500">act_{conn.account_id}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${conn.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {conn.status === 'active' ? 'Conectado' : 'Expirado'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3">Sin cuentas conectadas</p>
              )}
              <a href={`/api/meta/connect?client_id=${id}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                {metaConnections && metaConnections.length > 0 ? 'Reconectar / agregar cuenta' : 'Conectar Meta Ads'}
              </a>
            </div>

            {/* Links rápidos */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Módulos</h2>
              <div className="space-y-2">
                {[
                  { label: 'Métricas', href: `/dashboard/clientes/${id}/metricas` },
                  { label: 'Calculadora', href: `/dashboard/clientes/${id}/calculadora` },
                  { label: 'Investigación de mercado', href: `/dashboard/clientes/${id}/investigacion` },
                  { label: 'Tareas', href: `/dashboard/tareas?cliente=${id}` },
                ].map(link => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm">
                    <span>{link.label}</span>
                    <span className="text-gray-500">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha — bitácora y notas */}
          <div className="md:col-span-2 space-y-6">

            {/* Bitácora */}
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400">Bitácora</h2>
              </div>
              <LogForm clientId={id} />
              <div className="mt-4 space-y-3">
                {logs && logs.length > 0 ? logs.map(log => (
                  <div key={log.id} className="border-l-2 border-gray-700 pl-3">
                    <p className="text-sm">{log.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm">Sin entradas todavía.</p>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400">Notas</h2>
              </div>
              {notas && notas.length > 0 ? (
                <div className="space-y-3">
                  {notas.map(nota => (
                    <div key={nota.id} className="bg-gray-800 rounded-lg p-3">
                      {nota.title && <p className="text-sm font-medium mb-1">{nota.title}</p>}
                      <p className="text-sm text-gray-300">{nota.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Sin notas todavía.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogForm({ clientId }: { clientId: string }) {
  return (
    <form action={`/api/clientes/${clientId}/log`} method="POST" className="flex gap-2">
      <input
        name="content"
        placeholder="Agregar entrada a la bitácora..."
        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <button type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        +
      </button>
    </form>
  )
}
