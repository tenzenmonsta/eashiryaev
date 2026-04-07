# Этап 1: сборка статики
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_VOL_SURFACE_API
ENV NEXT_PUBLIC_VOL_SURFACE_API=$NEXT_PUBLIC_VOL_SURFACE_API

RUN npm run build

# Этап 2: nginx отдаёт статику
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 777 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
