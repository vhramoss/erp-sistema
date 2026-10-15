import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, companyId: string) {
    if (id !== companyId) throw new ForbiddenException('Acesso negado');
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true, name: true, cnpj: true, email: true, phone: true,
        address: true, city: true, state: true, zipCode: true, logo: true,
        plan: true, isActive: true, createdAt: true,
        _count: { select: { users: true, products: true, customers: true, orders: true } },
      },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, companyId: string) {
    if (id !== companyId) throw new ForbiddenException('Acesso negado');
    await this.findOne(id, companyId);
    return this.prisma.company.update({ where: { id }, data: dto });
  }
}
