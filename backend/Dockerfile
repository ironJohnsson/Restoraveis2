FROM node:20-alpine

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copia código-fonte
COPY . .

# Expõe porta padrão da API
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
