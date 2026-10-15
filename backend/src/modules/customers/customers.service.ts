import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, companyId: string) {
    return this.prisma.customer.create({ data: { ...dto, companyId } });
  }

  async findAll(query: CustomerQueryDto, companyId: string) {
    const { search, type, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, number: true, status: true, total: true, createdAt: true },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.customer.update({ where: { id }, data: { isActive: false } });
    return { message: 'Cliente desativado com sucesso' };
  }
}
