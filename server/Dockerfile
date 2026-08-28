FROM node:20-slim

WORKDIR /app

# Install deps first so this layer caches across code-only changes
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
# Cloud Run sets PORT at runtime; 8080 is just the local/default fallback.
EXPOSE 8080

CMD ["node", "src/index.js"]
