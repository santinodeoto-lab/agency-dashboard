import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { EditLinks } from './EditLinks'

// Parser CSV que respeta comillas, comas y saltos de línea dentro de celdas
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* ignore */ }
      else field += c
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

function sheetCsvUrl(url: string): string | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([^/]+)/)
  if (!idMatch) return null
  const gidMatch = url.match(/[#&?]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '833370368'
  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gid}`
}

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

  let rows: string[][] = []
  let fetchError = false
  if (cliente.guiones_url) {
    const csvUrl = sheetCsvUrl(cliente.guiones_url)
    if (csvUrl) {
      try {
        const res = await fetch(csvUrl, { cache: 'no-store' })
        if (res.ok) {
          const text = await res.text()
          rows = parseCSV(text).filter(r => r.some(c => c.trim() !== ''))
          // Recortar columnas totalmente vacías
          const maxCols = Math.max(...rows.map(r => r.length), 0)
          let lastCol = 0
          for (let c = 0; c < maxCols; c++) {
            if (rows.some(r => (r[c] ?? '').trim() !== '')) lastCol = c
          }
          rows = rows.map(r => r.slice(0, lastCol + 1))
        } else fetchError = true
      } catch { fetchError = true }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <Link href={`/dashboard/clientes/${id}`} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← {cliente.name}</Link>
            <h1 className="text-2xl font-bold mt-1">Guiones · {cliente.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {cliente.guiones_url && (
              <a href={cliente.guiones_url} target="_blank" rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Abrir en Drive ↗
              </a>
            )}
            <EditLinks clientId={id} guionesUrl={cliente.guiones_url ?? ''} creativosUrl={cliente.creativos_url ?? ''} />
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-auto" style={{ maxHeight: '70vh' }}>
            <table className="text-sm border-collapse">
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} className={ri === 0 ? 'bg-gray-800 sticky top-0 z-10' : ''}>
                    {r.map((cell, ci) => (
                      <td key={ci}
                        className={`border border-gray-800 px-3 py-2 align-top whitespace-pre-wrap min-w-[140px] ${ci === 0 ? 'font-semibold text-gray-300 bg-gray-800 sticky left-0 z-10 min-w-[120px]' : 'text-gray-200'} ${ri === 0 ? 'font-semibold text-white' : ''}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-10 text-center">
            <p className="text-gray-400">
              {fetchError ? 'No se pudo leer la planilla. Verificá que esté compartida como "cualquiera con el link".' : 'No hay planilla de guiones cargada para este cliente.'}
            </p>
          </div>
        )}

        {/* Subir creativos */}
        <div className="mt-5 flex justify-center">
          {cliente.creativos_url ? (
            <a href={cliente.creativos_url} target="_blank" rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
              📁 Subir creativos
            </a>
          ) : (
            <p className="text-xs text-gray-600">Sin carpeta de creativos cargada (editá los links arriba para agregarla).</p>
          )}
        </div>
      </div>
    </div>
  )
}
