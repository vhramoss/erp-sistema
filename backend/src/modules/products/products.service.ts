import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto, companyId: string) {
    if (dto.sku) {
      const exists = await this.prisma.product.findUnique({
        where: { sku_companyId: { sku: dto.sku, companyId } },
      });
      if (exists) throw new ConflictException('SKU já cadastrado para esta empresa');
    }

    return this.prisma.product.create({
      data: { ...dto, companyId },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: ProductQueryDto, companyId: string) {
    const { search, categoryId, isActive, lowStock, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (lowStock) {
      const products = await this.prisma.product.findMany({ where: { companyId } });
      const lowStockIds = products.filter(p => p.stock <= p.minStock).map(p => p.id);
      if (lowStockIds.length > 0) {
        where.id = { in: lowStockIds };
      } else {
        where.id = { in: [] }; // Forçar resultado vazio se nenhum estiver baixo
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, companyId: string) {
    await this.findOne(id, companyId);
    if (dto.sku) {
      const exists = await this.prisma.product.findFirst({
        where: { sku: dto.sku, companyId, NOT: { id } },
      });
      if (exists) throw new ConflictException('SKU já cadastrado para outro produto');
    }
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: 'Produto desativado com sucesso' };
  }

  async updateStock(id: string, quantity: number, companyId: string) {
    const product = await this.findOne(id, companyId);
    const newStock = product.stock + quantity;
    if (newStock < 0) throw new ConflictException('Estoque insuficiente');
    return this.prisma.product.update({ where: { id }, data: { stock: newStock } });
  }
}
