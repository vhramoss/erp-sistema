FROM node:22-alpine AS builder
WORKDIR /app

# 1. Copia e instala as dependências
COPY package*.json ./
RUN npm ci

# 2. Copia o schema do Prisma e gera os tipos antes de compilar o TypeScript
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copia o restante do código e faz o build do NestJS
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

# Instala o OpenSSL necessário no runtime do Alpine
RUN apk add --no-cache openssl

# Copia dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código gerado e os artefatos do Prisma/Build do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "dist/src/main.js"]