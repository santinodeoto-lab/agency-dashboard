'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Payment = {
  id: string
  amount: number
  currency: string
  due_date: string
  paid_date: string | null
  status: string
  month_reference: string
  notes: string | null
  clients: {
    id: string
    name: string
    payment_condition: string
  }
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  overdue: 'bg-red-500/20 text-red-400',
}

function getEffectiveStatus(payment: Payment): string {
  if (payment.status === 'paid') return 'paid'
  const today = new Date()
  const due = new Date(payment.due_date)
  if (due < today) return 'overdue'
  return 'pending'
}

export default function FinanzasPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState('2026-07-01')
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadPayments(mesRef: string) {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*, clients(id, name, payment_condition)')
      .eq('month_reference', mesRef)
      .order('due_date', { ascending: true })
    setPayments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadPayments(mes) }, [mes])

  async function togglePaid(payment: Payment) {
    setUpdating(payment.id)
    const newStatus = payment.status === 'paid' ? 'pending' : 'paid'
    await fetch(`/api/pagos/${payment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await loadPayments(mes)
    setUpdating(null)
  }

  const paymentsWithStatus = payments.map(p => ({ ...p, effectiveStatus: getEffectiveStatus(p) }))
  const cobrado = paymentsWithStatus.filter(p => p.effectiveStatus === 'paid').reduce((s, p) => s + p.amount, 0)
  const pendiente = paymentsWithStatus.filter(p => p.effectiveStatus === 'pending').reduce((s, p) => s + p.amount, 0)
  const vencido = paymentsWithStatus.filter(p => p.effectiveStatus === 'overdue').reduce((s, p) => s + p.amount, 0)
  const total = paymentsWithStatus.reduce((s, p) => s + p.amount, 0)

  const MESES = [
    { value: '2026-07-01', label: 'Julio 2026' },
    { value: '2026-06-01', label: 'Junio 2026' },
    { value: '2026-05-01', label: 'Mayo 2026' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Panel Admin</Link>
            <h1 className="text-2xl font-bold mt-1">Finanzas</h1>
          </div>
          <select
            value={mes}
            onChange={e => setMes(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Total del mes</p>
            <p className="text-2xl font-bold mt-1">USD {total.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Cobrado</p>
            <p className="text-2xl font-bold mt-1 text-green-400">USD {cobrado.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Pendiente</p>
            <p className="text-2xl font-bold mt-1 text-yellow-400">USD {pendiente.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Vencido</p>
            <p className="text-2xl font-bold mt-1 text-red-400">USD {vencido.toLocaleString()}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        {total > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progreso de cobros</span>
              <span>{Math.round((cobrado / total) * 100)}% cobrado</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(cobrado / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de pagos */}
        {loading ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : (
          <div className="space-y-3">
            {paymentsWithStatus.map(payment => (
              <div key={payment.id} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                    {payment.clients?.name?.charAt(0)}
                  </div>
                  <div>
                    <Link href={`/dashboard/clientes/${payment.clients?.id}`}
                      className="font-semibold hover:text-blue-400 transition-colors">
                      {payment.clients?.name}
                    </Link>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {payment.clients?.payment_condition === 'advance' ? 'Adelantado' : 'Mes vencido'}
                      {' · '}Vence {new Date(payment.due_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      {payment.paid_date && ` · Pagado ${new Date(payment.paid_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[payment.effectiveStatus]}`}>
                    {STATUS_LABELS[payment.effectiveStatus]}
                    {payment.effectiveStatus === 'overdue' && (() => {
                      const days = Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))
                      return ` (${days}d)`
                    })()}
                  </span>
                  <p className="font-bold text-lg min-w-[80px] text-right">
                    {payment.currency} {Number(payment.amount).toLocaleString()}
                  </p>
                  <button
                    onClick={() => togglePaid(payment)}
                    disabled={updating === payment.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      payment.status === 'paid'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {updating === payment.id ? '...' : payment.status === 'paid' ? 'Desmarcar' : 'Marcar pagado'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
