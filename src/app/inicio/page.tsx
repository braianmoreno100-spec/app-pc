// src/app/inicio/page.tsx
import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const API = 'http://localhost:8000'

interface MaquinaOee {
  orden_id: number
  nombre: string
  tipo: string
  numero_maquina: number
  turno_id: number | null
  oee: number
  disponibilidad: number
  rendimiento: number
  calidad: number
  contador_produccion: number
  total_paradas_min: number
  activa: boolean
}

function getOeeStatus(oee: number) {
  if (oee < 65) return { label: 'Inaceptable', color: '#e24b4a', bar: '#e24b4a' }
  if (oee < 75) return { label: 'Regular',     color: '#ba7517', bar: '#ef9f27' }
  if (oee < 85) return { label: 'Aceptable',   color: '#856b00', bar: '#daa520' }
  if (oee < 95) return { label: 'Buena',       color: '#3b6d11', bar: '#639922' }
  return           { label: 'World Class',  color: '#185fa5', bar: '#378add' }
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased * 10) / 10)
      if (progress >= 1) { setValue(target); clearInterval(timer) }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

function calcularOee(resumen: any, orden: any): Partial<MaquinaOee> {
  if (!resumen || !orden) return { oee: 0, disponibilidad: 0, rendimiento: 0, calidad: 0 }

  const contador     = Number(resumen.total_produccion) || 0
  const paradas: any[] = resumen.paradas ?? []
  const minParadasNP = paradas
    .filter((p: any) => !p.programada)
    .reduce((acc: number, p: any) => acc + (Number(p.minutos) || 0), 0)

  // Parser de hora robusto — maneja "7:14 p. m.", "19:14", "7:14 PM", etc.
  const parseHora = (h: string): number | null => {
    if (!h) return null
    try {
      // Quitar puntos y espacios extras → "7:14 pm" o "19:14"
      const clean = h.replace(/\./g, '').replace(/\s+/g, ' ').trim().toLowerCase()
      const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/)
      if (!match) return null
      let hours = parseInt(match[1])
      const mins = parseInt(match[2])
      const ampm = match[3]
      if (ampm === 'pm' && hours !== 12) hours += 12
      if (ampm === 'am' && hours === 12) hours = 0
      return hours * 60 + mins
    } catch { return null }
  }

  let tiempoReal = 0
  const inicio = parseHora(resumen.hora_inicio)
  const fin    = resumen.hora_fin ? parseHora(resumen.hora_fin) : null

  if (inicio !== null) {
    const finMin = fin ?? (new Date().getHours() * 60 + new Date().getMinutes())
    let diffMin  = finMin - inicio
    if (diffMin < 0) diffMin += 24 * 60
    tiempoReal = Math.min(diffMin / 60, 12)
  }

  const tiempoProgr    = 12
  const ciclo          = Number(orden.ciclos)    || 0
  const cavidades      = Number(orden.cavidades) || 1
  const tiempoDisp     = Math.max(tiempoReal - (minParadasNP / 60), 0)
  const disponibilidad = tiempoProgr > 0 ? (tiempoDisp / tiempoProgr) * 100 : 0
  const prodPlaneada   = ciclo > 0 ? (tiempoProgr * 3600 / ciclo * cavidades) : 0
  const rendimiento    = prodPlaneada > 0 ? (contador / prodPlaneada) * 100 : 0
  const calidad        = 100
  const oee            = (disponibilidad / 100) * (rendimiento / 100) * (calidad / 100) * 100

  return {
    oee:                 Math.round(Math.min(oee, 150) * 10) / 10,
    disponibilidad:      Math.round(Math.min(disponibilidad, 150) * 10) / 10,
    rendimiento:         Math.round(Math.min(rendimiento, 150) * 10) / 10,
    calidad,
    contador_produccion: contador,
    total_paradas_min:   minParadasNP,
  }
}

const STAGGER = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6','stagger-7','stagger-8']

function MaquinaCard({ m, index }: { m: MaquinaOee; index: number }) {
  const s           = getOeeStatus(m.oee)
  const animatedOee = useCountUp(m.oee)

  const tipoLabel: Record<string, string> = {
    inyeccion: 'Inyección', soplado: 'Soplado', linea: 'Línea'
  }
  const tipoBadge: Record<string, { bg: string; color: string }> = {
    inyeccion: { bg: '#1a3a6a20', color: '#378add' },
    soplado:   { bg: '#1a3a1a20', color: '#639922' },
    linea:     { bg: '#4a2a0020', color: '#ef9f27' },
  }
  const tb = tipoBadge[m.tipo] ?? { bg: '#88888820', color: '#888' }

  return (
    <div className={`card animate-fade-in-up ${STAGGER[index] ?? ''}`} style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.nombre}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: tb.bg, color: tb.color }}>
              {tipoLabel[m.tipo] ?? m.tipo}
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              Máq. #{m.numero_maquina}
            </span>
          </div>
        </div>
        <span className="badge" style={{ background: s.color + '22', color: s.color, marginLeft: 8, flexShrink: 0 }}>
          {s.label}
        </span>
      </div>

      {/* OEE grande */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: '-1px' }}>
          {m.oee > 0 ? `${animatedOee.toFixed(1)}%` : '—'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>OEE del turno</div>
      </div>

      {/* Barra OEE */}
      <div className="progress-bar" style={{ marginBottom: 16, height: 6 }}>
        <div className="progress-fill" style={{ width: `${Math.min(m.oee, 100)}%`, background: s.bar }} />
      </div>

      {/* KPIs D×R×C */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Disponib.', val: m.disponibilidad, color: '#378add' },
          { label: 'Rendim.',   val: m.rendimiento,    color: '#639922' },
          { label: 'Calidad',   val: m.calidad,        color: '#8b5cf6' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 6px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 3 }}>{k.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: k.val > 0 ? k.color : 'var(--text-muted)' }}>
              {k.val > 0 ? `${k.val.toFixed(1)}%` : '—'}
            </div>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div className="progress-fill" style={{ width: `${Math.min(k.val, 100)}%`, background: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Producción + Paradas */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8, paddingTop: 12,
        borderTop: '0.5px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 2 }}>Producción</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {m.contador_produccion.toLocaleString()} <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>und</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 2 }}>Paradas</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: m.total_paradas_min > 30 ? '#e24b4a' : 'var(--text-primary)' }}>
            {m.total_paradas_min} <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>min</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className={`card animate-fade-in ${STAGGER[index] ?? ''}`} style={{ padding: 18 }}>
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '35%', marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 36, width: '45%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 6, width: '100%', marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 6 }} />)}
      </div>
    </div>
  )
}

