FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY examples ./examples
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=build /app /app
ENTRYPOINT ["pnpm", "exec", "claimgate"]
CMD ["--help"]
