# RELATÓRIO COMPLETO — SISTEMA ERP MULTI-TENANT
**Data:** 22/04/2026  
**Versão:** 1.0.0  
**Localização:** `~/Desktop/erp-sistema/`

---

## 1. VISÃO GERAL DO PROJETO

Sistema ERP completo para pequenas e médias empresas, com arquitetura multi-tenant, autenticação JWT, banco de dados na nuvem (Supabase/PostgreSQL), LLM integrado (Claude via Anthropic SDK), backend em NestJS e frontend em Next.js 15.

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

### Backend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| NestJS | 11.x | Framework Node.js modular e escalável |
| Prisma | 6.x | ORM type-safe para PostgreSQL |
| @nestjs/jwt | 11.x | Autenticação JWT |
| passport-jwt | 4.x | Estratégia JWT com Passport |
| bcrypt | 5.x | Hash de senhas (salt 12 rounds) |
| @anthropic-ai/sdk | 0.39.x | Integração com Claude (LLM) |
| @nestjs/swagger | 11.x | Documentação OpenAPI automática |
| @nestjs/throttler | 6.x | Rate limiting por rota |
| helmet | 8.x | Headers HTTP de segurança |
| compression | 1.x | Compressão GZIP das respostas |
| class-validator | 0.15.x | Validação de DTOs |
| class-transformer | 0.5.x | Transformação de tipos |

### Frontend
| Tecnologia | Versão | Finalidade |
|---|---|---|
| Next.js | 15.x | Framework React com App Router |
| React | 19.x | Biblioteca UI |
| TanStack Query | 5.x | Server state management |
| Zustand | 5.x | Client state (auth persist) |
| Axios | 1.x | Cliente HTTP com interceptors |
| Tailwind CSS | 3.x | Utilitários CSS |
| Recharts | 2.x | Gráficos (AreaChart) |
| React Hook Form | 7.x | Formulários performáticos |
| Zod | 3.x | Validação de schemas |
| Lucide React | 0.46.x | Ícones SVG |

---

## 4. BANCO DE DADOS — SCHEMA COMPLETO

### Entidades e Relacionamentos

```
Company (Tenant)
├── User[]          (1:N) — múltiplos usuários por empresa
├── Product[]       (1:N) — catálogo isolado por empresa
├── Category[]      (1:N) — categorias de produtos
├── Customer[]      (1:N) — clientes isolados por empresa
├── Order[]         (1:N) — pedidos com itens
│   └── OrderItem[] (1:N) — itens do pedido → Product
├── FinancialTransaction[] (1:N) — lançamentos financeiros
└── AiConversation[] (1:N) — histórico do chat IA
    └── AiMessage[] (1:N) — mensagens da conversa
```

### Enums implementados
- **Plan**: FREE | STARTER | PROFESSIONAL | ENTERPRISE
- **UserRole**: SUPER_ADMIN | ADMIN | MANAGER | USER
- **OrderStatus**: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED | CANCELLED | REFUNDED
- **PaymentMethod**: CASH | CREDIT_CARD | DEBIT_CARD | PIX | BANK_TRANSFER | BOLETO
- **TransactionType**: INCOME | EXPENSE
- **TransactionCategory**: SALE | PURCHASE | SALARY | RENT | UTILITIES | TAXES | MAINTENANCE | MARKETING | OTHER
- **CustomerType**: INDIVIDUAL | COMPANY

---

## 5. AUTENTICAÇÃO E SEGURANÇA

### Fluxo JWT (Access + Refresh Token)
1. **Login** → gera `accessToken` (15min) + `refreshToken` (7d)
2. **Requests** → envia `Bearer {accessToken}` no header
3. **Expirado** → cliente usa `/auth/refresh` com refresh token
4. **Logout** → limpa `refreshToken` do banco (invalidação server-side)

### Segurança implementada
- `bcrypt` com 12 salt rounds para senhas
- Senhas validadas com regex: maiúscula + minúscula + número + especial
- `JwtStrategy` valida usuário ativo no banco a cada request
- `RolesGuard` com hierarquia: SUPER_ADMIN > ADMIN > MANAGER > USER
- `ThrottlerGuard` global: 100 req/min por IP
- Rate limit reduzido em rotas sensíveis: login (10/min), registro (5/min), chat IA (20/min)
- `Helmet` configura headers de segurança HTTP
- CORS restrito à origem configurada
- `@Public()` decorator para rotas sem autenticação
- Multi-tenant: todo acesso filtrado por `companyId` do token JWT

