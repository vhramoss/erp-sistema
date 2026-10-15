'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Users, ShoppingCart, DollarSign,
  Settings, LogOut, Building2, Menu, X, Crown,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../lib/api';
import { cn } from '../../lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Produtos' },
  { href: '/customers', icon: Users, label: 'Clientes' },
  { href: '/orders', icon: ShoppingCart, label: 'Pedidos' },
  { href: '/financial', icon: DollarSign, label: 'Financeiro' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
];

const roleLabels: Record<string, string> = {
  PLATFORM_OWNER: 'Dono da plataforma',
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Gestor',
  EMPLOYEE: 'Funcionário',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push('/login');
  };

  if (!isAuthenticated) return null;

  const roleLabel = roleLabels[user?.role ?? ''] ?? user?.role;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="bg-primary/15 ring-1 ring-primary/30 p-2 rounded-lg">
            <Building2 className="text-primary w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate tracking-tight">ERP Sistema</p>
            <p className="text-xs text-muted-foreground truncate">{user?.company?.name ?? 'Plataforma'}</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                {user?.role === 'PLATFORM_OWNER' && <Crown size={11} className="text-amber-400" />}
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-muted-foreground" />
          </button>
          <span className="font-semibold text-foreground">ERP Sistema</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
