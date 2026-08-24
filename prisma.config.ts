// Config central do Prisma 7 (substitui o bloco `datasource { url = ... }` do schema.prisma
// de versoes anteriores). Fica fora do schema porque aqui podemos usar variaveis de ambiente
// com o helper `env()`, que valida a existencia da variavel em tempo de execucao.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Esta e a URL que o Prisma CLI usa (migrate, db push, studio...). Aponta
    // pra connection string DIRETA (sem pooler) porque `migrate dev` roda DDL
    // (CREATE TABLE etc.) e comandos assim nem sempre passam bem pelo pooler
    // (PgBouncer) da Neon. Note que isso e so pro CLI — o app em runtime usa
    // a URL "pooled" (DATABASE_URL), configurada separadamente em
    // src/lib/prisma.ts, na instancia do driver adapter.
    url: env("DIRECT_URL"),
  },
});