### Multi-Tenancy
- Cada empresa tem `companyId` único
- O `JwtStrategy` retorna `companyId` no payload
- Todos os services verificam `companyId` para isolar dados
- Nenhum dado de uma empresa é visível para outra

---

## 6. MÓDULOS DO BACKEND

### Auth Module
| Endpoint | Método | Acesso | Descrição |
|---|---|---|---|
| `/api/v1/auth/register` | POST | Público | Cadastra empresa + admin |
| `/api/v1/auth/login` | POST | Público | Retorna tokens JWT |
| `/api/v1/auth/refresh` | POST | Público | Renova access token |
| `/api/v1/auth/logout` | POST | Autenticado | Invalida refresh token |
| `/api/v1/auth/me` | GET | Autenticado | Dados do usuário logado |

### Products Module
| Endpoint | Método | Roles | Descrição |
|---|---|---|---|
| `/api/v1/products` | GET | USER+ | Lista com busca, filtros e paginação |
| `/api/v1/products` | POST | MANAGER+ | Cria produto |
| `/api/v1/products/:id` | GET | USER+ | Produto por ID |
| `/api/v1/products/:id` | PATCH | MANAGER+ | Atualiza produto |
| `/api/v1/products/:id` | DELETE | ADMIN | Desativa produto (soft delete) |

### Orders Module
- Cria pedido: valida estoque, calcula totais, decrementa estoque em **transação atômica**
- Cria lançamento financeiro automaticamente ao criar pedido
- Workflow de status com validação de transições

### Financial Module
- CRUD de transações manuais
- `GET /financial/summary` — receitas, despesas, saldo do período

### AI Module (Anthropic Claude)
- Chat contextual com dados reais da empresa
- Contexto automático: produtos, clientes, pedidos 30 dias, saldo
- Histórico de conversas persistido no banco
- Modelo configurável via `ANTHROPIC_MODEL` (padrão: claude-haiku-4-5)

### Dashboard Module
- KPIs: faturamento, pedidos, crescimento vs mês anterior
- Alertas: pedidos pendentes, produtos com estoque baixo
- Top 5 produtos mais vendidos
- Últimos 5 pedidos
- Gráfico de faturamento dos últimos N meses

---

## 7. FRONTEND — PÁGINAS IMPLEMENTADAS

| Rota | Descrição |
|---|---|
| `/login` | Formulário de login com validação Zod |
| `/register` | Cadastro de empresa + admin |
| `/dashboard` | KPIs, gráfico de receita, pedidos recentes |
| `/products` | Listagem com busca, alertas de estoque baixo |
| `/customers` | Listagem com contagem de pedidos |
| `/orders` | Filtro por status, tabela completa |
| `/financial` | Extrato + cards de receita/despesa/saldo |
| `/ai-assistant` | Chat com Claude, histórico de conversas |
| `/settings` | Dados da conta e empresa |

### Arquitetura Frontend
- **App Router** (Next.js 15) com Route Groups `(auth)` e `(dashboard)`
- **Layout sidebar** responsivo com drawer mobile
- **TanStack Query** para cache e sincronização de dados
- **Zustand** com `persist` para sessão do usuário
- **Axios interceptors** para injeção de token e auto-refresh
- **Proteção de rotas** por `isAuthenticated` no layout

---

## 8. RESPOSTAS PADRONIZADAS DA API

Todas as respostas bem-sucedidas:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-22T19:00:00.000Z"
}
```

Erros:
```json
{
  "statusCode": 422,
  "timestamp": "2026-04-22T19:00:00.000Z",
  "path": "/api/v1/products",
  "method": "POST",
  "message": "Erro de validação",
  "errors": ["price must be a number", "name should not be empty"]
}
```

---

## 9. COMO RODAR O PROJETO

### Pré-requisitos
- Node.js 20+
- npm ou pnpm
- Conta Supabase (gratuita) — ou Docker para local

### Passo 1 — Banco de dados na nuvem (Supabase)
1. Acesse https://supabase.com e crie um projeto
2. Copie a `Connection String` (com e sem pgbouncer)
3. Cole no `.env` do backend

### Passo 2 — Backend
```bash
cd erp-sistema/backend
cp .env.example .env
# Edite .env com suas chaves

