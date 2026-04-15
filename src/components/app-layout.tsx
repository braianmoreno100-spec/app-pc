import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Activity, 
  FileText 
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/oee', label: 'OEE', icon: Activity },
  { href: '/ordenes', label: 'Órdenes', icon: FileText },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="flex h-16 items-center px-8">
          <h1 className="text-xl font-bold">Dashboard Producción Plásticos</h1>
          <div className="ml-auto flex gap-2">
            {NAV_ITEMS.map((item) => (
              <Button key={item.href} variant={location.pathname === item.href ? 'default' : 'ghost'} asChild size="sm">
                <Link to={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </nav>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
}

