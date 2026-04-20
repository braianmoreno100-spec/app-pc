// src/app/oee/page.tsx
import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

const API = 'http://localhost:8000'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface PuntoTendencia {
  dia:              string
  inyeccion:        number | null
  soplado:          number | null
  copro:            number | null
  orina:            number | null
  acondicionamiento:number | null
}

interface GrupoOee {
  tipoKey:      string
  label:        string
  color:        string
  bg:           string
  oee:          number
  disponibilidad: number
  rendimiento:  number
  calidad:      number
  maquinas:     MaquinaDetalle[]
}

interface MaquinaDetalle {
  numero:        number
  oee:           number
  disponibilidad:number
  rendimiento:   number
  calidad:       number
}

interface EmpleadoOee {
  cedula:                   string
  nombre:                   string
  turnos:                   number
  oee_promedio:             number
  disponibilidad_promedio:  number
  rendimiento_promedio:     number
  total_produccion:         number
  bono:                     boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
function hoy()      { return new Date().toISOString().split('T')[0] }
function hace7dias(){ const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().split('T')[0] }

const mesActual  = new Date().getMonth() + 1
const anioActual = new Date().getFullYear()
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const TIPO_META: Record<string, { label: string; color: string; bg: string }> = {
  inyeccion:         { label: 'Inyección',        color: '#378add', bg: '#378add18' },
  soplado:           { label: 'Soplado',           color: '#639922', bg: '#63992218' },
  linea_copro:       { label: 'L. Copro',          color: '#ef9f27', bg: '#ef9f2718' },
  linea_orina:       { label: 'L. Orina',          color: '#8b5cf6', bg: '#8b5cf618' },
  acondicionamiento: { label: 'Acondicionamiento', color: '#1D9E75', bg: '#1D9E7518' },
}
const ORDEN_TIPOS = ['inyeccion','soplado','linea_copro','linea_orina','acondicionamiento']
const TIPOS_CON_DESGLOSE = ['inyeccion','acondicionamiento']

const SEMAFORO = [
  { label: 'World Class', rango: '≥ 95%',  color: '#378add' },
  { label: 'Buena',       rango: '85–95%', color: '#639922' },
  { label: 'Aceptable',   rango: '75–85%', color: '#daa520' },
  { label: 'Regular',     rango: '65–75%', color: '#ef9f27' },
  { label: 'Inaceptable', rango: '< 65%',  color: '#e24b4a' },
]

// Datos demo para el gráfico de tendencia cuando no hay datos reales
const DEMO_TENDENCIA: PuntoTendencia[] = [
  { dia:'Lun', inyeccion:91.2, soplado:94.8, copro:70.1, orina:86.5, acondicionamiento:83.0 },
  { dia:'Mar', inyeccion:88.5, soplado:96.1, copro:68.4, orina:89.2, acondicionamiento:85.2 },
  { dia:'Mié', inyeccion:93.1, soplado:95.3, copro:73.2, orina:87.8, acondicionamiento:81.7 },
  { dia:'Jue', inyeccion:92.5, soplado:95.2, copro:72.1, orina:88.4, acondicionamiento:86.5 },
  { dia:'Vie', inyeccion:90.8, soplado:97.0, copro:74.5, orina:91.0, acondicionamiento:88.1 },
]

// ── Tooltip ───────────────────────────────────────────────────────────────────
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

// ── Drawer de desglose (igual que en inicio) ──────────────────────────────────
function DrawerDesglose({
  open, onClose, grupo,
}: {
  open:    boolean
  onClose: () => void
  grupo:   GrupoOee | null
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!grupo) return null
  const meta = TIPO_META[grupo.tipoKey] ?? { label: grupo.tipoKey, color: '#888', bg: '#88888818' }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
        width: 380,
        background: 'var(--bg-primary)',
        borderLeft: '0.5px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.label}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Desglose por máquina · {grupo.maquinas.length} activa{grupo.maquinas.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6,
            border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
            color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Cards individuales */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {grupo.maquinas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, fontSize: 12, color: 'var(--text-muted)' }}>
              Sin datos disponibles
            </div>
          ) : (
            grupo.maquinas
              .slice()
              .sort((a, b) => a.numero - b.numero)
              .map(m => {
                const s = { color: getOeeColor(m.oee), label: getOeeLabel(m.oee) }
                return (
                  <div key={m.numero} style={{
                    background: 'var(--bg-secondary)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 10, padding: 14,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Máq. #{m.numero}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, background: s.color + '22', color: s.color, padding: '2px 8px', borderRadius: 20 }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>
                      {m.oee.toFixed(1)}%
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${Math.min(m.oee,100)}%`, background: s.color, borderRadius: 2, transition: 'width 0.8s ease' }} />
                    </div>
                    {[
                      { label: 'Disponibilidad', val: m.disponibilidad, color: '#378add' },
                      { label: 'Rendimiento',    val: m.rendimiento,    color: '#639922' },
                      { label: 'Calidad',        val: m.calidad,        color: '#8b5cf6' },
                    ].map(k => (
                      <div key={k.label} style={{ marginBottom: 7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                          <span>{k.label}</span>
                          <span style={{ fontWeight: 600, color: k.color }}>{k.val.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(k.val,100)}%`, background: k.color, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })
          )}
        </div>
      </div>
    </>
  )
}

