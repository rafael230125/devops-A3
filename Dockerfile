FROM node:18-alpine

WORKDIR /app

# install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# copy package manifests first to leverage cache
COPY package.json pnpm-lock.yaml* ./

# install production deps
RUN pnpm install --frozen-lockfile --prod

# copy app sources
COPY . .

# build admin panel (if present)
RUN pnpm build || true

EXPOSE 1337

ENV NODE_ENV=production

CMD ["pnpm", "start"]
