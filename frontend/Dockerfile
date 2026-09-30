# Estágio 1: Build da aplicação React
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx de Alta Performance
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