export default function InicioPage() {
  const [maquinas,  setMaquinas]  = useState<MaquinaOee[]>([])
  const [loading,   setLoading]   = useState(true)
  const [connected, setConnected] = useState(false)
  const [ultimaAct, setUltimaAct] = useState('')
  const socketRef = useRef<Socket | null>(null)

  async function cargarOrdenes() {
  try {
    const ordenesRes = await fetch(`${API}/ordenes/`)
    const ordenes    = await ordenesRes.json()
    const activas    = ordenes.filter((o: any) => o.activa)
    const data: MaquinaOee[] = []

    await Promise.all(activas.map(async (orden: any) => {
      try {
        const turnosRes = await fetch(`${API}/produccion/turno/orden/${orden.id}`)
        const turnos    = await turnosRes.json()

        const turnoAbierto = Array.isArray(turnos)
          ? turnos.find((t: any) => !t.hora_fin)
          : null

        let kpis = { oee: 0, disponibilidad: 0, rendimiento: 0, calidad: 0, contador_produccion: 0, total_paradas_min: 0 }

        if (turnoAbierto) {
          const turnoId = turnoAbierto.turno_id ?? turnoAbierto.id
          if (turnoId) {
            const resRes = await fetch(`${API}/produccion/turno/${turnoId}/resumen`)
            if (resRes.ok) {
              const resumen = await resRes.json()
              kpis = { ...kpis, ...calcularOee(resumen, orden) } as any
            }
          }
        }

        data.push({
          orden_id:       orden.id,
          nombre:         orden.descripcion_producto,
          tipo:           orden.tipo_maquina,
          numero_maquina: orden.numero_maquina,
          turno_id:       turnoAbierto?.turno_id ?? turnoAbierto?.id ?? null,
          activa:         true,
          ...kpis,
        })
      } catch {}
    }))

    setMaquinas(data.sort((a, b) => a.numero_maquina - b.numero_maquina))
    setUltimaAct(new Date().toLocaleTimeString('es-CO'))
  } catch {}
  finally { setLoading(false) }
}

  useEffect(() => {
    cargarOrdenes()
    const socket = io(API, { transports: ['websocket','polling'] })
    socketRef.current = socket
    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('registro_agregado',    () => cargarOrdenes())
    socket.on('parada_agregada',      () => cargarOrdenes())
    socket.on('parada_eliminada',     () => cargarOrdenes())
    socket.on('desperdicio_agregado', () => cargarOrdenes())
    socket.on('turno_iniciado',       () => cargarOrdenes())
    socket.on('turno_cerrado',        () => cargarOrdenes())
    return () => { socket.disconnect() }
  }, [])

  // Resumen global
  const oeePromGlobal = maquinas.length > 0
    ? (maquinas.reduce((a,m) => a + m.oee, 0) / maquinas.length).toFixed(1)
    : null
  const animGlobal = useCountUp(oeePromGlobal ? Number(oeePromGlobal) : 0)

  return (
    <div>
      {/* Header */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--radius-md)',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Inicio — tiempo real
            </div>
            {ultimaAct && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                Actualizado {ultimaAct}
              </div>
            )}
          </div>

          {/* OEE global */}
          {oeePromGlobal && (
            <div style={{
              background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              padding: '6px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>OEE Global</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {animGlobal.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={cargarOrdenes}
            style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 'var(--radius-sm)',
              border: '0.5px solid var(--border)', background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
            }}
          >
            Actualizar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <div className="pulse-dot" style={{ background: connected ? '#639922' : '#e24b4a' }} />
            {connected ? 'Socket.IO conectado' : 'Desconectado'}
          </div>
        </div>
      </div>

      {/* Semáforo leyenda */}
      {!loading && maquinas.length > 0 && (
        <div className="animate-fade-in" style={{
          display: 'flex', gap: 16, marginBottom: 16,
          flexWrap: 'wrap', justifyContent: 'flex-end',
        }}>
          {[
            { label: 'World Class ≥95%', color: '#378add' },
            { label: 'Buena 85–95%',     color: '#639922' },
            { label: 'Aceptable 75–85%', color: '#daa520' },
            { label: 'Regular 65–75%',   color: '#ef9f27' },
            { label: 'Inaceptable <65%', color: '#e24b4a' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {[0,1,2,3,4,5,6,7].map(i => <SkeletonCard key={i} index={i} />)}
        </div>
      ) : maquinas.length === 0 ? (
        <div className="card animate-fade-in" style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏭</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Sin órdenes activas
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Las máquinas aparecerán aquí cuando se creen órdenes desde las tablets
          </div>
          <button onClick={cargarOrdenes} style={{
            fontSize: 12, padding: '7px 18px', borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
          }}>
            Recargar
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {maquinas.map((m, i) => <MaquinaCard key={m.orden_id} m={m} index={i} />)}
        </div>
      )}
    </div>
  )
}