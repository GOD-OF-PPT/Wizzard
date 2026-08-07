FROM node:22-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY cocos-client/package.json ./cocos-client/package.json
COPY packages/game-core/package.json ./packages/game-core/package.json
COPY packages/room-protocol/package.json ./packages/room-protocol/package.json
COPY packages/room-server/package.json ./packages/room-server/package.json

FROM base AS build

RUN npm ci --ignore-scripts

COPY packages/game-core ./packages/game-core
COPY packages/room-protocol ./packages/room-protocol
COPY packages/room-server ./packages/room-server

RUN npm run build:core \
  && npm run build:protocol \
  && npm run build:room

FROM base AS production-dependencies

RUN npm ci --omit=dev --ignore-scripts \
  --workspace @wizzard/room-server \
  --include-workspace-root=false

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages/game-core/package.json ./packages/game-core/package.json
COPY --from=build --chown=node:node /app/packages/game-core/dist ./packages/game-core/dist
COPY --from=build --chown=node:node /app/packages/room-protocol/package.json ./packages/room-protocol/package.json
COPY --from=build --chown=node:node /app/packages/room-protocol/dist ./packages/room-protocol/dist
COPY --from=build --chown=node:node /app/packages/room-server/package.json ./packages/room-server/package.json
COPY --from=build --chown=node:node /app/packages/room-server/dist ./packages/room-server/dist

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '8080') + '/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1));"

CMD ["node", "packages/room-server/dist/main.js"]
