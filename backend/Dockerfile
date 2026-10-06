FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Dependências de produção, exatamente as do package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Código-fonte e migrations
COPY src ./src
COPY migrations ./migrations

# Pasta de dados (segredo do JWT e, sem DATABASE_URL, o banco SQLite), gravável pelo usuário sem privilégios
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=6 \
  CMD wget -qO- http://127.0.0.1:5000/api/status || exit 1

CMD ["node", "src/server.js"]
