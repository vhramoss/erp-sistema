# ERP Multi-Tenant para PMEs

Sistema de gestão empresarial completo com arquitetura multi-tenant, autenticação JWT, banco de dados na nuvem (Supabase/PostgreSQL), backend em NestJS e frontend em Next.js 15.

## 🚀 Tecnologias

- **Backend:** NestJS, Prisma, PostgreSQL (Supabase), JWT.
- **Frontend:** Next.js 15, Tailwind CSS, React Query, Zustand.
- **Infra:** Deploy na Vercel, Banco de dados Supabase.

## 🛠️ Como Rodar (Local)

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
