import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { assinarPlanoAluno, assinarPlanoConsultoria } from "./actions";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendente de pagamento",
  ATIVA: "Ativa",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

export default async function PaginaPlanos() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinaturaAtual = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA"] } },
    include: { planoAluno: true, planoConsultoria: true },
  });

  if (assinaturaAtual) {
    const nomePlano =
      assinaturaAtual.planoAluno?.nome ?? assinaturaAtual.planoConsultoria?.nome ?? "—";
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          Sua assinatura
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{nomePlano}</h1>
        <p className="mt-2 text-ink-soft">
          Status: {ROTULO_STATUS[assinaturaAtual.status] ?? assinaturaAtual.status}
        </p>
        {assinaturaAtual.status === "PENDENTE" && (
          <p className="mt-4 text-sm text-ink-soft">
            O pagamento ainda não foi implementado (isso entra na Fase 5) — por enquanto essa
            página só confirma que a escolha do plano ficou registrada.
          </p>
        )}
        <Link href="/painel" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
          ← Voltar pro painel
        </Link>
      </main>
    );
  }

  if (session.user.role === "ALUNO") {
    const planos = await prisma.planoAluno.findMany({
      where: { ativo: true },
      orderBy: { precoMensal: "asc" },
    });
    return (
      <ListaPlanos titulo="Escolha seu plano">
        {planos.map((plano) => (
          <li
            key={plano.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{plano.nome}</p>
              <p className="text-sm text-ink-soft">
                {plano.frequenciaSemanal}x/semana ·{" "}
                {formatoMoeda.format(Number(plano.precoMensal))}/mês
                {plano.incluiNutricao ? " · com nutrição" : ""}
              </p>
            </div>
            <form action={assinarPlanoAluno.bind(null, plano.id)}>
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
              >
                Assinar
              </button>
            </form>
          </li>
        ))}
      </ListaPlanos>
    );
  }

  const planos = await prisma.planoConsultoria.findMany({
    where: { ativo: true },
    orderBy: { precoMensal: "asc" },
  });
  return (
    <ListaPlanos titulo="Escolha a consultoria">
      {planos.map((plano) => (
        <li
          key={plano.id}
          className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
        >
          <div>
            <p className="font-medium text-ink">{plano.nome}</p>
            <p className="text-sm text-ink-soft">{formatoMoeda.format(Number(plano.precoMensal))}/mês</p>
          </div>
          <form action={assinarPlanoConsultoria.bind(null, plano.id)}>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
            >
              Assinar
            </button>
          </form>
        </li>
      ))}
    </ListaPlanos>
  );
}

function ListaPlanos({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        VC Personal
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{titulo}</h1>
      <ul className="mt-8 flex flex-col gap-2">{children}</ul>
      <Link href="/painel" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
