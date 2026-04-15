// Placeholder OEE - Gráficas Recharts
export default function OEE() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Análisis OEE</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Tendencia OEE por Día</h3>
          <div className="h-80 bg-muted rounded">Gráfica Recharts aquí (post npm install)</div>
        </div>
        <div className="bg-card p-8 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Desglose OEE</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">92%</div>
              <div>Disponibilidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div>Rendimiento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">97%</div>
              <div>Calidad</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

