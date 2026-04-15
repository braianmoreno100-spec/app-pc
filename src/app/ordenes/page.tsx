// Placeholder Órdenes
export default function Ordenes() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Órdenes</h2>
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="flex gap-4 mb-4">
            <Button variant="outline">Activas</Button>
            <Button variant="outline">Cerradas</Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded">
              <div>
                <div className="font-semibold">ORD-001</div>
                <div className="text-sm text-muted-foreground">Inyección #1 - Líder: Juan Pérez</div>
              </div>
              <div className="text-right">
                <div>Activa</div>
                <div className="text-sm">Creada: 2024-01-15</div>
              </div>
            </div>
            {/* Más filas */}
          </div>
        </div>
      </div>
    </div>
  );
}

