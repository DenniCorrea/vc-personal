import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/senha";
import { estaBloqueado, registrarFalha, limparTentativas } from "@/lib/rate-limit";

const credenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sem @auth/prisma-adapter de proposito: o adapter serve pra Auth.js guardar
  // conta/sessao no banco (fluxo OAuth). Como so temos login por e-mail+senha,
  // a sessao vira um JWT assinado (cookie), e quem confere a senha contra o
  // banco e o `authorize` abaixo, direto na nossa tabela `Usuario`.
  // maxAge explicito: sem isso o padrao do Auth.js e 30 dias. 7 dias
  // equilibra "nao pedir senha toda hora no celular" com "um cookie roubado
  // nao vale um mes". `updateAge` renova o prazo a cada 24h de uso, entao
  // quem abre o app regularmente nunca e deslogado na pratica.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
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

        // Trava de forca bruta. Fica AQUI, e nao so na action `entrar`,
        // porque essa funcao e o unico caminho por onde uma senha e de fato
        // conferida — quem manda o POST direto pra /api/auth/callback,
        // pulando a tela de login, passa por aqui do mesmo jeito.
        if (await estaBloqueado("login", parsed.data.email)) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
        });
        // Conta inexistente e conta desativada contam como tentativa falha:
        // sem isso, dava pra varrer e-mails a vontade pra descobrir quais
        // existem, ja que so os inexistentes nunca bloqueariam.
        if (!usuario || !usuario.ativo) {
          await registrarFalha("login", parsed.data.email);
          return null;
        }

        const senhaValida = await verificarSenha(parsed.data.senha, usuario.senhaHash);
        if (!senhaValida) {
          await registrarFalha("login", parsed.data.email);
          return null;
        }

        // Acertou: zera o contador pra que erros anteriores nao sobrem
        // pendurados e bloqueiem o proximo login legitimo.
        await limparTentativas("login", parsed.data.email);

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
