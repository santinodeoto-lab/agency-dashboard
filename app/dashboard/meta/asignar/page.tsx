'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Account = { id: string; name: string }
type Client = { id: string; name: string }

export default function AsignarPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><p className="text-gray-400">Cargando...</p></div>}><AsignarContent /></Suspense>
}

function AsignarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const fromClient = searchParams.get('from_client') ?? ''
  const accountsParam = searchParams.get('accounts') ?? ''

  const [accounts, setAccounts] = useState<Account[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      const decoded = JSON.parse(Buffer.from(accountsParam, 'base64').toString())
      setAccounts(decoded)
      // Pre-asignar la cuenta al cliente que inició la conexión si solo hay una
      if (decoded.length === 1 && fromClient) {
        setAssignments({ [decoded[0].id]: fromClient })
      } else if (fromClient) {
        // Pre-asignar todas al cliente que inició (el usuario puede cambiarlas)
        const pre: Record<string, string> = {}
        decoded.forEach((a: Account) => { pre[a.id] = fromClient })
        setAssignments(pre)
      }
    } catch { setAccounts([]) }

    supabase.from('clients').select('id, name').eq('status', 'active').order('name').then(({ data }) => {
      setClients(data ?? [])
    })
  }, [accountsParam, fromClient])

  async function handleSave() {
    setSaving(true)
    const list = accounts
      .filter(a => assignments[a.id])
      .map(a => ({ account_id: a.id, account_name: a.name, client_id: assignments[a.id] }))

    const res = await fetch('/api/meta/save-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: list }),
    })

    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/dashboard/clientes'), 1500)
    } else {
      const err = await res.json()
      alert(err.error ?? 'Error al guardar')
      setSaving(false)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-2xl font-bold text-green-400 mb-2">¡Conexiones guardadas!</p>
        <p className="text-gray-400">Redirigiendo a clientes...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href="/dashboard/clientes" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Cancelar</Link>
          <h1 className="text-2xl font-bold mt-1">Asignar cuentas de Meta Ads</h1>
          <p className="text-gray-400 text-sm mt-1">Elegí a qué cliente pertenece cada cuenta publicitaria. Podés dejar sin asignar las que no uses.</p>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center">
            <p className="text-gray-400">No se encontraron cuentas activas.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {accounts.map(account => (
              <div key={account.id} className="bg-gray-900 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{account.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">act_{account.id}</p>
                  </div>
                  <select
                    value={assignments[account.id] ?? ''}
                    onChange={e => setAssignments(prev => ({ ...prev, [account.id]: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 min-w-[180px]"
                  >
                    <option value="">— Sin asignar —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || accounts.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar asignaciones'}
        </button>
      </div>
    </div>
  )
}
