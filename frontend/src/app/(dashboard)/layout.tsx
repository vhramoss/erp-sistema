'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Users, ShoppingCart, DollarSign,
  Bot, Settings, LogOut, Building2, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Building2 className="text-white w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">ERP Sistema</p>
            <p className="text-xs text-gray-500 truncate">{user?.company?.name}</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">ERP Sistema</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
