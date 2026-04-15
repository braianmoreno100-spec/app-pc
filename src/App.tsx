import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './app/layout'
import { InicioPage } from './app/inicio/page'


// Pages placeholder
function OeePage() {
  return <div className="container mx-auto p-8 min-h-screen py-20">
    <h1 className="text-4xl font-bold mb-8">OEE Dashboard</h1>
    <p>Gráficas Recharts tendencia OEE por línea - En desarrollo</p>
  </div>
}

function OrdenesPage() {
  return <div className="container mx-auto p-8 min-h-screen py-20">
    <h1 className="text-4xl font-bold mb-8">Órdenes</h1>
    <p>Tabla shadcn órdenes activas/cerradas via API - En desarrollo</p>
  </div>
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="oee" element={<OeePage />} />
            <Route path="ordenes" element={<OrdenesPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App

