import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  const company = await prisma.company.upsert({
    where: { cnpj: '12.345.678/0001-90' },
    update: {},
    create: {
      name: 'Empresa Demo Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@empresa-demo.com',
      phone: '(11) 3000-0000',
      city: 'São Paulo',
      state: 'SP',
      plan: 'PROFESSIONAL',
    },
  });

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@empresa-demo.com' },
    update: {},
    create: {
      name: 'Administrador Demo',
      email: 'admin@empresa-demo.com',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  const category = await prisma.category.upsert({
    where: { name_companyId: { name: 'Eletrônicos', companyId: company.id } },
    update: {},
    create: { name: 'Eletrônicos', color: '#3b82f6', companyId: company.id },
  });

  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Notebook Dell Inspiron', sku: 'NB-001', price: 4999.99, cost: 3500, stock: 15, minStock: 3, categoryId: category.id, companyId: company.id },
      { name: 'Mouse Logitech MX', sku: 'MS-001', price: 299.90, cost: 150, stock: 50, minStock: 10, categoryId: category.id, companyId: company.id },
      { name: 'Teclado Mecânico', sku: 'KB-001', price: 459.90, cost: 200, stock: 3, minStock: 5, categoryId: category.id, companyId: company.id },
    ],
  });

  console.log('✅ Seed concluído!');
  console.log('📧 Login: admin@empresa-demo.com');
  console.log('🔑 Senha: Admin@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
