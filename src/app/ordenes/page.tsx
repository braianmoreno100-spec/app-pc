import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

interface Orden {
  id: number
  numero_orden: string
  codigo_producto: string
  descripcion_producto: string
  tipo_maquina: string
  numero_maquina: number
  cantidad_producir: number
  nombre_lider: string
  fecha_creacion: string | null
  activa: boolean
}

interface Turno {
  id: number
  cedula_empleado: string
  nombre_empleado: string
  fecha: string
  turno: string
  hora_inicio: string
  hora_fin: string | null
}

interface ResumenTurno {
  oee: number
  disponibilidad: number
  rendimiento: number
  calidad: number
  tiempo_programado: number
  tiempo_real: number
  contador_produccion: number
  produccion_planeada: number
  total_paradas_min: number
  total_desperdicio: number
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

// ── Fix: fecha segura ante null ───────────────────────────────────────────────
function fechaSegura(fecha: string | null): string {
  if (!fecha) return '—'
  try { return new Date(fecha).toLocaleDateString('es-CO') }
  catch { return '—' }
}
function fechaSlice(fecha: string | null): string {
  if (!fecha) return ''
  return fecha.slice(0, 10)
}

function BadgeEstado({ activa }: { activa: boolean }) {
  return (
    <span className="badge" style={{
      background: activa ? 'rgba(99,153,34,0.15)' : 'var(--bg-tertiary)',
      color: activa ? '#3b6d11' : 'var(--text-muted)',
    }}>
      {activa ? 'Activa' : 'Cerrada'}
    </span>
  )
}

function BadgeTipo({ tipo }: { tipo: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    inyeccion:         { bg: 'rgba(55,138,221,0.15)',  color: '#378add', label: 'Inyección'        },
    soplado:           { bg: 'rgba(99,153,34,0.15)',   color: '#639922', label: 'Soplado'           },
    linea:             { bg: 'rgba(239,159,39,0.15)',  color: '#ba7517', label: 'Línea'             },
    acondicionamiento: { bg: 'rgba(29,158,117,0.15)',  color: '#1D9E75', label: 'Acondicionamiento' },
  }
  const s = map[tipo] ?? { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)', label: tipo }
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  )
}

