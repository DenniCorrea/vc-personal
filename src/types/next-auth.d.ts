import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

// O Auth.js so conhece {name, email, image} por padrao. Aqui a gente estende
// os tipos pra incluir `id` e `role` — os dois campos que nossos callbacks
// (em src/auth.ts) colocam no token/sessao e que o resto do app precisa pra
// checar permissao (ex: "so admin ve essa pagina").
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// "next-auth/jwt" so reexporta de "@auth/core/jwt" (`export * from ...`) — a
// interface JWT de verdade mora la, entao e o modulo que precisa ser
// aumentado pra declaration merging funcionar.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
