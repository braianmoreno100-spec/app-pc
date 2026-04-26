// src/app/mantenimiento/page.tsx
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const API = 'http://localhost:8000'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['','ENE','FEB','MAR','ABR','MAY','JUN',
                     'JUL','AGO','SEP','OCT','NOV','DIC']

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
  acondicionamiento: 'Acond.',
}

interface MaquinaStats {
  tipo_key:      string
  tipo_maquina:  string
  numero_maquina:string
  label:         string
  color:         string
  mttr:          number
  mtbf:          number
  disponibilidad:number
  n_paradas:     number
  min_paradas:   number
  top_causas:    { descripcion: string; minutos: number; ocurrencias: number }[]
  tendencia:     { mes: number; mttr: number; mtbf: number; disp: number }[]
}

function getDispColor(d: number) {
  if (d >= 95) return '#378add'
  if (d >= 85) return '#639922'
  if (d >= 75) return '#daa520'
  if (d >= 65) return '#ef9f27'
  return '#e24b4a'
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:'var(--bg-primary)', border:'0.5px solid var(--border)',
      borderRadius:8, padding:'10px 14px', fontSize:12,
    }}>
      <div style={{fontWeight:600, marginBottom:6, color:'var(--text-primary)'}}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{display:'flex', justifyContent:'space-between', gap:16, color:p.color}}>
          <span>{p.name}</span>
          <span style={{fontWeight:600}}>{typeof p.value==='number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Card KPI individual ───────────────────────────────────────────────────────
function KpiCard({ label, value, unit, color, sub }: {
  label: string; value: string; unit: string; color: string; sub?: string
}) {
  return (
    <div className="card" style={{padding:'12px 14px'}}>
      <div style={{fontSize:10, color:'var(--text-muted)', fontWeight:600,
                   textTransform:'uppercase', marginBottom:4}}>{label}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:4}}>
        <span style={{fontSize:22, fontWeight:700, color}}>{value}</span>
        <span style={{fontSize:11, color:'var(--text-muted)'}}>{unit}</span>
      </div>
      {sub && <div style={{fontSize:10, color:'var(--text-hint)', marginTop:2}}>{sub}</div>}
    </div>
  )
}

