// src/app/oee/page.tsx
import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

const API = 'http://localhost:8000'

interface PuntoTendencia {
  dia: string
  inyeccion: number | null
  soplado: number | null
  copro: number | null
  orina: number | null
}

interface EmpleadoOee {
  cedula: string
  nombre: string
  turnos: number
  oee_promedio: number
  disponibilidad_promedio: number
  rendimiento_promedio: number
  total_produccion: number
  bono: boolean
}

function getOeeColor(oee: number) {
  if (oee < 65) return '#e24b4a'
  if (oee < 75) return '#ef9f27'
  if (oee < 85) return '#daa520'
  if (oee < 95) return '#639922'
  return '#378add'
}

function getOeeLabel(oee: number) {
  if (oee < 65) return 'Inaceptable'
  if (oee < 75) return 'Regular'
  if (oee < 85) return 'Aceptable'
  if (oee < 95) return 'Buena'
  return 'World Class'
}

function hoy() { return new Date().toISOString().split('T')[0] }
function hace7dias() { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] }

const mesActual = new Date().getMonth() + 1
const anioActual = new Date().getFullYear()
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const desgloseDemo = [
  { maquina: 'Inyección 1', disponibilidad: 94.1, rendimiento: 98.2, calidad: 100.0, oee: 92.5 },
  { maquina: 'Soplado 1',   disponibilidad: 97.0, rendimiento: 99.1, calidad: 98.8,  oee: 95.2 },
  { maquina: 'L. Copro',    disponibilidad: 78.3, rendimiento: 91.0, calidad: 99.2,  oee: 72.1 },
  { maquina: 'L. Orina',    disponibilidad: 91.2, rendimiento: 95.8, calidad: 100.0, oee: 88.4 },
]