// ── Card resumen de tipo ──────────────────────────────────────────────────────
function GrupoCard({ grupo, onClick }: { grupo: GrupoOee; onClick?: () => void }) {
  const meta          = TIPO_META[grupo.tipoKey] ?? { label: grupo.tipoKey, color: '#888', bg: '#88888818' }
  const tieneDesglose = TIPOS_CON_DESGLOSE.includes(grupo.tipoKey)
  const color         = getOeeColor(grupo.oee)
  const label         = getOeeLabel(grupo.oee)

  return (
    <div
      className="card"
      onClick={tieneDesglose ? onClick : undefined}
      style={{
        padding: '14px 16px',
        cursor: tieneDesglose ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={e => { if (tieneDesglose) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (tieneDesglose) (e.currentTarget as HTMLElement).style.transform = '' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{grupo.label}</span>
          </div>
          {tieneDesglose && (
            <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>
              {grupo.maquinas.length} máq. · Ver desglose →
            </span>
          )}
        </div>
        <span className="badge" style={{ background: color + '22', color }}>{label}</span>
      </div>

      {/* OEE */}
      <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 10 }}>
        {grupo.oee.toFixed(1)}%
      </div>

      {/* D × R × C */}
      {[
        { label: 'Disponibilidad', val: grupo.disponibilidad, color: '#378add' },
        { label: 'Rendimiento',    val: grupo.rendimiento,    color: '#639922' },
        { label: 'Calidad',        val: grupo.calidad,        color: '#8b5cf6' },
      ].map(k => (
        <div key={k.label} style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
            <span>{k.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{k.val.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(k.val,100)}%`, background: k.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── TAB OEE GENERAL ──────────────────────────────────────────────────────────
function TabOeeGeneral() {
  const [fechaInicio, setFechaInicio] = useState(hace7dias())
  const [fechaFin,    setFechaFin]    = useState(hoy())
  const [tendencia,   setTendencia]   = useState<PuntoTendencia[]>([])
  const [grupos,      setGrupos]      = useState<GrupoOee[]>([])
  const [loading,     setLoading]     = useState(false)
  const [sinDatos,    setSinDatos]    = useState(false)
  const [drawerGrupo, setDrawerGrupo] = useState<GrupoOee | null>(null)

  async function cargarDatos() {
    setLoading(true); setSinDatos(false)
    try {
      // Cargar tendencia
      const r = await fetch(`${API}/reportes/oee/fechas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      if (!r.ok) throw new Error()
      const data = await r.json()

      const porFecha: Record<string, Record<string, number[]>> = {}
      data.forEach((t: any) => {
        const fecha = t.fecha?.slice(0,10) ?? ''
        if (!fecha) return
        if (!porFecha[fecha]) porFecha[fecha] = { inyeccion:[], soplado:[], copro:[], orina:[], acondicionamiento:[] }
        const oee = Number(t.oee) || 0
        const tipo = t.tipo_maquina ?? ''
        if (tipo === 'inyeccion'         && oee > 0) porFecha[fecha].inyeccion.push(oee)
        if (tipo === 'soplado'           && oee > 0) porFecha[fecha].soplado.push(oee)
        if (tipo === 'linea' && (t.numero_maquina === 1 || t.numero_maquina === '1') && oee > 0) porFecha[fecha].copro.push(oee)
        if (tipo === 'linea' && (t.numero_maquina === 2 || t.numero_maquina === '2') && oee > 0) porFecha[fecha].orina.push(oee)
        if (tipo === 'acondicionamiento' && oee > 0) porFecha[fecha].acondicionamiento.push(oee)
      })

      const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null
      const puntos = Object.entries(porFecha)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([fecha, g]) => ({
          dia:              fecha.slice(5),
          inyeccion:        avg(g.inyeccion),
          soplado:          avg(g.soplado),
          copro:            avg(g.copro),
          orina:            avg(g.orina),
          acondicionamiento:avg(g.acondicionamiento),
        }))
      setTendencia(puntos)

      // Construir grupos desde los datos del reporte
      const gruposMap: Record<string, { oees:number[], disps:number[], rends:number[], cals:number[], maqMap: Map<number,{oees:number[],disps:number[],rends:number[],cals:number[]}> }> = {}
      const addToGrupo = (key: string, t: any) => {
        if (!gruposMap[key]) gruposMap[key] = { oees:[], disps:[], rends:[], cals:[], maqMap: new Map() }
        const g = gruposMap[key]
        const oee  = Number(t.oee)  || 0
        const disp = Number(t.disponibilidad) || 0
        const rend = Number(t.rendimiento)    || 0
        const cal  = Number(t.calidad)        || 100
        if (oee > 0) { g.oees.push(oee); g.disps.push(disp); g.rends.push(rend); g.cals.push(cal) }
        const num = Number(t.numero_maquina) || 1
        if (!g.maqMap.has(num)) g.maqMap.set(num, { oees:[], disps:[], rends:[], cals:[] })
        const mm = g.maqMap.get(num)!
        if (oee > 0) { mm.oees.push(oee); mm.disps.push(disp); mm.rends.push(rend); mm.cals.push(cal) }
      }

      data.forEach((t: any) => {
        const tipo = t.tipo_maquina ?? ''
        if (tipo === 'inyeccion')         addToGrupo('inyeccion', t)
        if (tipo === 'soplado')           addToGrupo('soplado', t)
        if (tipo === 'linea' && (t.numero_maquina === 1 || t.numero_maquina === '1')) addToGrupo('linea_copro', t)
        if (tipo === 'linea' && (t.numero_maquina === 2 || t.numero_maquina === '2')) addToGrupo('linea_orina', t)
        if (tipo === 'acondicionamiento') addToGrupo('acondicionamiento', t)
      })

      const resultado: GrupoOee[] = ORDEN_TIPOS
        .filter(k => gruposMap[k])
        .map(k => {
          const g    = gruposMap[k]
          const meta = TIPO_META[k]
          const mavg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0
          const maquinas: MaquinaDetalle[] = Array.from(g.maqMap.entries()).map(([num, mm]) => ({
            numero:         num,
            oee:            mavg(mm.oees),
            disponibilidad: mavg(mm.disps),
            rendimiento:    mavg(mm.rends),
            calidad:        mavg(mm.cals),
          }))
          return {
            tipoKey:        k,
            label:          meta.label,
            color:          meta.color,
            bg:             meta.bg,
            oee:            mavg(g.oees),
            disponibilidad: mavg(g.disps),
            rendimiento:    mavg(g.rends),
            calidad:        mavg(g.cals),
            maquinas,
          }
        })

      setGrupos(resultado)
      if (puntos.length === 0) setSinDatos(true)
    } catch { setSinDatos(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const chartData   = tendencia.length > 0 ? tendencia : DEMO_TENDENCIA
  const gruposChart = grupos.length > 0 ? grupos : [
    { tipoKey:'inyeccion',         label:'Inyección',        color:'#378add', bg:'#378add18', oee:92.5, disponibilidad:94.1, rendimiento:98.2, calidad:100, maquinas:[] },
    { tipoKey:'soplado',           label:'Soplado',          color:'#639922', bg:'#63992218', oee:95.2, disponibilidad:97.0, rendimiento:99.1, calidad:98.8, maquinas:[] },
    { tipoKey:'linea_copro',       label:'L. Copro',         color:'#ef9f27', bg:'#ef9f2718', oee:72.1, disponibilidad:78.3, rendimiento:91.0, calidad:99.2, maquinas:[] },
    { tipoKey:'linea_orina',       label:'L. Orina',         color:'#8b5cf6', bg:'#8b5cf618', oee:88.4, disponibilidad:91.2, rendimiento:95.8, calidad:100, maquinas:[] },
    { tipoKey:'acondicionamiento', label:'Acondicionamiento',color:'#1D9E75', bg:'#1D9E7518', oee:84.3, disponibilidad:87.5, rendimiento:96.3, calidad:100, maquinas:[] },
  ]

  const inputStyle = {
    fontSize: 11, padding: '5px 8px',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', background: 'var(--bg-primary)',
  }

  // Para el gráfico de barras usamos los grupos actuales
  const barData = gruposChart.map(g => ({
    maquina:        g.label,
    disponibilidad: g.disponibilidad,
    rendimiento:    g.rendimiento,
    calidad:        g.calidad,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtro + semáforo */}
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
          <input type="date" value={fechaFin}    onChange={e => setFechaFin(e.target.value)}    style={inputStyle} />
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
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          Sin datos reales en el rango — mostrando datos de referencia
        </div>
      )}

      {/* Cards por tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {gruposChart.map(g => (
          <GrupoCard
            key={g.tipoKey}
            grupo={g}
            onClick={() => setDrawerGrupo(g)}
          />
        ))}
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
            <XAxis dataKey="dia"  tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[60,100]} tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11, color:'var(--text-muted)' }} />
            <Line type="monotone" dataKey="inyeccion"         name="Inyección"        stroke="#378add" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="soplado"           name="Soplado"           stroke="#639922" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="copro"             name="L. Copro"          stroke="#ef9f27" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="orina"             name="L. Orina"          stroke="#8b5cf6" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="acondicionamiento" name="Acondicionamiento" stroke="#1D9E75" strokeWidth={2} dot={{ r:3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Desglose D×R×C */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Desglose D × R × C</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Disponibilidad · Rendimiento · Calidad</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="maquina"       tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[60,100]}       tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Bar dataKey="disponibilidad" name="Disponibilidad" fill="#378add" radius={[3,3,0,0]} />
            <Bar dataKey="rendimiento"    name="Rendimiento"    fill="#639922" radius={[3,3,0,0]} />
            <Bar dataKey="calidad"        name="Calidad"        fill="#8b5cf6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drawer */}
      <DrawerDesglose
        open={drawerGrupo !== null}
        onClose={() => setDrawerGrupo(null)}
        grupo={drawerGrupo}
      />
    </div>
  )
}

// ── TAB EMPLEADOS (sin cambios) ───────────────────────────────────────────────
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
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n')
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
      <div className="card" style={{
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>OEE por empleado</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mes</label>
          <select value={mes}  onChange={e => setMes(Number(e.target.value))}  style={selectStyle}>
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
          }}>{loading ? 'Cargando...' : 'Consultar'}</button>
          {empleados.length > 0 && (
            <button onClick={exportarExcel} style={{
              fontSize: 11, padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              background: '#eaf3de', border: '0.5px solid #c0dd97',
              color: '#3b6d11', fontWeight: 600,
            }}>Exportar CSV</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background:'var(--bg-tertiary)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:12, color:'var(--text-muted)' }}>
          {error}
        </div>
      )}

      {empleados.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total empleados', val: empleados.length,  color: 'var(--text-primary)' },
            { label: 'OEE promedio',    val: `${oeePromedio}%`, color: 'var(--text-primary)' },
            { label: 'Con bono ≥ 94%', val: conBono,           color: '#3b6d11' },
            { label: 'Sin bono < 94%', val: sinBono,           color: '#a32d2d' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

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

          {loading && <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>Cargando...</div>}
          {!loading && empleados.length === 0 && (
            <div style={{ padding:24, textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>
              Sin turnos en {MESES[mes-1]} {anio}
            </div>
          )}

          {empleados.map((e, i) => {
            const color = getOeeColor(e.oee_promedio)
            return (
              <div key={e.cedula} className="animate-fade-in-up" style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 70px 100px 100px 100px 80px',
                padding: '12px 16px',
                borderBottom: i < empleados.length-1 ? '0.5px solid var(--border)' : 'none',
                alignItems: 'center',
                background: e.bono ? 'rgba(99,153,34,0.06)' : 'transparent',
                animationDelay: `${i * 0.04}s`,
              }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{e.nombre}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace' }}>{e.cedula}</div>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color }}>{e.oee_promedio.toFixed(1)}%</div>
                  <div className="progress-bar" style={{ height:3, marginTop:4 }}>
                    <div className="progress-fill" style={{ width:`${Math.min(e.oee_promedio,100)}%`, background:color }} />
                  </div>
                </div>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{e.turnos}</span>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{e.disponibilidad_promedio.toFixed(1)}%</span>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{e.rendimiento_promedio.toFixed(1)}%</span>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{e.total_produccion.toLocaleString()}</span>
                <span className="badge" style={{ background: e.bono ? '#eaf3de' : '#fce8e8', color: e.bono ? '#3b6d11' : '#a32d2d' }}>
                  {e.bono ? 'Sí ✓' : 'No'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!buscado && (
        <div className="card animate-fade-in" style={{ padding:48, textAlign:'center' }}>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:6 }}>Selecciona mes y año para consultar</div>
          <div style={{ fontSize:11, color:'var(--text-hint)' }}>Bono se otorga con OEE promedio ≥ 94%</div>
        </div>
      )}

      {empleados.length > 0 && (
        <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>
          Bono con OEE ≥ 94% · {MESES[mes-1]} {anio}
        </div>
      )}
    </div>
  )
}

// ── VISTA PRINCIPAL ───────────────────────────────────────────────────────────
export default function OeePage() {
  const [tab, setTab] = useState<'general' | 'empleados'>('general')
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[
          { id:'general',   label:'OEE General',      desc:'Por línea y tendencia' },
          { id:'empleados', label:'OEE por empleado', desc:'Bono mensual' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding:'8px 16px', borderRadius:'var(--radius-md)', cursor:'pointer',
            border:'0.5px solid',
            borderColor: tab === t.id ? 'var(--text-primary)' : 'var(--border)',
            background:  tab === t.id ? 'var(--text-primary)' : 'var(--bg-primary)',
            color:       tab === t.id ? 'var(--bg-primary)'   : 'var(--text-muted)',
            fontSize:12, fontWeight: tab === t.id ? 600 : 400,
            display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2,
            transition:'all var(--transition)',
          }}>
            <span>{t.label}</span>
            <span style={{ fontSize:10, opacity:0.6 }}>{t.desc}</span>
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