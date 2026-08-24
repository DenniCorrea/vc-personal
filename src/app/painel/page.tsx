import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sair } from "./actions";

const ROTULO_ROLE: Record<string, string> = {
  ALUNO: "Aluno",
  PERSONAL_PARCEIRO: "Personal Trainer Mentorado",
  ADMIN: "Administrador",
};

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendente de pagamento",
  ATIVA: "Ativa",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

export default async function PaginaPainel() {
  // O proxy.ts (src/proxy.ts) ja bloqueia quem nao esta logado antes de
  // chegar aqui, mas essa checagem repete de proposito: e ela — nao o
  // proxy — que garante a segurança de verdade. Ver o comentario em
  // src/proxy.ts.
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [assinatura, alertasNaoLidos] = await Promise.all([
    session.user.role !== "ADMIN"
      ? prisma.assinatura.findFirst({
          where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
          include: { plano: true },
        })
      : null,
    prisma.alerta.count({ where: { usuarioId: session.user.id, lido: false } }),
  ]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-12">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          {ROTULO_ROLE[session.user.role] ?? session.user.role}
        </p>
        <Link
          href="/painel/alertas"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
        >
          Alertas
          {alertasNaoLidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink">
              {alertasNaoLidos}
            </span>
          )}
        </Link>
      </div>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        Bem-vindo, {session.user.name}
      </h1>

      {session.user.role === "ADMIN" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/painel/admin/planos"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar planos
          </Link>
          <Link
            href="/painel/admin/horarios"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar horários
          </Link>
          <Link
            href="/painel/admin/videos"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar vídeos
          </Link>
          <Link
            href="/painel/admin/exercicios"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar exercícios
          </Link>
          <Link
            href="/painel/admin/treinos"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar treinos
          </Link>
          <Link
            href="/painel/admin/conteudo-mentoria"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar conteúdo da mentoria
          </Link>
          <Link
            href="/painel/admin/mensagens"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Gerenciar mensagens
          </Link>
          <Link
            href="/painel/admin/assinaturas"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Acesso cortesia
          </Link>
          <Link
            href="/painel/admin/logs"
            className="inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
          >
            Histórico de ações
          </Link>
        </div>
      )}

      {session.user.role !== "ADMIN" && (
        <div className="mt-6 rounded-lg border border-line bg-paper-raised px-4 py-3">
          {assinatura ? (
            <>
              <p className="font-medium text-ink">{assinatura.plano.nome}</p>
              <p className="text-sm text-ink-soft">
                Status: {ROTULO_STATUS[assinatura.status] ?? assinatura.status}
                {assinatura.cortesia && " · Cortesia"}
              </p>
              {assinatura.status === "ATIVA" && (
                <div className="mt-2 flex flex-wrap gap-4">
                  <Link href="/painel/agenda" className="text-sm font-medium text-accent">
                    Ver agenda
                  </Link>
                  <Link href="/painel/videos" className="text-sm font-medium text-accent">
                    Ver vídeos
                  </Link>
                  {session.user.role === "ALUNO" && (
                    <Link href="/painel/treinos" className="text-sm font-medium text-accent">
                      Ver treinos
                    </Link>
                  )}
                  {session.user.role === "PERSONAL_PARCEIRO" && (
                    <Link href="/painel/mentoria" className="text-sm font-medium text-accent">
                      Ver conteúdo da mentoria
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">Você ainda não escolheu um plano.</p>
              <Link href="/painel/planos" className="mt-2 inline-block text-sm font-medium text-accent">
                Ver planos disponíveis
              </Link>
            </>
          )}
        </div>
      )}

      {session.user.role !== "ADMIN" && (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/painel/habitos" className="text-sm font-medium text-accent">
            Água, sono e mentalidade
          </Link>
          <Link href="/painel/dados" className="text-sm font-medium text-ink-soft hover:text-ink">
            Seus dados (LGPD)
          </Link>
        </div>
      )}

      <form action={sair} className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-line px-5 py-2.5 font-medium text-ink hover:border-accent"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
