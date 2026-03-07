FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

RUN chown -R node:noe /app

USER node

EXPOSE 3001

CMD ["node", "server.js"]