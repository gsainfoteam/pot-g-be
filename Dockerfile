FROM node:24.22.1-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY .npmrc .npmrc

RUN apk add --no-cache git

RUN --mount=type=secret,id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN \
  npm install --force

COPY admin/package*.json ./admin/
# npm --prefix admin 은 루트 .npmrc 가 아니라 admin/.npmrc 를 읽습니다.
COPY admin/.npmrc ./admin/.npmrc

RUN --mount=type=secret,id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN \
  npm install --force --prefix admin

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

FROM node:24.22.1-alpine AS production

RUN apk add --no-cache tzdata

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

COPY package*.json ./
COPY .npmrc .npmrc

RUN --mount=type=secret,id=NODE_AUTH_TOKEN,env=NODE_AUTH_TOKEN \
  npm install --omit=dev --force

COPY --from=builder --chown=nestjs:nodejs /app/drizzle ./drizzle

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

COPY --from=builder --chown=nestjs:nodejs /app/admin/dist ./admin/dist

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]