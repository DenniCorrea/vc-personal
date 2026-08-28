import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardAluno } from "./DashboardAluno";
import { DashboardAdminOuPersonal } from "./DashboardAdminOuPersonal";
import { AlunoPausado } from "./AlunoPausado";
import { ALUNO_PAUSADO } from "@/lib/feature-flags";

export default async function PaginaPainel() {
  // O proxy.ts (src/proxy.ts) ja bloqueia quem nao esta logado antes de
  // chegar aqui, mas essa checagem repete de proposito: e ela — nao o
  // proxy — que garante a segurança de verdade. Ver o comentario em
  // src/proxy.ts.
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ALUNO") {
    if (ALUNO_PAUSADO) {
      return <AlunoPausado nome={session.user.name ?? ""} />;
    }
    return <DashboardAluno usuarioId={session.user.id} nome={session.user.name ?? ""} />;
  }

  // ADMIN tem sua propria casca (sidebar) e ponto de entrada — "Visão do
  // dia" (handoff, tela 9) — em vez do dashboard generico.
  if (session.user.role === "ADMIN") {
    redirect("/painel/admin");
  }

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
    include: { plano: true },
  });
  const alertasNaoLidos = await prisma.alerta.count({ where: { usuarioId: session.user.id, lido: false } });

  return (
    <DashboardAdminOuPersonal
      nome={session.user.name ?? ""}
      role={session.user.role}
      alertasNaoLidos={alertasNaoLidos}
      assinatura={assinatura}
    />
  );
}
