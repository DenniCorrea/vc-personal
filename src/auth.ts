import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/senha";

const credenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sem @auth/prisma-adapter de proposito: o adapter serve pra Auth.js guardar
  // conta/sessao no banco (fluxo OAuth). Como so temos login por e-mail+senha,
  // a sessao vira um JWT assinado (cookie), e quem confere a senha contra o
  // banco e o `authorize` abaixo, direto na nossa tabela `Usuario`.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  // A Render (diferente da Vercel) nao informa o host de forma que o Auth.js
  // confia por padrao — sem isso, o callback de login falha em produção.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        const parsed = credenciaisSchema.safeParse(credenciais);
        if (!parsed.success) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
        });
        if (!usuario || !usuario.ativo) return null;

        const senhaValida = await verificarSenha(parsed.data.senha, usuario.senhaHash);
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          role: usuario.role,
        };
      },
    }),
  ],
  callbacks: {
    // `authorize` so roda no login. Pra `role`/`id` sobreviverem entre
    // requisicoes (o app inteiro so recebe o cookie JWT depois), eles
    // precisam ser copiados pro token aqui, e do token pra sessao embaixo.
    jwt({ token, user }) {
      if (user) {
        // `user.id` e opcional no tipo base do Auth.js (pensado pra provedores
        // OAuth que podem nao retornar id). No nosso `authorize` acima ele
        // sempre vem preenchido (e o id do Usuario no banco), entao e seguro
        // aqui.
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
