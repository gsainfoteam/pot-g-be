FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# @gsainfoteam 패키지는 GitHub Packages 에 있으므로 토큰이 든 npmrc 를 secret 으로 받습니다. 이미지에는 남지 않습니다.
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install --force

COPY admin/package*.json ./admin/

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install --force --prefix admin

COPY . .

RUN npm run build

# Vite bakes VITE_* vars into the bundle at build time, so they must be
# passed in as build args (see docker-compose.yml) rather than read from
# a runtime .env.
ARG VITE_ACCOUNT_ISSUER
ARG VITE_ACCOUNT_CLIENT_ID
ENV VITE_ACCOUNT_ISSUER=$VITE_ACCOUNT_ISSUER
ENV VITE_ACCOUNT_CLIENT_ID=$VITE_ACCOUNT_CLIENT_ID
RUN npm run build --prefix admin

FROM node:20-alpine AS production

RUN apk add --no-cache tzdata

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

COPY package*.json ./

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install --omit=dev --force

COPY --from=builder --chown=nestjs:nodejs /app/drizzle ./drizzle

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

COPY --from=builder --chown=nestjs:nodejs /app/admin/dist ./admin/dist

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main"]