// src/app/consumo/page.tsx
import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

interface DatoConsumo {
  tipo_maquina: string
  numero_maquina: string
  horas_trabajadas: number
  kwh_consumidos: number
  kg_procesados: number
  unidades_producidas: number
}

const LABEL_TIPO: Record<string, string> = {
  inyeccion:         'Inyección',
  soplado:           'Soplado',
  linea:             'Línea',
  acondicionamiento: 'Acond.',
}

const COLOR_TIPO: Record<string, string> = {
  inyeccion:         '#378add',
  soplado:           '#639922',
  linea:             '#ef9f27',
  acondicionamiento: '#1D9E75',
}

function fmt(n: number, dec = 1) {
  return n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function CardMetrica({
  label, valor, unidad, color, sub,
}: { label: string; valor: string; unidad: string; color: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>{valor}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unidad}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-hint)' }}>{sub}</div>}
    </div>
  )
}

function BarraConsumo({ label, valor, max, color, unidad }: {
  label: string; valor: number; max: number; color: string; unidad: string
}) {
  const pct = max > 0 ? (valor / max) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <div style={{ width: 80, fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 4,
          background: color, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ width: 70, fontSize: 11, color: 'var(--text-primary)', textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>
        {fmt(valor)} {unidad}
      </div>
    </div>
  )
}

export default function ConsumoPage() {
  const today = new Date().toISOString().split('T')[0]
  const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const [fechaInicio, setFechaInicio] = useState(hace7)
  const [fechaFin,    setFechaFin]    = useState(today)
  const [datos,       setDatos]       = useState<DatoConsumo[]>([])
  const [loading,     setLoading]     = useState(false)
  const [buscado,     setBuscado]     = useState(false)

  async function cargar() {
    setLoading(true)
    setBuscado(true)
    try {
      const r = await fetch(`${API}/reportes/consumo/datos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      const d = await r.json()
      setDatos(Array.isArray(d) ? d : [])
    } catch {
      setDatos([])
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])  // carga inicial

  // Totales globales
  const totalKwh   = datos.reduce((s, d) => s + d.kwh_consumidos,     0)
  const totalKg    = datos.reduce((s, d) => s + d.kg_procesados,      0)
  const totalHoras = datos.reduce((s, d) => s + d.horas_trabajadas,   0)
  const totalUnid  = datos.reduce((s, d) => s + d.unidades_producidas, 0)

  // Máximos para barras
  const maxKwh = Math.max(...datos.map(d => d.kwh_consumidos), 1)
  const maxKg  = Math.max(...datos.map(d => d.kg_procesados),  1)

  // Ordenar por kWh desc
  const datosOrdenados = [...datos].sort((a, b) => b.kwh_consumidos - a.kwh_consumidos)

  const inputStyle = {
    padding: '7px 10px', fontSize: 12, outline: 'none',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', background: 'var(--bg-primary)',
  }

  return (
    <div>
      {/* Header */}
      <div className="card" style={{
        padding: '10px 16px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Consumo</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>
            kW×hora · kg procesados · unidades producidas
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputStyle} />
          <button onClick={cargar} disabled={loading} style={{
            padding: '7px 16px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
            border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {/* Cards resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <CardMetrica label="kWh consumidos"      valor={fmt(totalKwh, 0)} unidad="kWh" color="#378add" sub="Todas las máquinas" />
        <CardMetrica label="kg procesados"       valor={fmt(totalKg,  1)} unidad="kg"  color="#639922" sub="Inyección + soplado con peso" />
        <CardMetrica label="Horas trabajadas"    valor={fmt(totalHoras,0)} unidad="h"  color="#ef9f27" sub="Tiempo real de producción" />
        <CardMetrica label="Unidades producidas" valor={totalUnid.toLocaleString('es-CO')} unidad="uds" color="#1D9E75" sub="Total registrado" />
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Cargando datos...
        </div>
      )}

      {!loading && buscado && datos.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          No hay datos en el rango de fechas seleccionado.
        </div>
      )}

      {!loading && datos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Tabla por máquina */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
              fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
            }}>
              Detalle por máquina
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '110px 70px 80px 80px 80px',
              padding: '8px 16px',
              borderBottom: '0.5px solid var(--border)',
              fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
            }}>
              <span>Máquina</span>
              <span style={{ textAlign: 'right' }}>Horas</span>
              <span style={{ textAlign: 'right' }}>kWh</span>
              <span style={{ textAlign: 'right' }}>kg</span>
              <span style={{ textAlign: 'right' }}>Unidades</span>
            </div>
            {datosOrdenados.map((d, i) => {
              const color = COLOR_TIPO[d.tipo_maquina] ?? 'var(--text-muted)'
              const label = `${LABEL_TIPO[d.tipo_maquina] ?? d.tipo_maquina} ${d.numero_maquina}`
              return (
                <div key={i} className="animate-fade-in-up" style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 70px 80px 80px 80px',
                  padding: '10px 16px', alignItems: 'center',
                  borderBottom: i < datosOrdenados.length - 1 ? '0.5px solid var(--border)' : 'none',
                  animationDelay: `${i * 0.04}s`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{fmt(d.horas_trabajadas, 0)}h</span>
                  <span style={{ fontSize: 12, color, fontWeight: 600, textAlign: 'right' }}>{fmt(d.kwh_consumidos, 0)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {d.kg_procesados > 0 ? `${fmt(d.kg_procesados)}` : <span style={{ color: 'var(--text-hint)' }}>—</span>}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                    {d.unidades_producidas.toLocaleString('es-CO')}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Gráficas de barras */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* kWh */}
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Consumo energético (kWh)
              </div>
              {datosOrdenados.map((d, i) => (
                <BarraConsumo
                  key={i}
                  label={`${LABEL_TIPO[d.tipo_maquina] ?? d.tipo_maquina} ${d.numero_maquina}`}
                  valor={d.kwh_consumidos}
                  max={maxKwh}
                  color={COLOR_TIPO[d.tipo_maquina] ?? '#378add'}
                  unidad="kWh"
                />
              ))}
            </div>

            {/* kg procesados */}
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                kg procesados
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 12 }}>
                Solo máquinas con peso_pieza configurado en Catálogos → Productos
              </div>
              {datosOrdenados.filter(d => d.kg_procesados > 0).length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-hint)', padding: '8px 0' }}>
                  Ningún producto tiene peso_pieza configurado aún.
                  <br />Ve a <b>Catálogos → Productos</b> y edita el campo "Peso (g)".
                </div>
              ) : (
                datosOrdenados.filter(d => d.kg_procesados > 0).map((d, i) => (
                  <BarraConsumo
                    key={i}
                    label={`${LABEL_TIPO[d.tipo_maquina] ?? d.tipo_maquina} ${d.numero_maquina}`}
                    valor={d.kg_procesados}
                    max={maxKg}
                    color={COLOR_TIPO[d.tipo_maquina] ?? '#639922'}
                    unidad="kg"
                  />
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Nota kW pendientes */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: 'rgba(239,159,39,0.08)', border: '0.5px solid rgba(239,159,39,0.3)',
        borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)',
      }}>
        ⚠️ Los valores de kW para <b>Línea</b> y <b>Acondicionamiento</b> usan 5 kW y 3 kW respectivamente como estimados.
        Actualizar en <code style={{ fontSize: 10 }}>excel_export.py → KW_MAQUINA</code> cuando se tengan los datos reales.
      </div>
    </div>
  )
}