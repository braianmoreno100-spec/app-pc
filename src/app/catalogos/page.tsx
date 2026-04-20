import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

type Tab = 'empleados' | 'lideres' | 'productos' | 'causas' | 'desperdicios'

interface Empleado        { id: number; cedula: string; nombre: string; activo: boolean }
interface Lider           { id: number; cedula: string; nombre: string; activo: boolean }
interface Producto        { id: number; codigo: string; descripcion: string; ciclos: number; cavidades: number; material: string; activo: boolean }
interface CausaParada     { id: number; codigo: number; descripcion: string; programada: boolean; tipo_maquina: string; activa: boolean }
interface TiposDesperdicio{ id: number; codigo: number; descripcion: string; activa: boolean }

function Toggle({ activo, onChange }: { activo: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
      background: activo ? '#639922' : 'var(--bg-tertiary)',
      border: '0.5px solid var(--border)',
      position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: activo ? 17 : 3,
        width: 12, height: 12, borderRadius: '50%',
        background: activo ? '#fff' : 'var(--text-muted)',
        transition: 'left 0.2s, background 0.2s',
      }} />
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    green:  { bg: 'rgba(99,153,34,0.15)',   fg: '#639922' },
    blue:   { bg: 'rgba(55,138,221,0.15)',  fg: '#378add' },
    orange: { bg: 'rgba(239,159,39,0.15)',  fg: '#ba7517' },
    teal:   { bg: 'rgba(29,158,117,0.15)',  fg: '#1D9E75' },
    gray:   { bg: 'var(--bg-tertiary)',     fg: 'var(--text-muted)' },
    red:    { bg: 'rgba(226,75,74,0.15)',   fg: '#e24b4a' },
  }
  const s = map[color] ?? map.gray
  return <span className="badge" style={{ background: s.bg, color: s.fg }}>{text}</span>
}

function Inp({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          padding: '7px 10px', fontSize: 12, outline: 'none',
          border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)', background: 'var(--bg-primary)',
        }} />
    </div>
  )
}

function BtnEliminar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: '0.5px solid rgba(226,75,74,0.4)',
      borderRadius: 'var(--radius-sm)', color: '#e24b4a',
      fontSize: 11, padding: '3px 8px', cursor: 'pointer',
    }}>Eliminar</button>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div className="card animate-fade-in" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        borderRadius: 'var(--radius-lg)', padding: 24, zIndex: 201, width: 420,
        maxWidth: '90vw', boxShadow: 'var(--shadow-modal)',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>✕</button>
        </div>
        {children}
      </div>
    </>
  )
}

const searchInput = {
  flex: 1, padding: '7px 10px', fontSize: 12, outline: 'none',
  border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)', background: 'var(--bg-primary)',
}

const btnPrimary = {
  padding: '7px 16px', background: 'var(--text-primary)', color: 'var(--bg-primary)',
  border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', whiteSpace: 'nowrap' as const,
}

const tableHeader = {
  padding: '10px 16px', borderBottom: '0.5px solid var(--border)',
  fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const,
}

// ── Color badge por tipo de máquina ──────────────────────────────────────────
function badgeColorTipo(tipo: string): string {
  switch (tipo) {
    case 'inyeccion':         return 'blue'
    case 'soplado':           return 'green'
    case 'linea':             return 'orange'
    case 'acondicionamiento': return 'teal'
    default:                  return 'gray'
  }
}

