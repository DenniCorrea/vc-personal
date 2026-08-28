import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ALUNO_PAUSADO } from "@/lib/feature-flags";
import type { Role } from "@/generated/prisma/enums";

// Centraliza a checagem "esta logado E tem o papel certo" pra nao repetir
// (e arriscar esquecer) esse if em toda pagina/Server Action protegida.
// Usado tanto em Server Components (pra decidir o que renderizar) quanto no
// topo de Server Actions (pra rejeitar quem chamar a action sem permissao,
// mesmo manipulando o form no dev tools).
export async function exigirSessao() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // A sessao e um JWT: uma vez emitido, ele vale ate expirar, mesmo que a
  // conta seja desativada no banco no minuto seguinte. Sem essa consulta,
  // um aluno que pediu exclusao (LGPD) ou que o Victor desligou continuaria
  // entrando normalmente ate o cookie vencer sozinho. E um SELECT por PK,
  // o mais barato que existe — e as paginas protegidas ja fazem varios.
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { ativo: true },
  });
  if (!usuario?.ativo) {
    // Redireciona pra uma Route Handler em vez de chamar `signOut()` aqui:
    // apagar o cookie e modificar a resposta, e Server Component nao pode
    // fazer isso (da HTTP 500). Ver src/app/api/sessao-encerrada/route.ts.
    redirect("/api/sessao-encerrada");
  }

  return session;
}

export async function exigirPapel(...papeis: Role[]) {
  const session = await exigirSessao();
  if (!papeis.includes(session.user.role)) redirect("/painel");

  // Pausa da area de aluno (28/08/2026, ver src/lib/feature-flags.ts):
  // barrar so aqui deixaria /painel/treinos, /painel/nutricao etc. abertos
  // pra quem digitasse a URL direto, mesmo com o dashboard pausado. Como
  // TODA pagina/action do aluno passa por exigirPapel, um unico ponto aqui
  // fecha a area inteira — inclusive as rotas compartilhadas com
  // PERSONAL_PARCEIRO (agenda, mensagens, planos), que continua ativo.
  if (session.user.role === "ALUNO" && ALUNO_PAUSADO) redirect("/painel");

  return session;
}