const SEMAFORO = [
  { label: 'World Class', rango: '≥ 95%',  color: '#378add' },
  { label: 'Buena',       rango: '85–95%', color: '#639922' },
  { label: 'Aceptable',   rango: '75–85%', color: '#daa520' },
  { label: 'Regular',     rango: '65–75%', color: '#ef9f27' },
  { label: 'Inaceptable', rango: '< 65%',  color: '#e24b4a' },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-primary)', border: '0.5px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{Number(p.value).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

function OeeResumenCard({ m }: { m: typeof desgloseDemo[0] }) {
  const color = getOeeColor(m.oee)
  const label = getOeeLabel(m.oee)
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.maquina}</div>
        <span className="badge" style={{ background: color + '22', color }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 10 }}>{m.oee.toFixed(1)}%</div>
      {[
        { label: 'Disponibilidad', val: m.disponibilidad, color: '#378add' },
        { label: 'Rendimiento',    val: m.rendimiento,    color: '#639922' },
        { label: 'Calidad',        val: m.calidad,        color: '#8b5cf6' },
      ].map(k => (
        <div key={k.label} style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
            <span>{k.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{k.val.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${k.val}%`, background: k.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── TAB OEE GENERAL ──
function TabOeeGeneral() {
  const [fechaInicio, setFechaInicio] = useState(hace7dias())
  const [fechaFin,    setFechaFin]    = useState(hoy())
  const [tendencia,   setTendencia]   = useState<PuntoTendencia[]>([])
  const [loading,     setLoading]     = useState(false)
  const [sinDatos,    setSinDatos]    = useState(false)

  async function cargarDatos() {
    setLoading(true); setSinDatos(false)
    try {
      const r = await fetch(`${API}/reportes/reporte/fechas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      if (!r.ok) throw new Error()
      const data = await r.json()
      const porFecha: Record<string, Record<string, number[]>> = {}
      data.forEach((t: any) => {
        const fecha = t.fecha?.slice(0, 10) ?? ''
        if (!fecha) return
        if (!porFecha[fecha]) porFecha[fecha] = { inyeccion: [], soplado: [], copro: [], orina: [] }
        const oee = Number(t.oee) || 0
        if (t.turno === 'A' && oee > 0) porFecha[fecha].inyeccion.push(oee)
        if (t.turno === 'B' && oee > 0) porFecha[fecha].soplado.push(oee)
      })
      const puntos: PuntoTendencia[] = Object.entries(porFecha)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([fecha, g]) => ({
          dia: fecha.slice(5),
          inyeccion: g.inyeccion.length ? g.inyeccion.reduce((a,b)=>a+b,0)/g.inyeccion.length : null,
          soplado:   g.soplado.length   ? g.soplado.reduce((a,b)=>a+b,0)/g.soplado.length     : null,
          copro:     g.copro.length     ? g.copro.reduce((a,b)=>a+b,0)/g.copro.length         : null,
          orina:     g.orina.length     ? g.orina.reduce((a,b)=>a+b,0)/g.orina.length         : null,
        }))
      setTendencia(puntos)
      if (puntos.length === 0) setSinDatos(true)
    } catch { setSinDatos(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const demoTendencia = [
    { dia: 'Lun', inyeccion: 91.2, soplado: 94.8, copro: 70.1, orina: 86.5 },
    { dia: 'Mar', inyeccion: 88.5, soplado: 96.1, copro: 68.4, orina: 89.2 },
    { dia: 'Mié', inyeccion: 93.1, soplado: 95.3, copro: 73.2, orina: 87.8 },
    { dia: 'Jue', inyeccion: 92.5, soplado: 95.2, copro: 72.1, orina: 88.4 },
    { dia: 'Vie', inyeccion: 90.8, soplado: 97.0, copro: 74.5, orina: 91.0 },
  ]

  const chartData = tendencia.length > 0 ? tendencia : demoTendencia

  const inputStyle = {
    fontSize: 11, padding: '5px 8px',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    background: 'var(--bg-primary)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtro */}
      <div className="card" style={{
        padding: '10px 16px', borderRadius: 'var(--radius-md)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {SEMAFORO.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
              {s.label} {s.rango}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
          <button onClick={cargarDatos} style={{
            fontSize: 11, padding: '5px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--text-primary)', border: 'none',
            color: 'var(--bg-primary)', fontWeight: 600,
          }}>
            {loading ? 'Cargando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      {sinDatos && (
        <div style={{
          background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          Sin datos reales en el rango — mostrando datos de referencia
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {desgloseDemo.map(m => <OeeResumenCard key={m.maquina} m={m} />)}
      </div>

      {/* Tendencia */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Tendencia OEE</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
          {fechaInicio} → {fechaFin}{sinDatos ? ' · demo' : ''}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[60,100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            <Line type="monotone" dataKey="inyeccion" name="Inyección" stroke="#639922" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="soplado"   name="Soplado"   stroke="#378add" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="copro"     name="L. Copro"  stroke="#ef9f27" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="orina"     name="L. Orina"  stroke="#8b5cf6" strokeWidth={2} dot={{ r:3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Desglose */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Desglose D × R × C</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Disponibilidad · Rendimiento · Calidad</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={desgloseDemo} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="maquina" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[60,100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="disponibilidad" name="Disponibilidad" fill="#378add" radius={[3,3,0,0]} />
            <Bar dataKey="rendimiento"    name="Rendimiento"    fill="#639922" radius={[3,3,0,0]} />
            <Bar dataKey="calidad"        name="Calidad"        fill="#8b5cf6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── TAB EMPLEADOS ──
function TabEmpleados() {
  const [mes,       setMes]       = useState(mesActual)
  const [anio,      setAnio]      = useState(anioActual)
  const [empleados, setEmpleados] = useState<EmpleadoOee[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [buscado,   setBuscado]   = useState(false)

  async function cargar() {
    setLoading(true); setError(''); setBuscado(true)
    try {
      const r = await fetch(`${API}/reportes/empleados-mes?mes=${mes}&anio=${anio}`)
      if (!r.ok) throw new Error()
      setEmpleados(await r.json())
    } catch { setError('No se pudieron cargar los datos.') }
    finally { setLoading(false) }
  }

  function exportarExcel() {
    const header = ['Cédula','Nombre','Turnos','OEE Promedio (%)','Disponibilidad (%)','Rendimiento (%)','Total Producción','Bono']
    const rows = empleados.map(e => [
      e.cedula, e.nombre, e.turnos,
      e.oee_promedio.toFixed(2), e.disponibilidad_promedio.toFixed(2),
      e.rendimiento_promedio.toFixed(2), e.total_produccion, e.bono ? 'SÍ' : 'NO'
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `OEE_empleados_${MESES[mes-1]}_${anio}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const conBono     = empleados.filter(e => e.bono).length
  const sinBono     = empleados.filter(e => !e.bono).length
  const oeePromedio = empleados.length > 0
    ? (empleados.reduce((a,e) => a + e.oee_promedio, 0) / empleados.length).toFixed(1) : '—'

  const selectStyle = {
    fontSize: 11, padding: '5px 8px',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', background: 'var(--bg-primary)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtro */}
      <div className="card" style={{
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>OEE por empleado</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mes</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={selectStyle}>
            {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Año</label>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={selectStyle}>
            {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={cargar} style={{
            fontSize: 11, padding: '5px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--text-primary)', border: 'none',
            color: 'var(--bg-primary)', fontWeight: 600,
          }}>
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
          {empleados.length > 0 && (
            <button onClick={exportarExcel} style={{
              fontSize: 11, padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              background: '#eaf3de', border: '0.5px solid #c0dd97',
              color: '#3b6d11', fontWeight: 600,
            }}>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          fontSize: 12, color: 'var(--text-muted)',
        }}>{error}</div>
      )}

      {/* Resumen */}
      {empleados.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total empleados',  val: empleados.length, color: 'var(--text-primary)' },
            { label: 'OEE promedio',     val: `${oeePromedio}%`, color: 'var(--text-primary)' },
            { label: 'Con bono ≥ 94%',  val: conBono, color: '#3b6d11' },
            { label: 'Sin bono < 94%',  val: sinBono, color: '#a32d2d' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      {buscado && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 70px 100px 100px 100px 80px',
            padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
            fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
          }}>
            <span>Empleado</span><span>OEE Prom.</span><span>Turnos</span>
            <span>Disponib.</span><span>Rendim.</span><span>Producción</span><span>Bono</span>
          </div>

          {loading && <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Cargando...</div>}

          {!loading && empleados.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              Sin turnos en {MESES[mes-1]} {anio}
            </div>
          )}

          {empleados.map((e, i) => {
            const color = getOeeColor(e.oee_promedio)
            return (
              <div key={e.cedula} className="animate-fade-in-up" style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 70px 100px 100px 100px 80px',
                padding: '12px 16px',
                borderBottom: i < empleados.length - 1 ? '0.5px solid var(--border)' : 'none',
                alignItems: 'center',
                background: e.bono ? 'rgba(99,153,34,0.06)' : 'transparent',
                animationDelay: `${i * 0.04}s`,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{e.nombre}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{e.cedula}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color }}>{e.oee_promedio.toFixed(1)}%</div>
                  <div className="progress-bar" style={{ height: 3, marginTop: 4 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(e.oee_promedio,100)}%`, background: color }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.turnos}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.disponibilidad_promedio.toFixed(1)}%</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.rendimiento_promedio.toFixed(1)}%</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.total_produccion.toLocaleString()}</span>
                <span className="badge" style={{
                  background: e.bono ? '#eaf3de' : '#fce8e8',
                  color: e.bono ? '#3b6d11' : '#a32d2d',
                }}>{e.bono ? 'Sí ✓' : 'No'}</span>
              </div>
            )
          })}
        </div>
      )}

      {!buscado && (
        <div className="card animate-fade-in" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Selecciona mes y año para consultar</div>
          <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>Bono se otorga con OEE promedio ≥ 94%</div>
        </div>
      )}

      {empleados.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          Bono con OEE ≥ 94% · {MESES[mes-1]} {anio}
        </div>
      )}
    </div>
  )
}

// ── VISTA PRINCIPAL ──
export default function OeePage() {
  const [tab, setTab] = useState<'general' | 'empleados'>('general')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'general',   label: 'OEE General',      desc: 'Por línea y tendencia' },
          { id: 'empleados', label: 'OEE por empleado', desc: 'Bono mensual' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            border: '0.5px solid',
            borderColor: tab === t.id ? 'var(--text-primary)' : 'var(--border)',
            background: tab === t.id ? 'var(--text-primary)' : 'var(--bg-primary)',
            color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
            transition: 'all var(--transition)',
          }}>
            <span>{t.label}</span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      <div className="page-enter">
        {tab === 'general'   && <TabOeeGeneral />}
        {tab === 'empleados' && <TabEmpleados />}
      </div>
    </div>
  )
}