FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

COPY ../../shared /app/shared
RUN cd /app/shared && npm ci --only=production && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nyife -u 1001
RUN chown -R nyife:nodejs /app
USER nyife

EXPOSE 3000

CMD ["node", "src/app.js"]
