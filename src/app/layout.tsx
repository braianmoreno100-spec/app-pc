import { Outlet } from 'react-router-dom'
import { Navigation } from '../components/navigation'

export function Layout() {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  )
}

