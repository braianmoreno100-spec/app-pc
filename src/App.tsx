import { Routes, Route } from 'react-router-dom'
import Layout from './app/layout'
import InicioPage from './app/inicio/page'
import OeePage from './app/oee/page'
import OrdenesPage from './app/ordenes/page'
import CatalogosPage from './app/catalogos/page'
import ConsumoPage from './app/consumo/page'
import ReportesPage from './app/reportes/page'
import MantenimientoPage from './app/mantenimiento/page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<InicioPage />} />
        <Route path="oee"       element={<OeePage />} />
        <Route path="ordenes"   element={<OrdenesPage />} />
        <Route path="catalogos" element={<CatalogosPage />} />
        <Route path="/consumo" element={<ConsumoPage />} />
        <Route path="mantenimiento" element={<MantenimientoPage />} />
        <Route path="reportes" element={<ReportesPage />} />
      </Route>
    </Routes>
  )
}