function SeccionEmpleados() {
  const [lista,    setLista]    = useState<Empleado[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ cedula: '', nombre: '' })
  const [guardando,setGuardando]= useState(false)

  useEffect(() => {
    fetch(`${API}/auth/empleados`).then(r=>r.json()).then(d=>{setLista(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const filtrados = lista.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || e.cedula.includes(busqueda)
  )

  async function toggleActivo(emp: Empleado) {
    await fetch(`${API}/auth/empleados/${emp.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...emp,activo:!emp.activo})})
    setLista(prev => prev.map(e => e.id===emp.id ? {...e,activo:!e.activo} : e))
  }

  async function eliminar(emp: Empleado) {
    if (!window.confirm(`¿Eliminar a ${emp.nombre}?`)) return
    await fetch(`${API}/auth/empleados/${emp.id}`,{method:'DELETE'})
    setLista(prev => prev.filter(e => e.id!==emp.id))
  }

  async function crear() {
    if (!form.cedula||!form.nombre) return
    setGuardando(true)
    const r   = await fetch(`${API}/auth/empleados`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,activo:true})})
    const nuevo = await r.json()
    setLista(prev=>[...prev,nuevo])
    setForm({cedula:'',nombre:''});setModal(false);setGuardando(false)
  }

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." style={searchInput} />
        <button onClick={()=>setModal(true)} style={btnPrimary}>+ Nuevo empleado</button>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px 90px',...tableHeader}}>
          <span>Nombre</span><span>Cédula</span><span>Activo</span><span></span>
        </div>
        {loading && <div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Cargando...</div>}
        {filtrados.map((e,i)=>(
          <div key={e.id} className="animate-fade-in-up" style={{
            display:'grid',gridTemplateColumns:'1fr 1fr 80px 90px',
            padding:'11px 16px',alignItems:'center',
            borderBottom:i<filtrados.length-1?'0.5px solid var(--border)':'none',
            animationDelay:`${i*0.03}s`,
          }}>
            <span style={{fontSize:12,color:'var(--text-primary)'}}>{e.nombre}</span>
            <span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'monospace'}}>{e.cedula}</span>
            <Toggle activo={e.activo} onChange={()=>toggleActivo(e)} />
            <BtnEliminar onClick={()=>eliminar(e)} />
          </div>
        ))}
        {!loading&&filtrados.length===0&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Sin resultados</div>}
      </div>
      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>
        {lista.filter(e=>e.activo).length} activos · {lista.filter(e=>!e.activo).length} inactivos · {lista.length} total
      </div>
      {modal&&(
        <Modal title="Nuevo empleado" onClose={()=>setModal(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Inp label="Cédula" value={form.cedula} onChange={v=>setForm(f=>({...f,cedula:v}))} placeholder="Ej: 1234567890" />
            <Inp label="Nombre completo" value={form.nombre} onChange={v=>setForm(f=>({...f,nombre:v}))} placeholder="Ej: García López Juan" />
            <button onClick={crear} disabled={guardando} style={{...btnPrimary,marginTop:8,padding:'9px 0',width:'100%'}}>
              {guardando?'Guardando...':'Crear empleado'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SeccionLideres() {
  const [lista,    setLista]    = useState<Lider[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ cedula: '', nombre: '' })
  const [guardando,setGuardando]= useState(false)

  useEffect(() => {
    fetch(`${API}/auth/lideres`).then(r=>r.json()).then(d=>{setLista(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const filtrados = lista.filter(l =>
    l.nombre.toLowerCase().includes(busqueda.toLowerCase()) || l.cedula.includes(busqueda)
  )

  async function toggleActivo(lid: Lider) {
    await fetch(`${API}/auth/lideres/${lid.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...lid,activo:!lid.activo})})
    setLista(prev=>prev.map(l=>l.id===lid.id?{...l,activo:!l.activo}:l))
  }

  async function eliminar(lid: Lider) {
    if (!window.confirm(`¿Eliminar a ${lid.nombre}?`)) return
    await fetch(`${API}/auth/lideres/${lid.id}`,{method:'DELETE'})
    setLista(prev=>prev.filter(l=>l.id!==lid.id))
  }

  async function crear() {
    if (!form.cedula||!form.nombre) return
    setGuardando(true)
    const r = await fetch(`${API}/auth/lideres`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,activo:true})})
    const nuevo = await r.json()
    setLista(prev=>[...prev,nuevo]);setForm({cedula:'',nombre:''});setModal(false);setGuardando(false)
  }

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." style={searchInput} />
        <button onClick={()=>setModal(true)} style={btnPrimary}>+ Nuevo líder</button>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px 90px',...tableHeader}}>
          <span>Nombre</span><span>Cédula</span><span>Activo</span><span></span>
        </div>
        {loading&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Cargando...</div>}
        {filtrados.map((l,i)=>(
          <div key={l.id} className="animate-fade-in-up" style={{
            display:'grid',gridTemplateColumns:'1fr 1fr 80px 90px',
            padding:'11px 16px',alignItems:'center',
            borderBottom:i<filtrados.length-1?'0.5px solid var(--border)':'none',
            animationDelay:`${i*0.03}s`,
          }}>
            <span style={{fontSize:12,color:'var(--text-primary)'}}>{l.nombre}</span>
            <span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'monospace'}}>{l.cedula}</span>
            <Toggle activo={l.activo} onChange={()=>toggleActivo(l)} />
            <BtnEliminar onClick={()=>eliminar(l)} />
          </div>
        ))}
        {!loading&&filtrados.length===0&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Sin resultados</div>}
      </div>
      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>
        {lista.filter(l=>l.activo).length} activos · {lista.length} total
      </div>
      {modal&&(
        <Modal title="Nuevo líder" onClose={()=>setModal(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Inp label="Cédula" value={form.cedula} onChange={v=>setForm(f=>({...f,cedula:v}))} placeholder="Ej: 1234567890" />
            <Inp label="Nombre completo" value={form.nombre} onChange={v=>setForm(f=>({...f,nombre:v}))} placeholder="Ej: Martínez Díaz Pedro" />
            <button onClick={crear} disabled={guardando} style={{...btnPrimary,marginTop:8,padding:'9px 0',width:'100%'}}>
              {guardando?'Guardando...':'Crear líder'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SeccionProductos() {
  const [lista,    setLista]    = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [guardando,setGuardando]= useState(false)
  const [form,     setForm]     = useState({codigo:'',descripcion:'',ciclos:'',cavidades:'',material:''})

  useEffect(() => {
    fetch(`${API}/catalogos/productos`).then(r=>r.json()).then(d=>{setLista(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const filtrados = lista.filter(p =>
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.material.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function toggleActivo(prod: Producto) {
    await fetch(`${API}/catalogos/productos/${prod.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...prod,activo:!prod.activo})})
    setLista(prev=>prev.map(p=>p.id===prod.id?{...p,activo:!p.activo}:p))
  }

  async function eliminar(prod: Producto) {
    if (!window.confirm(`¿Eliminar "${prod.descripcion}"?`)) return
    await fetch(`${API}/catalogos/productos/${prod.id}`,{method:'DELETE'})
    setLista(prev=>prev.filter(p=>p.id!==prod.id))
  }

  async function crear() {
    if (!form.codigo||!form.descripcion) return
    setGuardando(true)
    const r = await fetch(`${API}/catalogos/productos`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,ciclos:Number(form.ciclos),cavidades:Number(form.cavidades),activo:true})})
    const nuevo = await r.json()
    setLista(prev=>[...prev,nuevo]);setForm({codigo:'',descripcion:'',ciclos:'',cavidades:'',material:''});setModal(false);setGuardando(false)
  }

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por código, descripción o material..." style={searchInput} />
        <button onClick={()=>setModal(true)} style={btnPrimary}>+ Nuevo producto</button>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'120px 1fr 100px 60px 60px 80px 90px',...tableHeader}}>
          <span>Código</span><span>Descripción</span><span>Material</span><span>Ciclo</span><span>Cav.</span><span>Activo</span><span></span>
        </div>
        {loading&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Cargando...</div>}
        {filtrados.map((p,i)=>(
          <div key={p.id} className="animate-fade-in-up" style={{
            display:'grid',gridTemplateColumns:'120px 1fr 100px 60px 60px 80px 90px',
            padding:'11px 16px',alignItems:'center',
            borderBottom:i<filtrados.length-1?'0.5px solid var(--border)':'none',
            animationDelay:`${i*0.02}s`,
          }}>
            <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{p.codigo}</span>
            <span style={{fontSize:12,color:'var(--text-primary)'}}>{p.descripcion}</span>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>{p.material}</span>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>{p.ciclos}s</span>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>{p.cavidades}</span>
            <Toggle activo={p.activo} onChange={()=>toggleActivo(p)} />
            <BtnEliminar onClick={()=>eliminar(p)} />
          </div>
        ))}
        {!loading&&filtrados.length===0&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Sin resultados</div>}
      </div>
      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>
        {lista.filter(p=>p.activo).length} activos · {lista.length} total
      </div>
      {modal&&(
        <Modal title="Nuevo producto" onClose={()=>setModal(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Inp label="Código" value={form.codigo} onChange={v=>setForm(f=>({...f,codigo:v}))} placeholder="Ej: 3240330005" />
            <Inp label="Descripción" value={form.descripcion} onChange={v=>setForm(f=>({...f,descripcion:v}))} placeholder="Ej: FRASCO COPROLOGICO" />
            <Inp label="Material" value={form.material} onChange={v=>setForm(f=>({...f,material:v}))} placeholder="Ej: polietileno de alta densidad" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Inp label="Ciclo (seg)" type="number" value={form.ciclos} onChange={v=>setForm(f=>({...f,ciclos:v}))} placeholder="Ej: 11" />
              <Inp label="Cavidades" type="number" value={form.cavidades} onChange={v=>setForm(f=>({...f,cavidades:v}))} placeholder="Ej: 4" />
            </div>
            <button onClick={crear} disabled={guardando} style={{...btnPrimary,marginTop:8,padding:'9px 0',width:'100%'}}>
              {guardando?'Guardando...':'Crear producto'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SeccionCausas() {
  // ── CAMBIO 1: agregado 'acondicionamiento' al tipo del estado ────────────────
  const [lista,      setLista]      = useState<CausaParada[]>([])
  const [busqueda,   setBusqueda]   = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos'|'inyeccion'|'soplado'|'linea'|'acondicionamiento'>('todos')
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [guardando,  setGuardando]  = useState(false)
  const [form,       setForm]       = useState({codigo:'',descripcion:'',tipo_maquina:'inyeccion',programada:false})

  useEffect(() => {
    fetch(`${API}/catalogos/causas-parada`).then(r=>r.json()).then(d=>{setLista(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const filtrados = lista.filter(c =>
    (tipoFiltro==='todos'||c.tipo_maquina===tipoFiltro) &&
    (c.descripcion.toLowerCase().includes(busqueda.toLowerCase())||String(c.codigo).includes(busqueda))
  )

  async function toggleActivo(c: CausaParada) {
    await fetch(`${API}/catalogos/causas-parada/${c.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,activa:!c.activa})})
    setLista(prev=>prev.map(x=>x.id===c.id?{...x,activa:!x.activa}:x))
  }

  async function eliminar(c: CausaParada) {
    if (!window.confirm(`¿Eliminar "${c.descripcion}"?`)) return
    await fetch(`${API}/catalogos/causas-parada/${c.id}`,{method:'DELETE'})
    setLista(prev=>prev.filter(x=>x.id!==c.id))
  }

  async function crear() {
    if (!form.codigo||!form.descripcion) return
    setGuardando(true)
    const r = await fetch(`${API}/catalogos/causas-parada`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,codigo:Number(form.codigo),activa:true})})
    const nuevo = await r.json()
    setLista(prev=>[...prev,nuevo]);setForm({codigo:'',descripcion:'',tipo_maquina:'inyeccion',programada:false});setModal(false);setGuardando(false)
  }

  const filterBtn = (t: typeof tipoFiltro) => ({
    fontSize: 11, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
    border: '0.5px solid' as const,
    borderColor: tipoFiltro===t ? 'var(--text-primary)' : 'var(--border)',
    background:  tipoFiltro===t ? 'var(--text-primary)' : 'var(--bg-primary)',
    color:       tipoFiltro===t ? 'var(--bg-primary)'   : 'var(--text-muted)',
    textTransform: 'capitalize' as const,
  })

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." style={{...searchInput,flex:1,minWidth:150}} />
        {/* CAMBIO 2: agregado 'acondicionamiento' al array de filtros */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {(['todos','inyeccion','soplado','linea','acondicionamiento'] as const).map(t=>(
            <button key={t} onClick={()=>setTipoFiltro(t)} style={filterBtn(t)}>
              {t === 'acondicionamiento' ? 'acond.' : t}
            </button>
          ))}
        </div>
        <button onClick={()=>setModal(true)} style={btnPrimary}>+ Nueva causa</button>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'55px 1fr 130px 110px 70px 90px',...tableHeader}}>
          <span>Cod.</span><span>Descripción</span><span>Tipo</span><span>Parada</span><span>Activa</span><span></span>
        </div>
        {loading&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Cargando...</div>}
        {filtrados.map((c,i)=>(
          <div key={c.id} className="animate-fade-in-up" style={{
            display:'grid',gridTemplateColumns:'55px 1fr 130px 110px 70px 90px',
            padding:'11px 16px',alignItems:'center',
            borderBottom:i<filtrados.length-1?'0.5px solid var(--border)':'none',
            animationDelay:`${i*0.02}s`,
          }}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text-muted)',fontFamily:'monospace'}}>{c.codigo}</span>
            <span style={{fontSize:12,color:'var(--text-primary)'}}>{c.descripcion}</span>
            {/* CAMBIO 3: función badgeColorTipo para el color correcto por tipo */}
            <Badge text={c.tipo_maquina} color={badgeColorTipo(c.tipo_maquina)} />
            <Badge text={c.programada?'Programada':'No programada'} color={c.programada?'gray':'red'} />
            <Toggle activo={c.activa} onChange={()=>toggleActivo(c)} />
            <BtnEliminar onClick={()=>eliminar(c)} />
          </div>
        ))}
        {!loading&&filtrados.length===0&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Sin resultados</div>}
      </div>
      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>
        {filtrados.length} causas · {lista.filter(c=>c.activa).length} activas total
      </div>
      {modal&&(
        <Modal title="Nueva causa de parada" onClose={()=>setModal(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <Inp label="Código" type="number" value={form.codigo} onChange={v=>setForm(f=>({...f,codigo:v}))} placeholder="Ej: 41" />
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <label style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Tipo máquina</label>
                {/* CAMBIO 4: agregada opción Acondicionamiento en el select */}
                <select value={form.tipo_maquina} onChange={e=>setForm(f=>({...f,tipo_maquina:e.target.value}))}
                  style={{padding:'7px 10px',fontSize:12,border:'0.5px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',background:'var(--bg-primary)'}}>
                  <option value="inyeccion">Inyección</option>
                  <option value="soplado">Soplado</option>
                  <option value="linea">Línea</option>
                  <option value="acondicionamiento">Acondicionamiento</option>
                </select>
              </div>
            </div>
            <Inp label="Descripción" value={form.descripcion} onChange={v=>setForm(f=>({...f,descripcion:v}))} placeholder="Ej: Falla en sistema hidráulico" />
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Toggle activo={form.programada} onChange={()=>setForm(f=>({...f,programada:!f.programada}))} />
              <span style={{fontSize:12,color:'var(--text-secondary)'}}>{form.programada?'Parada programada':'No programada'}</span>
            </div>
            <button onClick={crear} disabled={guardando} style={{...btnPrimary,marginTop:8,padding:'9px 0',width:'100%'}}>
              {guardando?'Guardando...':'Crear causa'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SeccionDesperdicios() {
  const [lista,    setLista]    = useState<TiposDesperdicio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [guardando,setGuardando]= useState(false)
  const [form,     setForm]     = useState({codigo:'',descripcion:''})

  useEffect(() => {
    fetch(`${API}/catalogos/tipos-desperdicio`).then(r=>r.json()).then(d=>{setLista(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const filtrados = lista.filter(d =>
    d.descripcion.toLowerCase().includes(busqueda.toLowerCase())||String(d.codigo).includes(busqueda)
  )

  async function toggleActivo(d: TiposDesperdicio) {
    await fetch(`${API}/catalogos/tipos-desperdicio/${d.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,activa:!d.activa})})
    setLista(prev=>prev.map(x=>x.id===d.id?{...x,activa:!x.activa}:x))
  }

  async function eliminar(d: TiposDesperdicio) {
    if (!window.confirm(`¿Eliminar "${d.descripcion}"?`)) return
    await fetch(`${API}/catalogos/tipos-desperdicio/${d.id}`,{method:'DELETE'})
    setLista(prev=>prev.filter(x=>x.id!==d.id))
  }

  async function crear() {
    if (!form.codigo||!form.descripcion) return
    setGuardando(true)
    const r = await fetch(`${API}/catalogos/tipos-desperdicio`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,codigo:Number(form.codigo),activa:true})})
    const nuevo = await r.json()
    setLista(prev=>[...prev,nuevo]);setForm({codigo:'',descripcion:''});setModal(false);setGuardando(false)
  }

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." style={searchInput} />
        <button onClick={()=>setModal(true)} style={btnPrimary}>+ Nuevo tipo</button>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'60px 1fr 70px 90px',...tableHeader}}>
          <span>Cod.</span><span>Descripción</span><span>Activo</span><span></span>
        </div>
        {loading&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Cargando...</div>}
        {filtrados.map((d,i)=>(
          <div key={d.id} className="animate-fade-in-up" style={{
            display:'grid',gridTemplateColumns:'60px 1fr 70px 90px',
            padding:'11px 16px',alignItems:'center',
            borderBottom:i<filtrados.length-1?'0.5px solid var(--border)':'none',
            animationDelay:`${i*0.02}s`,
          }}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--text-muted)',fontFamily:'monospace'}}>{d.codigo}</span>
            <span style={{fontSize:12,color:'var(--text-primary)'}}>{d.descripcion}</span>
            <Toggle activo={d.activa} onChange={()=>toggleActivo(d)} />
            <BtnEliminar onClick={()=>eliminar(d)} />
          </div>
        ))}
        {!loading&&filtrados.length===0&&<div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text-muted)'}}>Sin resultados</div>}
      </div>
      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>
        {lista.filter(d=>d.activa).length} activos · {lista.length} total
      </div>
      {modal&&(
        <Modal title="Nuevo tipo de desperdicio" onClose={()=>setModal(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Inp label="Código" type="number" value={form.codigo} onChange={v=>setForm(f=>({...f,codigo:v}))} placeholder="Ej: 25" />
            <Inp label="Descripción" value={form.descripcion} onChange={v=>setForm(f=>({...f,descripcion:v}))} placeholder="Ej: Empaque defectuoso" />
            <button onClick={crear} disabled={guardando} style={{...btnPrimary,marginTop:8,padding:'9px 0',width:'100%'}}>
              {guardando?'Guardando...':'Crear tipo'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// CAMBIO 5: contadores actualizados (176 causas, 41 tipos)
const TABS: {id:Tab;label:string;desc:string}[] = [
  {id:'empleados',    label:'Empleados',        desc:'Operarios'},
  {id:'lideres',      label:'Líderes',          desc:'Supervisores'},
  {id:'productos',    label:'Productos',        desc:'122 referencias'},
  {id:'causas',       label:'Causas de parada', desc:'176 causas'},
  {id:'desperdicios', label:'Desperdicios',     desc:'41 tipos'},
]

export default function CatalogosPage() {
  const [tab, setTab] = useState<Tab>('empleados')

  return (
    <div>
      <div className="card" style={{
        padding:'10px 16px', marginBottom:16, borderRadius:'var(--radius-md)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>Catálogos</span>
        <span style={{fontSize:11,color:'var(--text-muted)'}}>Toggle para activar/desactivar · Eliminar para borrar</span>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 16px', borderRadius:'var(--radius-md)', cursor:'pointer',
            border:'0.5px solid',
            borderColor: tab===t.id ? 'var(--text-primary)' : 'var(--border)',
            background:  tab===t.id ? 'var(--text-primary)' : 'var(--bg-primary)',
            color:       tab===t.id ? 'var(--bg-primary)'   : 'var(--text-muted)',
            fontSize:12, fontWeight: tab===t.id ? 600 : 400,
            display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2,
            transition:'all var(--transition)',
          }}>
            <span>{t.label}</span>
            <span style={{fontSize:10,opacity:0.6}}>{t.desc}</span>
          </button>
        ))}
      </div>

      <div className="page-enter">
        {tab==='empleados'    && <SeccionEmpleados />}
        {tab==='lideres'      && <SeccionLideres />}
        {tab==='productos'    && <SeccionProductos />}
        {tab==='causas'       && <SeccionCausas />}
        {tab==='desperdicios' && <SeccionDesperdicios />}
      </div>
    </div>
  )
}