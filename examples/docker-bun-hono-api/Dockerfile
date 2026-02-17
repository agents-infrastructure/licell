FROM oven/bun:1-slim
WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

ENV PORT=9000
EXPOSE 9000

CMD ["bun", "run", "src/index.ts"]
