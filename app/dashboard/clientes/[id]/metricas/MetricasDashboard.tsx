'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

type Level = 'account' | 'campaign' | 'adset' | 'ad'
type ObjectiveKey = 'branding' | 'leads' | 'whatsapp' | 'sales'
type SortDir = 'asc' | 'desc'

interface Connection {
  id: string
  account_name: string
  account_id: string
  status: string
}

interface InsightRow {
  account_name: string
  campaign_name?: string
  adset_name?: string
  ad_name?: string
  spend?: string
  reach?: string
  impressions?: string
  clicks?: string
  currency?: string
  actions?: { action_type: string; value: string }[]
  action_values?: { action_type: string; value: string }[]
}

interface Props {
  clientId: string
  objectiveKey: ObjectiveKey
  connections: Connection[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAction(actions: InsightRow['actions'], ...types: string[]): number {
  for (const type of types) {
    const val = Number(actions?.find((a) => a.action_type === type)?.value ?? 0)
    if (val > 0) return val
  }
  return 0
}

function getActionVal(action_values: InsightRow['action_values'], ...types: string[]): number {
  for (const type of types) {
    const val = Number(action_values?.find((a) => a.action_type === type)?.value ?? 0)
    if (val > 0) return val
  }
  return 0
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function fmtMoney(n: number, currency: string) {
  if (n === 0) return '—'
  return currency === 'ARS' ? `$ ${fmt(n, 0)}` : `USD ${fmt(n, 2)}`
}

function fmtPct(n: number) { return n === 0 ? '—' : `${fmt(n, 2)}%` }
function fmtX(n: number)   { return n === 0 ? '—' : `${fmt(n, 2)}x` }
function fmtN(n: number)   { return n === 0 ? '—' : fmt(n) }

// ── Column definitions ────────────────────────────────────────────────────────

interface ColDef {
  key: string
  label: string
  getValue: (row: InsightRow) => number
  format: (n: number) => string
  isMoney?: boolean   // use fmtMoney(val, row.currency) at render time
  alwaysOn?: boolean
}

function buildCols(obj: ObjectiveKey): ColDef[] {
  const leadsValue = (row: InsightRow) =>
    getAction(row.actions, 'lead') +
    getAction(row.actions, 'onsite_conversion.messaging_conversation_started_7d', 'contact')

  const purchasesValue = (row: InsightRow) =>
    getAction(row.actions, 'purchase', 'offsite_conversion.fb_pixel_purchase')

  const purchaseVal = (row: InsightRow) =>
    getActionVal(row.action_values, 'purchase', 'offsite_conversion.fb_pixel_purchase')

  const base: ColDef[] = [
    {
      key: 'spend', label: 'Inversión', alwaysOn: true, isMoney: true,
      getValue: (r) => Number(r.spend ?? 0), format: fmtN,
    },
    {
      key: 'reach', label: 'Alcance',
      getValue: (r) => Number(r.reach ?? 0), format: fmtN,
    },
    {
      key: 'impressions', label: 'Impresiones',
      getValue: (r) => Number(r.impressions ?? 0), format: fmtN,
    },
    {
      key: 'clicks', label: 'Clics',
      getValue: (r) => Number(r.clicks ?? 0), format: fmtN,
    },
    {
      key: 'ctr', label: 'CTR',
      getValue: (r) => {
        const imp = Number(r.impressions ?? 0), cl = Number(r.clicks ?? 0)
        return imp > 0 ? (cl / imp) * 100 : 0
      },
      format: fmtPct,
    },
    {
      key: 'cpc', label: 'CPC', isMoney: true,
      getValue: (r) => {
        const s = Number(r.spend ?? 0), cl = Number(r.clicks ?? 0)
        return cl > 0 ? s / cl : 0
      },
      format: fmtN,
    },
    {
      key: 'cpm', label: 'CPM', isMoney: true,
      getValue: (r) => {
        const s = Number(r.spend ?? 0), imp = Number(r.impressions ?? 0)
        return imp > 0 ? (s / imp) * 1000 : 0
      },
      format: fmtN,
    },
  ]

  if (obj === 'leads' || obj === 'whatsapp') {
    return [...base,
      { key: 'leads', label: 'Leads', alwaysOn: true, getValue: leadsValue, format: fmtN },
      {
        key: 'cpl', label: 'CPL', alwaysOn: true, isMoney: true,
        getValue: (r) => { const l = leadsValue(r); return l > 0 ? Number(r.spend ?? 0) / l : 0 },
        format: fmtN,
      },
      {
        key: 'lead_conv', label: 'Conv.',
        getValue: (r) => { const cl = Number(r.clicks ?? 0); return cl > 0 ? (leadsValue(r) / cl) * 100 : 0 },
        format: fmtPct,
      },
    ]
  }

  if (obj === 'sales') {
    return [...base,
      { key: 'purchases', label: 'Ventas', alwaysOn: true, getValue: purchasesValue, format: fmtN },
      { key: 'purchase_value', label: 'Facturación', alwaysOn: true, isMoney: true, getValue: purchaseVal, format: fmtN },
      {
        key: 'roas', label: 'ROAS', alwaysOn: true,
        getValue: (r) => { const s = Number(r.spend ?? 0); return s > 0 ? purchaseVal(r) / s : 0 },
        format: fmtX,
      },
      {
        key: 'cpa', label: 'CPA', isMoney: true,
        getValue: (r) => { const p = purchasesValue(r); return p > 0 ? Number(r.spend ?? 0) / p : 0 },
        format: fmtN,
      },
    ]
  }

  if (obj === 'branding') {
    return [...base,
      { key: 'profile_visits', label: 'Visitas perfil', alwaysOn: true, getValue: (r) => getAction(r.actions, 'instagram_profile_visit'), format: fmtN },
      {
        key: 'cpv', label: 'Costo/visita', alwaysOn: true, isMoney: true,
        getValue: (r) => { const v = getAction(r.actions, 'instagram_profile_visit'); return v > 0 ? Number(r.spend ?? 0) / v : 0 },
        format: fmtN,
      },
      { key: 'page_likes', label: 'Seguidores', alwaysOn: true, getValue: (r) => getAction(r.actions, 'page_fan_adds', 'like'), format: fmtN },
      {
        key: 'cps', label: 'Costo/seguidor', alwaysOn: true, isMoney: true,
        getValue: (r) => { const l = getAction(r.actions, 'page_fan_adds', 'like'); return l > 0 ? Number(r.spend ?? 0) / l : 0 },
        format: fmtN,
      },
    ]
  }

  return base
}

// ── Aggregation ───────────────────────────────────────────────────────────────

interface Totals {
  spend: number; reach: number; impressions: number; clicks: number
  leads: number; messages: number; purchases: number; purchase_value: number
  landing_page_views: number; add_to_cart: number; initiate_checkout: number
  profile_visits: number; page_likes: number
}

function aggregateRows(rows: InsightRow[]): Totals {
  const t: Totals = {
    spend: 0, reach: 0, impressions: 0, clicks: 0,
    leads: 0, messages: 0, purchases: 0, purchase_value: 0,
    landing_page_views: 0, add_to_cart: 0, initiate_checkout: 0,
    profile_visits: 0, page_likes: 0,
  }
  for (const row of rows) {
    t.spend += Number(row.spend ?? 0)
    t.reach += Number(row.reach ?? 0)
    t.impressions += Number(row.impressions ?? 0)
    t.clicks += Number(row.clicks ?? 0)
    t.leads += getAction(row.actions, 'lead')
    t.messages += getAction(row.actions, 'onsite_conversion.messaging_conversation_started_7d', 'contact')
    t.purchases += getAction(row.actions, 'purchase', 'offsite_conversion.fb_pixel_purchase')
    t.purchase_value += getActionVal(row.action_values, 'purchase', 'offsite_conversion.fb_pixel_purchase')
    t.landing_page_views += getAction(row.actions, 'landing_page_view')
    t.add_to_cart += getAction(row.actions, 'add_to_cart', 'offsite_conversion.fb_pixel_add_to_cart')
    t.initiate_checkout += getAction(row.actions, 'initiate_checkout', 'offsite_conversion.fb_pixel_initiate_checkout')
    t.profile_visits += getAction(row.actions, 'instagram_profile_visit')
    t.page_likes += getAction(row.actions, 'page_fan_adds', 'like')
  }
  return t
}

function deriveMetrics(t: Totals) {
  const totalLeads = t.leads + t.messages
  return {
    totalLeads,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
    cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
    cpl: totalLeads > 0 ? t.spend / totalLeads : 0,
    roas: t.spend > 0 ? t.purchase_value / t.spend : 0,
    cpa: t.purchases > 0 ? t.spend / t.purchases : 0,
    ticket: t.purchases > 0 ? t.purchase_value / t.purchases : 0,
    cpv: t.profile_visits > 0 ? t.spend / t.profile_visits : 0,
    cps: t.page_likes > 0 ? t.spend / t.page_likes : 0,
    follower_conv: t.profile_visits > 0 ? (t.page_likes / t.profile_visits) * 100 : 0,
    lead_conv: t.clicks > 0 ? (totalLeads / t.clicks) * 100 : 0,
    lp_to_cart: t.landing_page_views > 0 ? (t.add_to_cart / t.landing_page_views) * 100 : 0,
    cart_to_checkout: t.add_to_cart > 0 ? (t.initiate_checkout / t.add_to_cart) * 100 : 0,
    checkout_to_purchase: t.initiate_checkout > 0 ? (t.purchases / t.initiate_checkout) * 100 : 0,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-blue-900/30 border border-blue-700/40' : 'bg-gray-900'}`}>
      <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold leading-none">{value}</p>
    </div>
  )
}

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: SortDir }) {
  if (col !== sortCol) return <span className="text-gray-700 ml-1 text-xs">↕</span>
  return <span className="text-blue-400 ml-1 text-xs">{sortDir === 'desc' ? '↓' : '↑'}</span>
}

// ── Column stripe colors ──────────────────────────────────────────────────────
// Two subtle alternating backgrounds applied per-column-index (not per-row)
const COL_BG = ['bg-gray-900', 'bg-[#12141c]']
// First col (name) is always neutral
const NAME_BG = 'bg-gray-900'

// ── Date presets ──────────────────────────────────────────────────────────────

function getDateRange(preset: string): { since: string; until: string } {
  const today = new Date()
  const pad = (d: Date) => d.toISOString().split('T')[0]
  if (preset === '7d') {
    const s = new Date(today); s.setDate(s.getDate() - 6)
    return { since: pad(s), until: pad(today) }
  }
  if (preset === '30d') {
    const s = new Date(today); s.setDate(s.getDate() - 29)
    return { since: pad(s), until: pad(today) }
  }
  if (preset === 'prev_month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const last = new Date(today.getFullYear(), today.getMonth(), 0)
    return { since: pad(first), until: pad(last) }
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  return { since: pad(first), until: pad(today) }
}

const PRESETS = [
  { key: 'month', label: 'Este mes' },
  { key: 'prev_month', label: 'Mes anterior' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: '7d', label: 'Últimos 7 días' },
]

const LEVELS: { key: Level; label: string }[] = [
  { key: 'account', label: 'Cuenta' },
  { key: 'campaign', label: 'Campaña' },
  { key: 'adset', label: 'Conjunto' },
  { key: 'ad', label: 'Anuncio' },
]

// ── Main component ────────────────────────────────────────────────────────────

export function MetricasDashboard({ clientId, objectiveKey, connections }: Props) {
  const cols = buildCols(objectiveKey)

  const initial = getDateRange('month')
  const [since, setSince] = useState(initial.since)
  const [until, setUntil] = useState(initial.until)
  const [activePreset, setActivePreset] = useState<string>('month')
  const [level, setLevel] = useState<Level>('account')
  const [rows, setRows] = useState<InsightRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiErrors, setApiErrors] = useState<string[] | null>(null)
  const [sortCol, setSortCol] = useState('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(cols.filter((c) => c.alwaysOn || ['reach', 'clicks', 'ctr', 'cpc'].includes(c.key)).map((c) => c.key))
  )
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async (s: string, u: string, lv: Level) => {
    setLoading(true)
    setApiErrors(null)
    try {
      const params = new URLSearchParams({ client_id: clientId, since: s, until: u, level: lv })
      const res = await fetch(`/api/meta/insights?${params}`)
      const json = await res.json()
      if (!res.ok) {
        setApiErrors([json.error ?? 'Error al consultar métricas'])
        setRows(null)
      } else {
        setRows(json.rows ?? [])
        if (json.errors) setApiErrors(json.errors)
      }
    } catch {
      setApiErrors(['Error de conexión'])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const scheduleFetch = useCallback((s: string, u: string, lv: Level) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchData(s, u, lv), 300)
  }, [fetchData])

  useEffect(() => {
    fetchData(since, until, level)
    initialFetchDone.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialFetchDone.current) return
    scheduleFetch(since, until, level)
  }, [since, until, level, scheduleFetch])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function applyPreset(key: string) {
    setActivePreset(key)
    const range = getDateRange(key)
    setSince(range.since)
    setUntil(range.until)
  }

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortCol(col); setSortDir('desc') }
  }

  function toggleCol(key: string) {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  // Derive primary currency from data (warn if mixed)
  const currencies = rows ? Array.from(new Set(rows.map((r) => r.currency ?? 'USD'))) : ['USD']
  const primaryCurrency = currencies[0] ?? 'USD'
  const mixedCurrencies = currencies.length > 1

  const M = (n: number) => fmtMoney(n, primaryCurrency)

  const totals = rows ? aggregateRows(rows) : null
  const derived = totals ? deriveMetrics(totals) : null
  const hasData = rows !== null && rows.length > 0

  const visibleColDefs = cols.filter((c) => visibleCols.has(c.key))
  const toggleableCols = cols.filter((c) => !c.alwaysOn)

  const sortedRows = rows
    ? [...rows].sort((a, b) => {
        const colDef = cols.find((c) => c.key === sortCol)
        if (!colDef) return 0
        return sortDir === 'desc' ? colDef.getValue(b) - colDef.getValue(a) : colDef.getValue(a) - colDef.getValue(b)
      })
    : []

  function getRowName(row: InsightRow): string {
    if (level === 'campaign') return row.campaign_name ?? '—'
    if (level === 'adset') return row.adset_name ?? '—'
    if (level === 'ad') return row.ad_name ?? '—'
    return row.account_name
  }

  return (
    <div className="space-y-5">

      {/* ── Filtros ── */}
      <div className="bg-gray-900 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Período</span>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => applyPreset(p.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${activePreset === p.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              {p.label}
            </button>
          ))}
          <span className="text-gray-700 mx-1">|</span>
          <input type="date" value={since}
            onChange={(e) => { setSince(e.target.value); setActivePreset('') }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
          <span className="text-gray-500 text-xs">→</span>
          <input type="date" value={until}
            onChange={(e) => { setUntil(e.target.value); setActivePreset('') }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" />
          {loading && <span className="text-xs text-gray-400 ml-2 animate-pulse">Actualizando...</span>}
        </div>

        <div className="flex gap-1">
          {LEVELS.map((l) => (
            <button key={l.key} onClick={() => setLevel(l.key)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${level === l.key ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cuentas ── */}
      <div className="flex gap-2 flex-wrap">
        {connections.map((c) => (
          <span key={c.id}
            className={`text-xs px-2.5 py-1 rounded-full ${c.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {c.account_name}
          </span>
        ))}
        {hasData && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">{primaryCurrency}</span>}
        {mixedCurrencies && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            Monedas mixtas: {currencies.join(' + ')}
          </span>
        )}
      </div>

      {apiErrors && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-400 text-sm">
          {apiErrors.join(' · ')}
        </div>
      )}

      {!loading && rows !== null && rows.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-10 text-center text-gray-500 text-sm">
          Sin datos para el período seleccionado.
        </div>
      )}

      {hasData && totals && derived && (
        <>
          {/* ── KPIs: Branding ── */}
          {objectiveKey === 'branding' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Inversión" value={M(totals.spend)} highlight />
                <KpiCard label="Alcance" value={fmtN(totals.reach)} />
                <KpiCard label="Impresiones" value={fmtN(totals.impressions)} />
                <KpiCard label="Clics en enlace" value={fmtN(totals.clicks)} />
                <KpiCard label="CTR" value={fmtPct(derived.ctr)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="CPC" value={M(derived.cpc)} />
                <KpiCard label="CPM" value={M(derived.cpm)} />
                <KpiCard label="Visitas al perfil" value={fmtN(totals.profile_visits)} highlight />
                <KpiCard label="Costo por visita" value={M(derived.cpv)} />
                <KpiCard label="Nuevos seguidores" value={fmtN(totals.page_likes)} highlight />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Costo por seguidor" value={M(derived.cps)} />
                <KpiCard label="Conv. a seguidor" value={fmtPct(derived.follower_conv)} />
              </div>
            </>
          )}

          {/* ── KPIs: Leads / WhatsApp ── */}
          {(objectiveKey === 'leads' || objectiveKey === 'whatsapp') && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Inversión" value={M(totals.spend)} highlight />
                <KpiCard label="Leads generados" value={fmtN(derived.totalLeads)} highlight />
                <KpiCard label="Costo por lead" value={M(derived.cpl)} highlight />
                <KpiCard label="Alcance" value={fmtN(totals.reach)} />
                <KpiCard label="Impresiones" value={fmtN(totals.impressions)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Clics en enlace" value={fmtN(totals.clicks)} />
                <KpiCard label="CTR" value={fmtPct(derived.ctr)} />
                <KpiCard label="CPC" value={M(derived.cpc)} />
                <KpiCard label="CPM" value={M(derived.cpm)} />
                <KpiCard label="Tasa conv. a lead" value={fmtPct(derived.lead_conv)} />
              </div>
            </>
          )}

          {/* ── KPIs: Ventas ── */}
          {objectiveKey === 'sales' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Inversión" value={M(totals.spend)} highlight />
                <KpiCard label="Facturación bruta" value={M(totals.purchase_value)} highlight />
                <KpiCard label="ROAS" value={fmtX(derived.roas)} highlight />
                <KpiCard label="CPA" value={M(derived.cpa)} />
                <KpiCard label="Ticket promedio" value={M(derived.ticket)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Alcance" value={fmtN(totals.reach)} />
                <KpiCard label="Impresiones" value={fmtN(totals.impressions)} />
                <KpiCard label="Clics" value={fmtN(totals.clicks)} />
                <KpiCard label="CTR" value={fmtPct(derived.ctr)} />
                <KpiCard label="CPC" value={M(derived.cpc)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="CPM" value={M(derived.cpm)} />
                <KpiCard label="Visitas landing" value={fmtN(totals.landing_page_views)} />
                <KpiCard label="Agg. al carrito" value={fmtN(totals.add_to_cart)} />
                <KpiCard label="Pagos iniciados" value={fmtN(totals.initiate_checkout)} />
                <KpiCard label="Ventas finalizadas" value={fmtN(totals.purchases)} highlight />
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Funnel de conversión</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { label: 'Click → Landing', num: totals.landing_page_views, den: totals.clicks },
                    { label: 'Landing → Carrito', num: totals.add_to_cart, den: totals.landing_page_views },
                    { label: 'Carrito → Checkout', num: totals.initiate_checkout, den: totals.add_to_cart },
                    { label: 'Checkout → Venta', num: totals.purchases, den: totals.initiate_checkout },
                  ].map(({ label, num, den }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-2xl font-bold">{den > 0 ? fmtPct((num / den) * 100) : '—'}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{fmt(num)} / {fmt(den)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Tabla ── */}
          {level !== 'account' && (
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {LEVELS.find((l) => l.key === level)?.label}s — {sortedRows.length} filas
                </p>
                {toggleableCols.length > 0 && (
                  <div className="relative" ref={colMenuRef}>
                    <button onClick={() => setColMenuOpen((o) => !o)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-1.5">
                      Columnas <span className="text-gray-500">▾</span>
                    </button>
                    {colMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 z-20 shadow-xl min-w-[180px] space-y-2">
                        {toggleableCols.map((col) => (
                          <label key={col.key} className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-white text-gray-300">
                            <input type="checkbox" checked={visibleCols.has(col.key)} onChange={() => toggleCol(col.key)} className="rounded" />
                            {col.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap border-collapse">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-800">
                      {/* Name col — always bg-gray-900 */}
                      <th className={`text-left px-5 py-3 font-medium ${NAME_BG} sticky left-0`}>
                        Nombre
                      </th>
                      {visibleColDefs.map((col, ci) => (
                        <th key={col.key} onClick={() => handleSort(col.key)}
                          className={`text-right px-4 py-3 font-medium cursor-pointer hover:text-gray-200 select-none ${COL_BG[ci % 2]}`}>
                          {col.label}
                          <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-800/40 hover:brightness-110 transition-all">
                        <td className={`px-5 py-3 font-medium max-w-[240px] truncate text-gray-100 ${NAME_BG} sticky left-0`}>
                          {getRowName(row)}
                        </td>
                        {visibleColDefs.map((col, ci) => {
                          const val = col.getValue(row)
                          const currency = row.currency ?? 'USD'
                          const display = val === 0
                            ? <span className="text-gray-600">—</span>
                            : col.isMoney
                              ? fmtMoney(val, currency)
                              : col.format(val)
                          return (
                            <td key={col.key}
                              className={`px-4 py-3 text-right tabular-nums text-gray-300 ${COL_BG[ci % 2]}`}>
                              {display}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Account level con múltiples cuentas */}
          {level === 'account' && connections.length > 1 && (
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Por cuenta</p>
              </div>
              {sortedRows.map((row, i) => (
                <div key={i}
                  className={`flex items-center justify-between px-5 py-3 border-b border-gray-800/40 text-sm ${COL_BG[i % 2]}`}>
                  <span className="font-medium text-gray-100">{row.account_name}</span>
                  <span className="font-bold tabular-nums">{fmtMoney(Number(row.spend ?? 0), row.currency ?? 'USD')}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