// ── Drawer detalle máquina ────────────────────────────────────────────────────
function DrawerMaquina({ maq, open, onClose }: {
  maq: MaquinaStats | null; open: boolean; onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!maq) return null

  const tendenciaData = maq.tendencia.map(t => ({
    mes:  MESES_CORTO[t.mes] ?? String(t.mes),
    MTTR: t.mttr,
    MTBF: t.mtbf,
    Disp: t.disp,
  }))

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:100,
        background:'rgba(0,0,0,0.45)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition:'opacity 0.25s',
      }} />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, zIndex:101,
        width:440, background:'var(--bg-primary)',
        borderLeft:'0.5px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display:'flex', flexDirection:'column', overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{
          padding:'16px 20px', borderBottom:'0.5px solid var(--border)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, background:'var(--bg-primary)', zIndex:1,
        }}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{width:10, height:10, borderRadius:'50%', background:maq.color}} />
              <span style={{fontSize:14, fontWeight:600, color:'var(--text-primary)'}}>{maq.label}</span>
            </div>
            <div style={{fontSize:11, color:'var(--text-muted)', marginTop:2}}>
              Detalle de mantenimiento
            </div>
          </div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:6,
            border:'0.5px solid var(--border)', background:'var(--bg-secondary)',
            color:'var(--text-muted)', fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>

        <div style={{padding:16, display:'flex', flexDirection:'column', gap:16}}>

          {/* KPIs */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
            <KpiCard label="MTTR" value={maq.mttr.toFixed(1)} unit="min"
                     color="#e24b4a" sub="Tiempo medio reparar" />
            <KpiCard label="MTBF" value={maq.mtbf.toFixed(1)} unit="min"
                     color="#378add" sub="Tiempo medio entre fallas" />
            <KpiCard label="Disponib." value={`${maq.disponibilidad.toFixed(1)}`} unit="%"
                     color={getDispColor(maq.disponibilidad)} sub="Del período" />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <KpiCard label="N° Paradas" value={String(maq.n_paradas)} unit="eventos"
                     color="var(--text-primary)" />
            <KpiCard label="Min. paradas" value={String(maq.min_paradas)} unit="min"
                     color="#ef9f27" />
          </div>

          {/* Tendencia histórica */}
          {tendenciaData.length > 0 && (
            <div className="card" style={{padding:'14px 16px'}}>
              <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:12}}>
                Tendencia histórica
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{fontSize:9, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:9, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Line type="monotone" dataKey="MTTR" stroke="#e24b4a" strokeWidth={2} dot={{r:3}} connectNulls />
                  <Line type="monotone" dataKey="MTBF" stroke="#378add" strokeWidth={2} dot={{r:3}} connectNulls />
                  <Line type="monotone" dataKey="Disp" stroke="#639922"  strokeWidth={2} dot={{r:3}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top causas */}
          {maq.top_causas.length > 0 && (
            <div className="card" style={{overflow:'hidden'}}>
              <div style={{
                padding:'10px 14px', borderBottom:'0.5px solid var(--border)',
                fontSize:12, fontWeight:600, color:'var(--text-primary)',
              }}>
                Top causas de parada
              </div>
              {maq.top_causas.map((c, i) => (
                <div key={i} style={{
                  padding:'9px 14px', alignItems:'center',
                  borderBottom: i < maq.top_causas.length-1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                    <span style={{fontSize:11, color:'var(--text-primary)'}}>{c.descripcion}</span>
                    <span style={{fontSize:11, fontWeight:600, color:'#e24b4a'}}>{c.minutos} min</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{flex:1, height:4, background:'var(--bg-tertiary)', borderRadius:2, marginRight:10}}>
                      <div style={{
                        height:'100%', borderRadius:2, background:'#e24b4a',
                        width:`${Math.min((c.minutos / (maq.top_causas[0]?.minutos || 1)) * 100, 100)}%`,
                        transition:'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{fontSize:10, color:'var(--text-muted)', flexShrink:0}}>
                      {c.ocurrencias} vez{c.ocurrencias !== 1 ? 'ces' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function MantenimientoPage() {
  const now    = new Date()
  const hoy    = now.toISOString().split('T')[0]
  const hace30 = new Date(Date.now() - 30*86400000).toISOString().split('T')[0]

  const [modo,        setModo]        = useState<'fechas'|'mes'>('mes')
  const [fechaInicio, setFechaInicio] = useState(hace30)
  const [fechaFin,    setFechaFin]    = useState(hoy)
  const [mes,         setMes]         = useState(now.getMonth() + 1)
  const [anio,        setAnio]        = useState(now.getFullYear())
  const [maquinas,    setMaquinas]    = useState<MaquinaStats[]>([])
  const [loading,     setLoading]     = useState(false)
  const [buscado,     setBuscado]     = useState(false)
  const [drawerMaq,   setDrawerMaq]   = useState<MaquinaStats | null>(null)

  async function cargar() {
    setLoading(true); setBuscado(true)
    let fi = fechaInicio, ff = fechaFin
    if (modo === 'mes') {
      const ultimo = new Date(anio, mes, 0).getDate()
      fi = `${anio}-${String(mes).padStart(2,'0')}-01`
      ff = `${anio}-${String(mes).padStart(2,'0')}-${String(ultimo).padStart(2,'0')}`
    }
    try {
      const r = await fetch(`${API}/reportes/mantenimiento/datos?fecha_inicio=${fi}&fecha_fin=${ff}`)
      if (!r.ok) throw new Error()
      const data = await r.json()
      setMaquinas(data)
    } catch {
      setMaquinas([])
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  // Datos para comparativa radar
  const radarData = maquinas.length > 0
    ? maquinas.map(m => ({
        maquina:    m.label,
        Disponib:   Math.min(m.disponibilidad, 100),
        MTBF_norm:  Math.min((m.mtbf / 300) * 100, 100), // normalizar a 100
        Paradas_inv:Math.max(0, 100 - Math.min(m.n_paradas * 5, 100)),
      }))
    : []

  // Datos para comparativa barras
  const barMttr = maquinas.map(m => ({ maquina: m.label, MTTR: m.mttr, color: m.color }))
  const barMtbf = maquinas.map(m => ({ maquina: m.label, MTBF: m.mtbf, color: m.color }))
  const barDisp = maquinas.map(m => ({ maquina: m.label, Disponibilidad: m.disponibilidad, color: m.color }))

  const inputStyle = {
    fontSize:12, padding:'6px 10px',
    border:'0.5px solid var(--border)', borderRadius:'var(--radius-sm)',
    color:'var(--text-primary)', background:'var(--bg-primary)',
  }
  const selectStyle = { ...inputStyle }

  // Totales globales
  const totalParadas  = maquinas.reduce((s, m) => s + m.n_paradas, 0)
  const totalMinPar   = maquinas.reduce((s, m) => s + m.min_paradas, 0)
  const dispPromedio  = maquinas.length > 0
    ? maquinas.reduce((s, m) => s + m.disponibilidad, 0) / maquinas.length : 0
  const mttrPromedio  = maquinas.length > 0
    ? maquinas.reduce((s, m) => s + m.mttr, 0) / maquinas.length : 0

  // Agrupar máquinas por tipo canónico
  const GRUPO_ORDER = ['inyeccion','soplado','linea','acondicionamiento']
  const GRUPO_LABEL: Record<string, string> = {
    inyeccion:         'Inyección',
    soplado:           'Soplado',
    linea:             'Líneas de empaque',
    acondicionamiento: 'Acondicionamiento',
  }
  const GRUPO_COLOR: Record<string, string> = {
    inyeccion:         '#378add',
    soplado:           '#639922',
    linea:             '#ef9f27',
    acondicionamiento: '#1D9E75',
  }

  const grupos: Record<string, MaquinaStats[]> = {}
  maquinas.forEach(m => {
    const g = m.tipo_maquina === 'linea' ? 'linea' : m.tipo_maquina
    if (!grupos[g]) grupos[g] = []
    grupos[g].push(m)
  })
  // Ordenar máquinas dentro de cada grupo por número
  Object.values(grupos).forEach(arr =>
    arr.sort((a, b) => Number(a.numero_maquina) - Number(b.numero_maquina))
  )

  return (
    <div style={{display:'flex', flexDirection:'column', gap:16}}>

      {/* Header */}
      <div className="card" style={{
        padding:'12px 16px', display:'flex',
        justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10,
      }}>
        <div>
          <span style={{fontSize:14, fontWeight:600, color:'var(--text-primary)'}}>Mantenimiento</span>
          <span style={{fontSize:11, color:'var(--text-muted)', marginLeft:10}}>
            MTTR · MTBF · Disponibilidad · Causas de parada
          </span>
        </div>

        {/* Controles */}
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          {/* Toggle modo */}
          <div style={{display:'flex', borderRadius:'var(--radius-sm)', overflow:'hidden', border:'0.5px solid var(--border)'}}>
            {(['mes','fechas'] as const).map(m => (
              <button key={m} onClick={() => setModo(m)} style={{
                padding:'5px 12px', fontSize:11, fontWeight: modo===m ? 600 : 400,
                background: modo===m ? 'var(--text-primary)' : 'var(--bg-primary)',
                color: modo===m ? 'var(--bg-primary)' : 'var(--text-muted)',
                border:'none', cursor:'pointer',
              }}>{m==='mes' ? 'Por mes' : 'Por fechas'}</button>
            ))}
          </div>

          {modo === 'mes' ? (
            <>
              <select value={mes}  onChange={e=>setMes(Number(e.target.value))}  style={selectStyle}>
                {MESES.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={anio} onChange={e=>setAnio(Number(e.target.value))} style={selectStyle}>
                {[2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </>
          ) : (
            <>
              <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} style={inputStyle} />
              <span style={{fontSize:11, color:'var(--text-muted)'}}>→</span>
              <input type="date" value={fechaFin}    onChange={e=>setFechaFin(e.target.value)}    style={inputStyle} />
            </>
          )}

          <button onClick={cargar} disabled={loading} style={{
            padding:'7px 14px', background:'var(--text-primary)', color:'var(--bg-primary)',
            border:'none', borderRadius:'var(--radius-sm)', fontSize:12,
            fontWeight:600, cursor:'pointer',
          }}>
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{padding:40, textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>
          Calculando métricas de mantenimiento...
        </div>
      )}

      {buscado && !loading && maquinas.length === 0 && (
        <div className="card" style={{padding:40, textAlign:'center', fontSize:13, color:'var(--text-muted)'}}>
          Sin datos de paradas en el período seleccionado.
        </div>
      )}

      {!loading && maquinas.length > 0 && (
        <>
          {/* KPIs globales */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
            <KpiCard label="Disponibilidad promedio" value={dispPromedio.toFixed(1)} unit="%"
                     color={getDispColor(dispPromedio)} sub="Todas las máquinas" />
            <KpiCard label="MTTR promedio" value={mttrPromedio.toFixed(1)} unit="min"
                     color="#e24b4a" sub="Tiempo medio para reparar" />
            <KpiCard label="Total paradas NP" value={String(totalParadas)} unit="eventos"
                     color="#ef9f27" sub="No programadas" />
            <KpiCard label="Total min. paradas" value={String(totalMinPar)} unit="min"
                     color="#8b5cf6" sub="Tiempo total perdido" />
          </div>

          {/* Cards agrupadas por tipo */}
          {GRUPO_ORDER.filter(g => grupos[g]?.length > 0).map(g => {
            const maqsGrupo  = grupos[g]
            const gColor     = GRUPO_COLOR[g]
            const gLabel     = GRUPO_LABEL[g]
            const gDispProm  = maqsGrupo.reduce((s,m)=>s+m.disponibilidad,0)/maqsGrupo.length
            const gMttrProm  = maqsGrupo.reduce((s,m)=>s+m.mttr,0)/maqsGrupo.length
            const gParadas   = maqsGrupo.reduce((s,m)=>s+m.n_paradas,0)

            return (
              <div key={g}>
                {/* Encabezado del grupo */}
                <div style={{
                  display:'flex', alignItems:'center', gap:10, marginBottom:10,
                  paddingBottom:8, borderBottom:`2px solid ${gColor}22`,
                }}>
                  <div style={{width:12, height:12, borderRadius:'50%', background:gColor, flexShrink:0}} />
                  <span style={{fontSize:13, fontWeight:700, color:'var(--text-primary)'}}>{gLabel}</span>
                  <span style={{fontSize:11, color:'var(--text-muted)'}}>
                    {maqsGrupo.length} máq. · Disp. prom: <b style={{color:getDispColor(gDispProm)}}>{gDispProm.toFixed(1)}%</b>
                    · MTTR prom: <b style={{color:'#e24b4a'}}>{gMttrProm.toFixed(1)} min</b>
                    · {gParadas} paradas
                  </span>
                </div>

                {/* Grid de cards del grupo */}
                <div style={{
                  display:'grid',
                  gridTemplateColumns: maqsGrupo.length === 1
                    ? '300px'
                    : maqsGrupo.length <= 4
                    ? `repeat(${maqsGrupo.length}, 1fr)`
                    : 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap:10,
                  marginBottom:20,
                }}>
                  {maqsGrupo.map(m => {
                    const dc = getDispColor(m.disponibilidad)
                    return (
                      <div key={m.tipo_key + m.numero_maquina}
                        className="card"
                        onClick={() => setDrawerMaq(m)}
                        style={{
                          padding:'14px 16px', cursor:'pointer',
                          transition:'transform 0.15s, box-shadow 0.15s',
                          borderLeft:`3px solid ${gColor}`,
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.transform = 'translateY(-2px)'
                          el.style.boxShadow = 'var(--shadow-hover)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.transform = ''
                          el.style.boxShadow = ''
                        }}
                      >
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                          <span style={{fontSize:12, fontWeight:600, color:'var(--text-primary)'}}>{m.label}</span>
                          <span style={{fontSize:10, color:'var(--text-hint)'}}>Ver →</span>
                        </div>

                        <div style={{fontSize:22, fontWeight:700, color:dc, marginBottom:5}}>
                          {m.disponibilidad.toFixed(1)}%
                        </div>
                        <div style={{height:3, background:'var(--bg-tertiary)', borderRadius:2, overflow:'hidden', marginBottom:8}}>
                          <div style={{height:'100%', width:`${Math.min(m.disponibilidad,100)}%`,
                                       background:dc, borderRadius:2, transition:'width 0.8s'}} />
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, fontSize:10}}>
                          <div>
                            <div style={{color:'var(--text-hint)', fontSize:9}}>MTTR</div>
                            <div style={{fontWeight:600, color:'#e24b4a'}}>{m.mttr.toFixed(1)} min</div>
                          </div>
                          <div>
                            <div style={{color:'var(--text-hint)', fontSize:9}}>MTBF</div>
                            <div style={{fontWeight:600, color:'#378add'}}>{m.mtbf.toFixed(1)} min</div>
                          </div>
                          <div>
                            <div style={{color:'var(--text-hint)', fontSize:9}}>Paradas</div>
                            <div style={{fontWeight:600, color:'var(--text-secondary)'}}>{m.n_paradas}</div>
                          </div>
                          <div>
                            <div style={{color:'var(--text-hint)', fontSize:9}}>Min. perdidos</div>
                            <div style={{fontWeight:600, color:'#ef9f27'}}>{m.min_paradas}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Comparativa barras */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>

            {/* MTTR comparativa */}
            <div className="card" style={{padding:'16px 20px'}}>
              <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4}}>
                MTTR por máquina
              </div>
              <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:14}}>
                Tiempo medio para reparar (min) — menor es mejor
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barMttr} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{fontSize:9, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="maquina" tick={{fontSize:9, fill:'var(--text-muted)'}}
                         width={70} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="MTTR" name="MTTR (min)" fill="#e24b4a" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Disponibilidad comparativa */}
            <div className="card" style={{padding:'16px 20px'}}>
              <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4}}>
                Disponibilidad por máquina
              </div>
              <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:14}}>
                Porcentaje de tiempo productivo — mayor es mejor
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barDisp} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0,100]} tick={{fontSize:9, fill:'var(--text-muted)'}}
                         axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                  <YAxis type="category" dataKey="maquina" tick={{fontSize:9, fill:'var(--text-muted)'}}
                         width={70} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Disponibilidad" name="Disponibilidad (%)" fill="#639922" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MTBF comparativa */}
          <div className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4}}>
              MTBF por máquina
            </div>
            <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:14}}>
              Tiempo medio entre fallas (min) — mayor es mejor
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barMtbf}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="maquina" tick={{fontSize:10, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:10, fill:'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="MTBF" name="MTBF (min)" fill="#378add" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar comparativa */}
          {radarData.length > 1 && (
            <div className="card" style={{padding:'16px 20px'}}>
              <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4}}>
                Comparativa global de máquinas
              </div>
              <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:14}}>
                Disponibilidad · MTBF normalizado · Estabilidad (inverso paradas)
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="maquina" tick={{fontSize:10, fill:'var(--text-muted)'}} />
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:8, fill:'var(--text-muted)'}} />
                  <Radar name="Disponibilidad" dataKey="Disponib"
                         stroke="#639922" fill="#639922" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="MTBF (norm.)" dataKey="MTBF_norm"
                         stroke="#378add" fill="#378add" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Estabilidad" dataKey="Paradas_inv"
                         stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!buscado && (
        <div className="card" style={{padding:48, textAlign:'center'}}>
          <div style={{fontSize:13, color:'var(--text-muted)', marginBottom:6}}>
            Selecciona un período para ver las métricas de mantenimiento
          </div>
          <div style={{fontSize:11, color:'var(--text-hint)'}}>
            Haz click en cualquier máquina para ver el detalle completo y tendencia histórica
          </div>
        </div>
      )}

      <DrawerMaquina maq={drawerMaq} open={drawerMaq !== null} onClose={() => setDrawerMaq(null)} />
    </div>
  )
}