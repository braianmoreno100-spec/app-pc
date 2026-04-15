import { Button } from "./ui/button"


export function Navigation() {
  return (
    <nav className="border-b bg-background/75 sticky top-0 z-50 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Producción
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2 md:gap-4">
          <Button variant="ghost">Inicio</Button>
          <Button variant="ghost">OEE</Button>
          <Button variant="ghost">Órdenes</Button>
        </div>
      </div>
    </nav>
  )
}