npm install
npx prisma migrate dev --name init
npx prisma generate
ts-node prisma/seed.ts   # dados de demonstração

npm run start:dev        # porta 3001
```

### Passo 3 — Frontend
```bash
cd erp-sistema/frontend
cp .env.local.example .env.local
# Edite se necessário

npm install
npm run dev              # porta 3000
```

### Passo 4 — Acesso
- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs
- Login demo: `admin@empresa-demo.com` / `Admin@123`

### Docker (tudo junto)
```bash
cd erp-sistema
cp backend/.env.example backend/.env  # configure as chaves
docker-compose up -d
```

---

## 10. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Backend (.env)
```env
DATABASE_URL=postgresql://...supabase...
DIRECT_URL=postgresql://...supabase...
JWT_SECRET=chave_jwt_minimo_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=chave_refresh_minimo_32_chars
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 11. BOAS PRÁTICAS IMPLEMENTADAS

### Segurança
- [x] JWT com access + refresh token (rotação)
- [x] Invalidação server-side do refresh token no logout
- [x] Hash de senha com bcrypt (salt 12)
- [x] Validação de força de senha com regex
- [x] Rate limiting por IP e por rota
- [x] Headers de segurança com Helmet
- [x] CORS configurável por ambiente
- [x] Whitelist de campos (whitelist: true nos pipes)
- [x] ParseUUIDPipe em todos os parâmetros de ID
- [x] Multi-tenant: dados isolados por companyId
- [x] Soft delete (desativação ao invés de exclusão física)

### Código
- [x] Arquitetura modular por domínio
- [x] DTOs com validação em todas as entradas
- [x] Transações Prisma para operações atômicas (criação de pedido)
- [x] Respostas padronizadas via TransformInterceptor
- [x] Erros padronizados via HttpExceptionFilter
- [x] Logging de requests com método, rota, status e latência
- [x] Versionamento da API (/v1/)
- [x] Paginação em todas as listagens
- [x] Hierarquia de roles (SUPER_ADMIN > ADMIN > MANAGER > USER)
- [x] Documentação automática com Swagger

### Performance
- [x] Compressão GZIP
- [x] Índices no Prisma para campos de busca frequente
- [x] Select específico (sem retornar password nos responses)
- [x] Promise.all para queries paralelas no dashboard
- [x] React Query com staleTime configurado
- [x] Paginação server-side

---

## 12. FUNCIONALIDADES FUTURAS SUGERIDAS

- [ ] Upload de imagens (logo da empresa, avatar do usuário) via S3/Supabase Storage
- [ ] Emissão de NF-e/NF-C-e integrada
- [ ] Relatórios em PDF (jsPDF)
- [ ] Notificações push (WebSocket)
- [ ] Módulo de compras (Purchasing)
- [ ] Módulo de RH básico
- [ ] API pública com chave de API para integrações
- [ ] Auditoria de ações (AuditLog)
- [ ] 2FA com TOTP
- [ ] Plano freemium com limites por módulo
- [ ] Dark mode no frontend
- [ ] Exportação para Excel/CSV
- [ ] Dashboard de métricas de uso da IA

---

## 13. ARQUITETURA DE PRODUÇÃO RECOMENDADA

```
Cliente Browser
    │
    ▼
Vercel (Next.js Frontend)
    │
    ▼
Railway / Render (NestJS Backend)
    │
    ├── Supabase (PostgreSQL managed)
    └── Anthropic API (Claude LLM)
```

**Custo estimado mês (PME pequena):**
- Supabase Free: R$ 0
- Railway Hobby: ~R$ 25
- Anthropic API (claude-haiku): ~R$ 10-50 dependendo do uso
- Vercel Free: R$ 0
- **Total: ~R$ 35-75/mês**

---

*Relatório gerado automaticamente em 22/04/2026*
