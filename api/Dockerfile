FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npm ci --offline --no-audit && npm run db:generate && npm run db:migrate && npm run dev"]
