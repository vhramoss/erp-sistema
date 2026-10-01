import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, companyId: string) {
    const exists = await this.prisma.category.findFirst({
      where: { name: dto.name, companyId },
    });
    if (exists) throw new ConflictException('Categoria já cadastrada para esta empresa');

    return this.prisma.category.create({
      data: { ...dto, companyId },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.category.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const category = await this.prisma.category.findFirst({ where: { id, companyId } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.category.update({ where: { id }, data: { isActive: false } });
    return { message: 'Categoria desativada com sucesso' };
  }
}
