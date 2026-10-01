import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const productIds = dto.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, companyId, isActive: true },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('Um ou mais produtos não encontrados ou inativos');
      }

      // Validate stock and calculate item totals
      const items = dto.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Estoque insuficiente para o produto: ${product.name}`);
        }
        const price = Number(product.price);
        const discount = item.discount || 0;
        const total = (price - discount) * item.quantity;
        return { ...item, price, discount, total };
      });

      const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const orderDiscount = dto.discount || 0;
      const total = subtotal - orderDiscount;

      // Get next order number inside transaction to avoid duplicates
      const lastOrder = await tx.order.findFirst({
        where: { companyId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      const number = (lastOrder?.number || 0) + 1;

      const order = await tx.order.create({
        data: {
          number,
          companyId,
          customerId: dto.customerId,
          paymentMethod: dto.paymentMethod || 'CASH',
          notes: dto.notes,
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(orderDiscount),
          total: new Prisma.Decimal(total),
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: new Prisma.Decimal(i.price),
              discount: new Prisma.Decimal(i.discount),
              total: new Prisma.Decimal(i.total),
            })),
          },
          transactions: {
            create: {
              type: 'INCOME',
              category: 'SALE',
              description: `Venda #${number}`,
              amount: new Prisma.Decimal(total),
              date: new Date(),
              isPaid: dto.paymentMethod === 'CASH' || dto.paymentMethod === 'PIX',
              companyId,
            },
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          customer: { select: { id: true, name: true, email: true } },
        },
      });

      // Decrement stock
      await Promise.all(
        items.map((i) =>
          tx.product.update({
            where: { id: i.productId },
            data: { stock: { decrement: i.quantity } },
          }),
        ),
      );

      return order;
    });
  }


  async findAll(query: OrderQueryDto, companyId: string) {
    const { status, customerId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: {
          include: { product: { select: { id: true, name: true, sku: true, unit: true } } },
        },
        transactions: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, companyId: string) {
    const order = await this.findOne(id, companyId);

    const transitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (!transitions[order.status]?.includes(dto.status)) {
      throw new ConflictException(`Transição inválida: ${order.status} → ${dto.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Estorno de estoque e financeiro se for cancelado
      if (dto.status === 'CANCELLED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.financialTransaction.updateMany({
          where: { orderId: id },
          data: { isPaid: false, notes: 'Estornado por cancelamento de pedido' },
        });
      }

      return tx.order.update({ where: { id }, data: { status: dto.status } });
    });
  }
}
