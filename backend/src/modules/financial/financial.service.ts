import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, FinancialQueryDto } from './dto/financial.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto, companyId: string) {
    return this.prisma.financialTransaction.create({
      data: {
        ...dto,
        amount: new Prisma.Decimal(dto.amount),
        date: new Date(dto.date),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        companyId,
      },
    });
  }

  async findAll(query: FinancialQueryDto, companyId: string) {
    const { type, category, isPaid, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { companyId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, companyId: string) {
    const transaction = await this.prisma.financialTransaction.findFirst({ where: { id, companyId } });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.amount && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
      },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.financialTransaction.delete({ where: { id } });
    return { message: 'Transação removida com sucesso' };
  }

  async getSummary(companyId: string, startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = { companyId };
    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [income, expense] = await Promise.all([
      this.prisma.financialTransaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.financialTransaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Number(expense._sum.amount || 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount: income._count,
      expenseCount: expense._count,
    };
  }
}
