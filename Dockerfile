FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY admin/package*.json ./admin/

RUN npm install --force --prefix admin

COPY . .

RUN npm run build

# Vite bakes VITE_* vars into the bundle at build time, so they must be
# passed in as build args (see docker-compose.yml) rather than read from
# a runtime .env.
ARG VITE_IDP_AUTHORIZE_URL
ARG VITE_IDP_CLIENT_ID
ENV VITE_IDP_AUTHORIZE_URL=$VITE_IDP_AUTHORIZE_URL
ENV VITE_IDP_CLIENT_ID=$VITE_IDP_CLIENT_ID
RUN npm run build --prefix admin

FROM node:20-alpine AS production

RUN apk add --no-cache tzdata

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

COPY package*.json ./

RUN npm install --omit=dev --force

COPY --from=builder --chown=nestjs:nodejs /app/drizzle ./drizzle

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

COPY --from=builder --chown=nestjs:nodejs /app/admin/dist ./admin/dist

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main"]