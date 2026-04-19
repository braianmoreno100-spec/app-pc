import { Routes, Route } from 'react-router-dom'
import Layout from './app/layout'
import InicioPage from './app/inicio/page'
import OeePage from './app/oee/page'
import OrdenesPage from './app/ordenes/page'
import CatalogosPage from './app/catalogos/page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<InicioPage />} />
        <Route path="oee"       element={<OeePage />} />
        <Route path="ordenes"   element={<OrdenesPage />} />
       <Route path="catalogos" element={<CatalogosPage />} />
        <Route path="reportes"  element={<div style={{padding:20, fontSize:13, color:'#888'}}>Reportes — próximamente</div>} />
      </Route>
    </Routes>
  )
}