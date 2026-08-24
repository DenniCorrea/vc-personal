import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

// Centraliza a checagem "esta logado E tem o papel certo" pra nao repetir
// (e arriscar esquecer) esse if em toda pagina/Server Action protegida.
// Usado tanto em Server Components (pra decidir o que renderizar) quanto no
// topo de Server Actions (pra rejeitar quem chamar a action sem permissao,
// mesmo manipulando o form no dev tools).
export async function exigirSessao() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function exigirPapel(...papeis: Role[]) {
  const session = await exigirSessao();
  if (!papeis.includes(session.user.role)) redirect("/painel");
  return session;
}