function DetallePanel({ orden, onClose }: { orden: Orden; onClose: () => void }) {
  const [turnos,    setTurnos]    = useState<Turno[]>([])
  const [resumenes, setResumenes] = useState<Record<number, ResumenTurno>>({})
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch(`${API}/produccion/turno/orden/${orden.id}`)
      .then(r => r.json())
      .then(async (data: Turno[]) => {
        setTurnos(data)
        const res: Record<number, ResumenTurno> = {}
        await Promise.all(data.map(async t => {
          try {
            const r = await fetch(`${API}/produccion/turno/${t.id}/resumen`)
            if (r.ok) res[t.id] = await r.json()
          } catch {}
        }))
        setResumenes(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orden.id])

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: 'var(--bg-primary)',
      borderLeft: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
      boxShadow: 'var(--shadow-modal)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Orden #{orden.numero_orden}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {orden.descripcion_producto}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 18, color: 'var(--text-muted)', lineHeight: 1, padding: 4,
        }}>✕</button>
      </div>

      {/* Info orden */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Producto', val: orden.codigo_producto },
            { label: 'Máquina',  val: `#${orden.numero_maquina}` },
            { label: 'Cantidad', val: orden.cantidad_producir.toLocaleString() },
            { label: 'Líder',    val: orden.nombre_lider },
            { label: 'Fecha',    val: fechaSegura(orden.fecha_creacion) },
            { label: 'Estado',   val: orden.activa ? 'Activa' : 'Cerrada' },
          ].map(k => (
            <div key={k.label}>
              <div style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 2, textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Turnos */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Turnos ({turnos.length})
        </div>

        {loading && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 20 }}>Cargando...</div>}
        {!loading && turnos.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 20 }}>Sin turnos registrados</div>}

        {turnos.map(t => {
          const r = resumenes[t.id]
          return (
            <div key={t.id} className="card animate-fade-in-up" style={{
              padding: 14, marginBottom: 10, borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Turno {t.turno} — {t.nombre_empleado}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {t.fecha} · {t.hora_inicio}{t.hora_fin ? ` → ${t.hora_fin}` : ' (abierto)'}
                  </div>
                </div>
                {r && (
                  <span className="badge" style={{
                    background: getOeeColor(r.oee) + '22', color: getOeeColor(r.oee), alignSelf: 'flex-start',
                  }}>{getOeeLabel(r.oee)}</span>
                )}
              </div>

              {r && (
                <>
                  <div style={{ fontSize: 22, fontWeight: 700, color: getOeeColor(r.oee), marginBottom: 8 }}>
                    {r.oee.toFixed(1)}% OEE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      { label: 'Disponib.', val: r.disponibilidad },
                      { label: 'Rendim.',   val: r.rendimiento    },
                      { label: 'Calidad',   val: r.calidad        },
                    ].map(k => (
                      <div key={k.label} style={{
                        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                        padding: '6px 8px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>{k.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {k.val.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { label: 'Producción',  val: `${r.contador_produccion} / ${r.produccion_planeada}` },
                      { label: 'Paradas',     val: `${r.total_paradas_min} min` },
                      { label: 'Desperdicio', val: `${r.total_desperdicio} und` },
                      { label: 'T. real',     val: `${r.tiempo_real}h` },
                    ].map(k => (
                      <div key={k.label}>
                        <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>{k.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!r && !loading && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin datos de resumen</div>}
            </div>
          )
        })}
      </div>

      {/* Botón Excel */}
      <div style={{ padding: '12px 20px', borderTop: '0.5px solid var(--border)' }}>
        <button
          onClick={() => window.open(`${API}/reportes/reporte/orden/${orden.id}`, '_blank')}
          style={{
            width: '100%', padding: '9px 0', cursor: 'pointer',
            background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          Descargar Excel de la orden
        </button>
      </div>
    </div>
  )
}

export default function OrdenesPage() {
  const [ordenes,           setOrdenes]           = useState<Orden[]>([])
  const [loading,           setLoading]           = useState(true)
  const [filtro,            setFiltro]            = useState<'todas'|'activas'|'cerradas'>('todas')
  const [busqueda,          setBusqueda]          = useState('')
  const [fechaInicio,       setFechaInicio]       = useState('')
  const [fechaFin,          setFechaFin]          = useState('')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null)

  useEffect(() => {
    fetch(`${API}/ordenes/`)
      .then(r => r.json())
      .then(data => { setOrdenes(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const ordenesFiltradas = ordenes.filter(o => {
    const matchFiltro = filtro === 'todas' || (filtro === 'activas' ? o.activa : !o.activa)
    const matchSearch = (o.numero_orden ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
                        (o.descripcion_producto ?? '').toLowerCase().includes(busqueda.toLowerCase())
    // ── Fix: fecha_creacion puede ser null ───────────────────────────────────
    const fecha     = fechaSlice(o.fecha_creacion)
    const matchDesde = !fechaInicio || fecha >= fechaInicio
    const matchHasta = !fechaFin    || fecha <= fechaFin
    return matchFiltro && matchSearch && matchDesde && matchHasta
  })

  const inputStyle = {
    padding: '7px 10px', fontSize: 12, outline: 'none',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', background: 'var(--bg-primary)',
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', marginBottom: 14, borderRadius: 'var(--radius-md)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Órdenes de producción
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['todas','activas','cerradas'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filtro === f ? 'var(--text-primary)' : 'var(--border)',
              background:  filtro === f ? 'var(--text-primary)' : 'var(--bg-primary)',
              color:       filtro === f ? 'var(--bg-primary)'   : 'var(--text-muted)',
              fontWeight:  filtro === f ? 600 : 400,
              textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Búsqueda + fechas */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por número de orden o producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
        </div>
        {(fechaInicio || fechaFin) && (
          <button onClick={() => { setFechaInicio(''); setFechaFin('') }} style={{
            ...inputStyle, cursor: 'pointer', color: 'var(--text-muted)',
          }}>Limpiar</button>
        )}
      </div>

      {/* Tabla */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 140px 70px 100px 80px 80px',
          padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
          fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
        }}>
          <span>Orden</span><span>Producto</span><span>Tipo</span>
          <span>Máq.</span><span>Cantidad</span><span>Estado</span><span>Fecha</span>
        </div>

        {loading && <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Cargando órdenes...</div>}
        {!loading && ordenesFiltradas.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No hay órdenes {filtro !== 'todas' ? filtro : ''} en el rango seleccionado
          </div>
        )}

        {ordenesFiltradas.map((o, i) => (
          <div
            key={o.id}
            onClick={() => setOrdenSeleccionada(o)}
            className="animate-fade-in-up"
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 140px 70px 100px 80px 80px',
              padding: '12px 16px',
              borderBottom: i < ordenesFiltradas.length - 1 ? '0.5px solid var(--border)' : 'none',
              alignItems: 'center', cursor: 'pointer',
              background: ordenSeleccionada?.id === o.id ? 'var(--bg-tertiary)' : 'transparent',
              transition: 'background var(--transition)',
              animationDelay: `${i * 0.03}s`,
            }}
            onMouseEnter={e => { if (ordenSeleccionada?.id !== o.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { if (ordenSeleccionada?.id !== o.id) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              #{o.numero_orden}
            </span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{o.descripcion_producto}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{o.codigo_producto}</div>
            </div>
            <BadgeTipo tipo={o.tipo_maquina} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>#{o.numero_maquina}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.cantidad_producir.toLocaleString()}</span>
            <BadgeEstado activa={o.activa} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {fechaSegura(o.fecha_creacion)}
            </span>
          </div>
        ))}
      </div>

      {!loading && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'right' }}>
          {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? 'es' : ''}
          {' · '}{ordenes.filter(o => o.activa).length} activas
          {' · '}{ordenes.filter(o => !o.activa).length} cerradas
        </div>
      )}

      {ordenSeleccionada && (
        <>
          <div onClick={() => setOrdenSeleccionada(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99,
          }} />
          <DetallePanel orden={ordenSeleccionada} onClose={() => setOrdenSeleccionada(null)} />
        </>
      )}
    </div>
  )
}