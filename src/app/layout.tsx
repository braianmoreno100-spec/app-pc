// src/app/layout.tsx
import { NavLink, Outlet } from 'react-router-dom'
import { Home, BarChart2, ClipboardList, Settings, FileDown, Zap, Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'

const navItems = [
  { to: '/',          label: 'Inicio',    icon: Home          },
  { to: '/oee',       label: 'OEE',       icon: BarChart2     },
  { to: '/ordenes',   label: 'Órdenes',   icon: ClipboardList },
  { to: '/consumo',   label: 'Consumo',   icon: Zap           },
  { to: '/catalogos', label: 'Catálogos', icon: Settings      },
  { to: '/reportes',  label: 'Reportes',  icon: FileDown      },
  { to: '/mantenimiento', label: 'Mantenimiento', icon: Wrench },
]

function useTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return prefersDark
  })

  useEffect(() => {
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark')
      html.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}

export default function Layout() {
  const { dark, toggle } = useTheme()

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'var(--bg-secondary)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
        background: 'var(--sidebar-bg)',
        borderRight: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 16px 0',
        transition: 'background var(--transition), border-color var(--transition)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 16px 16px',
          borderBottom: '0.5px solid var(--border)',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Control Producción
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Plásticos · Dashboard
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 8px' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{ position: 'relative' }}
            >
              <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} />
              <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '0.5px solid var(--border)',
          marginTop: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {dark ? <Moon size={12} color='var(--text-muted)' /> : <Sun size={12} color='var(--text-muted)' />}
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {dark ? 'Oscuro' : 'Claro'}
              </span>
            </div>
            <div className="theme-toggle" onClick={toggle}>
              <div className="theme-toggle-thumb" />
            </div>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-hint)', marginBottom: 2 }}>Servidor</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            localhost:8000
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{
        flex: 1, overflow: 'auto',
        padding: '20px 24px',
        minWidth: 0,
        background: 'var(--bg-secondary)',
        transition: 'background var(--transition)',
      }}>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}