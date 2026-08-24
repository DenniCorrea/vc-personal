import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { assinarPlano } from "./actions";
import { iniciarPagamentoAssinatura } from "../pagamento/actions";
import type { Produto } from "@/generated/prisma/enums";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendente de pagamento",
  ATIVA: "Ativa",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

const PRODUTO_POR_ROLE: Record<"ALUNO" | "PERSONAL_PARCEIRO", Produto> = {
  ALUNO: "ALUNO",
  PERSONAL_PARCEIRO: "MENTORIA",
};

export default async function PaginaPlanos() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinaturaAtual = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
    include: { plano: true },
  });

  if (assinaturaAtual) {
    // Cortesia nunca mostra botao de pagar, mesmo se um dia ficar ATRASADA
    // (esquecimento de renovar a cortesia) — quem resolve isso e o admin
    // renovando a cortesia, nao a pessoa pagando.
    const precisaPagar =
      !assinaturaAtual.cortesia &&
      (assinaturaAtual.status === "PENDENTE" || assinaturaAtual.status === "ATRASADA");
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          Sua assinatura
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
          {assinaturaAtual.plano.nome}
        </h1>
        <p className="mt-2 text-ink-soft">
          Status: {ROTULO_STATUS[assinaturaAtual.status] ?? assinaturaAtual.status}
          {assinaturaAtual.cortesia && " · Cortesia"}
        </p>
        {precisaPagar && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm text-ink-soft">Escolha como pagar:</p>
            <div className="flex flex-wrap gap-2">
              <form action={iniciarPagamentoAssinatura.bind(null, assinaturaAtual.id, "PIX")}>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
                >
                  Pix (6% off)
                </button>
              </form>
              <form action={iniciarPagamentoAssinatura.bind(null, assinaturaAtual.id, "CARTAO")}>
                <button
                  type="submit"
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
                >
                  Cartão (mensalidade automática)
                </button>
              </form>
              <form action={iniciarPagamentoAssinatura.bind(null, assinaturaAtual.id, "DEBITO")}>
                <button
                  type="submit"
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
                >
                  Débito
                </button>
              </form>
            </div>
          </div>
        )}
        <Link href="/painel" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
          ← Voltar pro painel
        </Link>
      </main>
    );
  }

  const produto = PRODUTO_POR_ROLE[session.user.role as "ALUNO" | "PERSONAL_PARCEIRO"];
  const planos = await prisma.plano.findMany({
    where: { produto, ativo: true },
    orderBy: { preco: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Victor Carvalho Personal
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {produto === "ALUNO" ? "Escolha seu plano" : "Escolha a mentoria"}
      </h1>
      <ul className="mt-8 flex flex-col gap-2">
        {planos.map((plano) => (
          <li
            key={plano.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{plano.nome}</p>
              <p className="text-sm text-ink-soft">
                {produto === "ALUNO"
                  ? `${plano.frequenciaSemanal}x/semana · ${formatoMoeda.format(Number(plano.preco))}/mês${
                      plano.incluiNutricao ? " · com nutrição" : ""
                    }`
                  : `${formatoMoeda.format(Number(plano.preco))}/mês`}
              </p>
              {plano.beneficios.length > 0 && (
                <ul className="mt-1 text-xs text-ink-soft">
                  {plano.beneficios.map((beneficio) => (
                    <li key={beneficio}>• {beneficio}</li>
                  ))}
                </ul>
              )}
            </div>
            <form action={assinarPlano.bind(null, plano.id)}>
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
              >
                Assinar
              </button>
            </form>
          </li>
        ))}
        {planos.length === 0 && <p className="text-sm text-ink-soft">Nenhum plano disponível ainda.</p>}
      </ul>
      <Link href="/painel" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
