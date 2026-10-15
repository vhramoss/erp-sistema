import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalProducts,
      totalCustomers,
      currentMonthOrders,
      lastMonthOrders,
      currentMonthRevenue,
      lastMonthRevenue,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.product.count({ where: { companyId, isActive: true } }),
      this.prisma.customer.count({ where: { companyId, isActive: true } }),
      this.prisma.order.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
      this.prisma.order.count({ where: { companyId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      this.prisma.order.aggregate({
        where: { companyId, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { companyId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.product.count({ where: { companyId, isActive: true, stock: { lte: 5 } } }),
      this.prisma.order.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { companyId, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        });
        return { ...product, totalSold: item._sum.quantity };
      }),
    );

    const currentRevenue = Number(currentMonthRevenue._sum.total || 0);
    const lastRevenue = Number(lastMonthRevenue._sum.total || 0);
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const ordersGrowth = lastMonthOrders > 0 ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;

    return {
      kpis: {
        totalProducts,
        totalCustomers,
        currentMonthOrders,
        currentRevenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10,
        pendingOrders,
        lowStockProducts,
      },
      recentOrders,
      topProducts: topProductsWithDetails,
    };
  }

  async getRevenueChart(companyId: string, months = 6) {
    const data: { month: string; revenue: number; orders: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.order.aggregate({
        where: { companyId, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true,
      });

      data.push({
        month: start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        revenue: Number(result._sum.total || 0),
        orders: result._count,
      });
    }

    return data;
  }
}
