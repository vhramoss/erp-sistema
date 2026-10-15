# ERP Multi-Tenant para PMEs

Sistema de gestão empresarial completo com arquitetura multi-tenant, autenticação JWT, banco de dados na nuvem (Supabase/PostgreSQL), backend em NestJS e frontend em Next.js 15.

## 🚀 Tecnologias

- **Backend:** NestJS, Prisma, PostgreSQL (Supabase), JWT.
- **Frontend:** Next.js 15, Tailwind CSS, React Query, Zustand.
- **Infra:** Deploy na Vercel, Banco de dados Supabase.

<<<<<<< HEAD
---

## 2. ESTRUTURA DE PASTAS

```
erp-sistema/
├── backend/                    # NestJS + Prisma + JWT + Anthropic
│   ├── src/
│   │   ├── main.ts             # Bootstrap com Swagger, Helmet, CORS
│   │   ├── app.module.ts       # Módulo raiz com todos os imports
│   │   ├── prisma/             # PrismaService global
│   │   ├── common/
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   ├── filters/        # HttpExceptionFilter global
│   │   │   ├── interceptors/   # LoggingInterceptor, TransformInterceptor
│   │   │   └── decorators/     # @CurrentUser, @Roles, @Public
│   │   └── modules/
│   │       ├── auth/           # Login, registro, refresh token, logout
│   │       ├── users/          # CRUD usuários com troca de senha
│   │       ├── companies/      # Dados do tenant
│   │       ├── products/       # Catálogo + controle de estoque
│   │       ├── customers/      # CRM básico
│   │       ├── orders/         # Pedidos com workflow de status
│   │       ├── financial/      # Transações + resumo financeiro
│   │       └── dashboard/      # KPIs + gráfico de faturamento
│   ├── prisma/
│   │   ├── schema.prisma       # Schema completo multi-tenant
│   │   └── seed.ts             # Dados de demonstração
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # Next.js 15 + Tailwind + React Query
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login e registro (rotas públicas)
│       │   └── (dashboard)/    # Área autenticada com sidebar
│       │       ├── dashboard/  # KPIs, gráfico, pedidos recentes
│       │       ├── products/   # Lista de produtos com busca
│       │       ├── customers/  # Lista de clientes
│       │       ├── orders/     # Pedidos com filtro por status
│       │       ├── financial/  # Extrato + resumo financeiro
│       │       └── settings/   # Configurações da conta
│       ├── lib/
│       │   ├── api.ts          # Axios + interceptors de token
│       │   └── utils.ts        # Formatadores BR (moeda, data)
│       └── store/
│           └── auth.store.ts   # Zustand com persist
│
├── docker-compose.yml          # PostgreSQL + backend + frontend
└── RELATORIO.md               # Este arquivo
```

---

## 3. TECNOLOGIAS UTILIZADAS
=======
## 🛠️ Como Rodar (Local)
>>>>>>> fix/mudanca-no-site-pra-tirar-ia

### Backend
1. `cd backend`
2. `npm install`
3. Configurar `.env` com `DATABASE_URL` e `DIRECT_URL` do Supabase.
4. `npx prisma migrate dev --name init`
5. `npm run start:dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. Configurar `.env.local` com `NEXT_PUBLIC_API_URL`.
4. `npm run dev`

## 📦 Deploy Vercel
O projeto está configurado para deploy na Vercel:
- **Backend:** Root directory `backend`.
- **Frontend:** Root directory `frontend`.
