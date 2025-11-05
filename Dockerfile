FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache tzdata

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

COPY package*.json ./

RUN npm install --omit=dev --force

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main"]