import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

const MaquinasDemo = [
  { id: 1, nombre: 'Inyección 1', oee: 92.5, tipo: 'inyeccion', color: 'verde' },
  { id: 2, nombre: 'Soplado 1', oee: 95.2, tipo: 'soplado', color: 'azul' },
  { id: 3, nombre: 'Línea Copro', oee: 72.1, tipo: 'linea', color: 'naranja' },
  { id: 4, nombre: 'Línea Orina', oee: 88.4, tipo: 'linea', color: 'verde' },
]

export function InicioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Inicio - Tiempo Real
          </h1>
          <p className="text-xl text-muted-foreground">
            OEE live por máquina via Socket.IO
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MaquinasDemo.map((maquina) => (
            <Card key={maquina.id} className="hover:shadow-2xl transition-all group border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full bg-${maquina.color === 'verde' ? 'emerald' : maquina.color === 'azul' ? 'blue' : maquina.color === 'naranja' ? 'orange' : 'red'}-500 shadow-lg`}></div>
                  <CardTitle className="text-xl group-hover:scale-105 transition-transform">
                    {maquina.nombre}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold text-emerald-600">
                      {maquina.oee}%
                    </span>
                    <span className="text-sm text-muted-foreground uppercase tracking-wide">
                      {maquina.tipo}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        maquina.color === 'verde' ? 'bg-emerald-500' :
                        maquina.color === 'azul' ? 'bg-blue-500' :
                        maquina.color === 'naranja' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{width: `${maquina.oee}%`}}
                    />
                  </div>
                  <Button className="w-full">
                    Ver Detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

