import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { QuoteStatus } from './QuoteStatus'

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta Ads (Facebook e Instagram)', google: 'Google Ads', tiktok: 'TikTok Ads',
}

function fmtMoney(n: number | null, cur: string) {
  if (n == null) return '[A definir]'
  if (cur === 'ARS') return `$ ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
  return `${cur} ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const SERVICIOS = [
  ['Configuración & Auditoría', 'Configuración de Business Manager, verificación de dominio y setup de Pixel/API de Conversiones o conexión a WhatsApp.', 'Única (Inicio)'],
  ['Estrategia & Estructura', 'Diseño de campañas segmentadas por objetivos (Reconocimiento, Tráfico, Conversión) y embudo de ventas.', 'Semanal/Mensual'],
  ['Estructuración de Contenido', 'Guía y bajada estratégica del material necesario (formatos, textos persuasivos y llamados a la acción).', 'Semanal/Mensual'],
  ['Optimización Continua', 'Ajustes diarios de presupuestos, audiencias y A/B testing de creatividades para bajar costos (CPA/CPL).', 'Continua'],
  ['Reporte de Métricas', 'Informe detallado con los indicadores clave (KPIs) y análisis de resultados obtenidos.', 'Mensual'],
  ['Reunión de Estrategia', 'Sesión de 30-45 min para revisar resultados y planificar los objetivos del mes entrante.', 'Mensual'],
]

const CASOS = [
  { title: 'Maximización de Ventas y Retorno (ROI) — Caso 1', rows: [['Inversión Total (Ad Spend)', '215 USD'], ['Cantidad de Ventas', '170'], ['Ticket Promedio', '1.000 USD'], ['Facturación Total Generada', '170.000 USD'], ['ROAS', '790.6x'], ['ROI', '+78.900%']] },
  { title: 'Maximización de Ventas y Retorno (ROI) — Caso 2', rows: [['Inversión Total (Ad Spend)', '617 USD'], ['Facturación Total Generada', '26.272 USD'], ['ROAS', '42.5x'], ['ROI', '+4.158%']] },
  { title: 'Lead Generation vía WhatsApp', rows: [['Inversión Total (Ad Spend)', '202,06 USD'], ['Consultas Generadas', '2.951'], ['Costo por Consulta (Promedio)', '0,06 USD']] },
  { title: 'Tráfico y Crecimiento de Audiencia', rows: [['Inversión Total (Ad Spend)', '73,33 USD'], ['Visitas al Perfil', '2.951'], ['Nuevos Seguidores (IG)', '1.343'], ['Tasa de Conversión a Seguidor', '33,6%']] },
]

export default async function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: q } = await supabase.from('quotes').select('*').eq('id', id).single()
  if (!q) notFound()

  const fecha = new Date(q.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const platforms: string[] = q.platforms ?? []

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard/cotizaciones" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
          ← Cotizaciones
        </Link>
        <QuoteStatus id={q.id} status={q.status} />
      </div>

      <article className="bg-white text-gray-900 rounded-xl p-10 space-y-6 leading-relaxed">
        <header className="text-center border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold">🚀 Propuesta de Gestión de Paid Media</h1>
          <p className="text-gray-600 mt-1">Estandarización de Estrategia y Crecimiento Digital</p>
          <div className="text-sm text-gray-500 mt-4 space-y-0.5">
            <p>Preparado para: <strong>{q.client_name}{q.company_name ? ` — ${q.company_name}` : ''}</strong></p>
            <p>Fecha: {fecha}</p>
            <p>Consultor: {q.consultant ?? 'Santino De Oto'}</p>
          </div>
        </header>

        <section>
          <h2 className="font-bold text-lg mb-1">1. Objetivo General</h2>
          <p>El objetivo principal de esta colaboración es <strong>{q.objective ?? '[a definir]'}</strong> a través de una estrategia sólida de publicidad paga en {platforms.map(p => PLATFORM_LABELS[p] ?? p).join(', ') || 'el ecosistema digital'}, optimizando el retorno de inversión (ROI/ROAS).</p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">2. Plan de Servicios: Gestión Integral</h2>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-gray-100"><th className="text-left p-2 border border-gray-200">Servicio</th><th className="text-left p-2 border border-gray-200">Detalle</th><th className="text-left p-2 border border-gray-200">Frecuencia</th></tr></thead>
            <tbody>
              {SERVICIOS.map(([s, d, f]) => (
                <tr key={s}><td className="p-2 border border-gray-200 font-medium">{s}</td><td className="p-2 border border-gray-200 text-gray-600">{d}</td><td className="p-2 border border-gray-200 whitespace-nowrap">{f}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-1">3. Focos Estratégicos (El Embudo)</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li><strong>Fase 1 — Reconocimiento & Alcance:</strong> Impactar a nuevas personas para que conozcan {q.client_name}.</li>
            <li><strong>Fase 2 — Tráfico & Consideración:</strong> Dirigir interesados al sitio / perfil / WhatsApp para que evalúen la propuesta.</li>
            <li><strong>Fase 3 — Conversión:</strong> Campañas de venta directa o generación de contactos para cerrar el negocio.</li>
            <li><strong>Fase 4 — Remarketing (Opcional):</strong> Volver a impactar a quienes interactuaron pero no compraron/contactaron.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">4. Inversión y Honorarios</h2>
          <p className="text-sm text-gray-600 mb-2"><strong>A. Honorarios de Gestión (Service Fee)</strong> — Cubre estrategia, ejecución y optimización profesional.</p>
          <table className="w-full text-sm border-collapse mb-3">
            <tbody>
              <tr><td className="p-2 border border-gray-200 font-medium">Fee de Gestión Paid Media</td><td className="p-2 border border-gray-200 font-bold text-right">{fmtMoney(q.fee_amount, q.fee_currency)}</td></tr>
            </tbody>
          </table>
          {q.discount_note && <p className="text-sm text-gray-500 italic mb-2">{q.discount_note}</p>}
          <p className="text-sm text-gray-600"><strong>B. Inversión en Medios (Ad Spend)</strong> — Monto que se paga directamente a las plataformas por la difusión.</p>
          <ul className="list-disc pl-5 text-sm text-gray-700 mt-1">
            <li>Sugerencia de inversión mínima: <strong>{fmtMoney(q.ad_spend_suggestion, q.ad_spend_currency)}</strong> mensual.</li>
            <li className="text-gray-500 italic">Este presupuesto es administrado por el cliente.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-1">5. Términos y Condiciones</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li><strong>Duración sugerida:</strong> ciclo inicial de 3 meses para estabilizar el rendimiento.</li>
            <li><strong>Propiedad de cuentas:</strong> todas las cuentas publicitarias y activos pertenecen al cliente; nosotros solo gestionamos los accesos.</li>
            <li><strong>Forma de pago:</strong> los honorarios se abonan por adelantado dentro de los primeros 10 días del mes.</li>
            <li><strong>Revisión de alcance:</strong> si se agregan nuevos canales o funcionalidades, la cotización será revisada.</li>
            <li><strong>Validez de la propuesta:</strong> {q.validity_days} días hábiles desde su envío.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-1">6. Próximos Pasos</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
            <li>Aceptación formal de esta propuesta.</li>
            <li>Reunión de kick-off para definir accesos y activos digitales.</li>
            <li>Inicio de la fase de configuración y lanzamiento de las primeras campañas.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">7. Casos de Éxito</h2>
          <div className="space-y-4">
            {CASOS.map(c => (
              <div key={c.title}>
                <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {c.rows.map(([m, r]) => (
                      <tr key={m}><td className="p-2 border border-gray-200">{m}</td><td className="p-2 border border-gray-200 font-bold text-right">{r}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}
