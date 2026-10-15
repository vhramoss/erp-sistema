'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Package, Users, ShoppingCart, DollarSign,
  AlertTriangle, Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../../../lib/api';
import { formatCurrency, formatPercent, formatDate } from '../../../lib/utils';

interface DashboardMetrics {
  kpis: {
    totalProducts: number;
    totalCustomers: number;
    currentMonthOrders: number;
    currentRevenue: number;
    revenueGrowth: number;
    ordersGrowth: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  recentOrders: Array<{ id: string; number: number; status: string; total: number; createdAt: string; customer?: { name: string } }>;
  topProducts: Array<{ name: string; sku?: string; totalSold?: number }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente', CONFIRMED: 'Confirmado', PROCESSING: 'Processando',
  SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado',
};

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getMetrics() as Promise<DashboardMetrics>,
  });

  const { data: chartData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: () => dashboardApi.getRevenueChart() as Promise<Array<{ month: string; revenue: number; orders: number }>>,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpis = metrics?.kpis;

  const kpiCards = [
    { label: 'Faturamento (mês)', value: formatCurrency(kpis?.currentRevenue || 0), growth: kpis?.revenueGrowth, icon: DollarSign, color: 'blue' },
    { label: 'Pedidos (mês)', value: kpis?.currentMonthOrders || 0, growth: kpis?.ordersGrowth, icon: ShoppingCart, color: 'purple' },
    { label: 'Total de Produtos', value: kpis?.totalProducts || 0, icon: Package, color: 'green' },
    { label: 'Total de Clientes', value: kpis?.totalCustomers || 0, icon: Users, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Alerts */}
      {(kpis?.pendingOrders || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <Clock size={18} className="text-yellow-600 flex-shrink-0" />
          <span className="text-yellow-800 text-sm">
            <strong>{kpis?.pendingOrders}</strong> pedidos aguardando confirmação
          </span>
        </div>
      )}
      {(kpis?.lowStockProducts || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <span className="text-red-800 text-sm">
            <strong>{kpis?.lowStockProducts}</strong> produtos com estoque baixo
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, growth, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`bg-${color}-100 p-2 rounded-lg`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {growth !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {formatPercent(growth)} vs mês anterior
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Faturamento Mensal</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h2>
          <div className="space-y-3">
            {metrics?.topProducts?.length === 0 && <p className="text-gray-400 text-sm">Nenhum dado disponível</p>}
            {metrics?.topProducts?.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                </div>
                <span className="text-sm font-semibold text-blue-600">{p.totalSold} un</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Pedidos Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">#</th>
                <th className="text-left py-2 text-gray-500 font-medium">Cliente</th>
                <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                <th className="text-right py-2 text-gray-500 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recentOrders?.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-mono text-gray-900">#{order.number}</td>
                  <td className="py-3 text-gray-600">{order.customer?.name || 'Consumidor final'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                  <td className="py-3 text-right text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!metrics?.recentOrders?.length && <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido encontrado</p>}
        </div>
      </div>
    </div>
  );
}
