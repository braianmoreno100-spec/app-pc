// src/app/reportes/page.tsx
import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

const API = 'http://localhost:8000'

const MESES = [
  '', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const MESES_CORTO = [
  '','ENE','FEB','MAR','ABR','MAY','JUN',
  'JUL','AGO','SEP','OCT','NOV','DIC'
]

const TIPO_COLOR: Record<string, string> = {
  inyeccion:         '#378add',
  soplado:           '#639922',
  linea_copro:       '#ef9f27',
  linea_orina:       '#8b5cf6',
  acondicionamiento: '#1D9E75',
}
const TIPO_LABEL: Record<string, string> = {
  inyeccion:         'Inyección',
  soplado:           'Soplado',
  linea_copro:       'L. Copro',
  linea_orina:       'L. Orina',
  acondicionamiento: 'Acondicionamiento',
}
const TIPO_ORDER = ['inyeccion','soplado','linea_copro','linea_orina','acondicionamiento']

function getOeeColor(v: number) {
  if (v < 65) return '#e24b4a'
  if (v < 75) return '#ef9f27'
  if (v < 85) return '#daa520'
  if (v < 95) return '#639922'
  return '#378add'
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-primary)', border: '0.5px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

interface DatosMes {
  mes:    number
  anio:   number
  tipos:  Record<string, { label: string; mensual: {mes: number; oee: number|null}[]; oee_mes: number|null }>
  mttr_mtbf: Record<string, { mttr: number; mtbf: number; disp: number }>
  desperdicios: Record<string, number>
  kg_mes: Record<string, number>
}

export default function ReportesPage() {
  const now    = new Date()
  const [mes,    setMes]    = useState(now.getMonth() + 1)
  const [anio,   setAnio]   = useState(now.getFullYear())
  const [datos,  setDatos]  = useState<DatosMes | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [error,  setError]  = useState('')

  async function cargar() {
    setLoading(true); setError('')
    try {
      const r = await fetch(`${API}/reportes/reporte-mensual/preview?mes=${mes}&anio=${anio}`)
      if (!r.ok) throw new Error(await r.text())
      setDatos(await r.json())
    } catch (e: any) {
      setError('No se pudieron cargar los datos del mes.')
    }
    setLoading(false)
  }

  async function exportarPptx() {
    setExportando(true)
    try {
      const r = await fetch(`${API}/reportes/reporte-mensual/pptx?mes=${mes}&anio=${anio}`)
      if (!r.ok) {
        const err = await r.json()
        alert('Error: ' + (err.detail || 'No se pudo generar el PPTX'))
        setExportando(false)
        return
      }
      const blob = await r.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Reporte_${MESES[mes]}_${anio}_Inverfarma.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al generar el PPTX. Verifica que el template esté en app/assets/')
    }
    setExportando(false)
  }

  useEffect(() => { cargar() }, [])

  // Preparar datos para gráficas
  const chartTendencia = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const punto: Record<string, any> = { mes: MESES_CORTO[m] }
    if (datos) {
      TIPO_ORDER.forEach(tk => {
        const p = datos.tipos[tk]?.mensual.find(x => x.mes === m)
        punto[tk] = p?.oee ?? null
      })
    }
    return punto
  })

  const chartMttr = datos
    ? Object.entries(datos.mttr_mtbf).map(([tk, v]) => ({
        tipo:  TIPO_LABEL[tk] ?? tk,
        mttr:  v.mttr,
        mtbf:  v.mtbf,
        disp:  v.disp,
        color: TIPO_COLOR[tk] ?? '#888',
      }))
    : []

  const chartDesp = datos
    ? Object.entries(datos.desperdicios)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([def, cant]) => ({ defecto: def.slice(0, 20), cantidad: cant }))
    : []

  const chartKg = datos
    ? Object.entries(datos.kg_mes).map(([k, v]) => ({
        maquina: k.replace('_', ' '),
        kg:      v,
      }))
    : []

  const selectStyle = {
    fontSize: 12, padding: '6px 10px',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', background: 'var(--bg-primary)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div className="card" style={{
        padding: '12px 16px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Reporte Mensual
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>
            Preview · Exportar PPTX estilo Inverfarma
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={mes}  onChange={e => setMes(Number(e.target.value))}  style={selectStyle}>
            {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={selectStyle}>
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={cargar} disabled={loading} style={{
            padding: '7px 14px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
            border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}>
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
          <button onClick={exportarPptx} disabled={exportando || !datos} style={{
            padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: 'none', borderRadius: 'var(--radius-sm)',
            background: datos ? '#2E7D32' : 'var(--bg-tertiary)',
            color: datos ? '#fff' : 'var(--text-hint)',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: exportando ? 0.7 : 1,
          }}>
            {exportando ? '⏳ Generando...' : '⬇ Exportar PPTX'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', background: 'rgba(226,75,74,0.08)',
          border: '0.5px solid rgba(226,75,74,0.3)', borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: '#e24b4a',
        }}>{error}</div>
      )}

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Cargando datos de {MESES[mes]} {anio}...
        </div>
      )}

      {datos && !loading && (
        <>
          {/* Cards OEE del mes por tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {TIPO_ORDER.map(tk => {
              const tipo = datos.tipos[tk]
              const oee  = tipo?.oee_mes
              const color = oee != null ? getOeeColor(oee) : 'var(--text-hint)'
              return (
                <div key={tk} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: TIPO_COLOR[tk] }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {TIPO_LABEL[tk]}
                    </span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 4 }}>
                    {oee != null ? `${oee.toFixed(1)}%` : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>OEE {MESES[mes]}</div>
                </div>
              )
            })}
          </div>

          {/* Tendencia OEE anual */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Tendencia OEE — {anio}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
              Promedio mensual por tipo de máquina
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 110]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {TIPO_ORDER.map(tk => (
                  <Line key={tk} type="monotone" dataKey={tk} name={TIPO_LABEL[tk]}
                    stroke={TIPO_COLOR[tk]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grid: MTTR/MTBF + Desperdicios */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* MTTR / MTBF */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                MTTR · MTBF · Disponibilidad
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                Por tipo de máquina — {MESES[mes]} {anio}
              </div>
              {chartMttr.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-hint)', padding: '20px 0', textAlign: 'center' }}>
                  Sin datos de paradas en el período
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {chartMttr.map(row => (
                    <div key={row.tipo} style={{
                      display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr',
                      gap: 8, alignItems: 'center', fontSize: 11,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{row.tipo}</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e24b4a' }}>{row.mttr.toFixed(1)}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-hint)' }}>MTTR min</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#378add' }}>{row.mtbf.toFixed(1)}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-hint)' }}>MTBF min</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: getOeeColor(row.disp) }}>{row.disp.toFixed(1)}%</div>
                        <div style={{ fontSize: 9, color: 'var(--text-hint)' }}>Disp.</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desperdicios */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Top Desperdicios
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                {MESES[mes]} {anio} · Top 8 por cantidad
              </div>
              {chartDesp.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-hint)', padding: '20px 0', textAlign: 'center' }}>
                  Sin registros de desperdicio
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartDesp} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="defecto" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} width={110} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cantidad" name="Cantidad" fill="#378add" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* kg procesados */}
          {chartKg.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Resina Transformada (kg procesados)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                Solo máquinas con peso_pieza configurado · {MESES[mes]} {anio}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartKg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="maquina" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}kg`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="kg" name="kg procesados" fill="#639922" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Nota exportación */}
          <div style={{
            padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)',
            background: 'rgba(46,125,50,0.06)', border: '0.5px solid rgba(46,125,50,0.25)',
            borderRadius: 'var(--radius-sm)',
          }}>
            ✅ El PPTX exportado incluye: portada Inverfarma · OEE por tipo · resina transformada ·
            desperdicios · MTTR/MTBF/disponibilidad · slide de cierre. El fondo y logo se toman
            del template original.
          </div>
        </>
      )}

      {!datos && !loading && !error && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            Selecciona mes y año para ver el preview
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
            Luego exporta el reporte completo en formato PPTX estilo Inverfarma
          </div>
        </div>
      )}
    </div>
  )
}