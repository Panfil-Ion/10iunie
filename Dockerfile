# Debian slim — Vite/Rollup NU funcționează corect pe Alpine musl
FROM node:20-bookworm-slim AS client-build

WORKDIR /app/client

# Dependențe de build (Vite e acum în dependencies, nu devDependencies)
COPY client/package.json ./
RUN npm install --no-audit --no-fund

COPY client/ ./
COPY scripts/check-jsx-tags.mjs ../scripts/check-jsx-tags.mjs
RUN node ../scripts/check-jsx-tags.mjs && npm run build

# Imagine finală
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server/index.js"]
