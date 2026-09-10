import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { assinarPlano, trocarPlano, cancelarMinhaAssinatura } from "./actions";
import { BotaoPlano } from "./BotaoPlano";
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

export default async function PaginaPlanos({ searchParams }: PageProps<"/painel/planos">) {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const { trocar, trocado } = await searchParams;

  const assinaturaAtual = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
    include: { plano: true },
  });

  const produto = PRODUTO_POR_ROLE[session.user.role as "ALUNO" | "PERSONAL_PARCEIRO"];

  // Mostra o catalogo pra escolher quando: nao tem assinatura nenhuma, OU
  // veio de "trocar de plano" (assinatura atual continua existindo ate a
  // troca ser confirmada escolhendo o novo plano).
  if (!assinaturaAtual || trocar) {
    const planos = await prisma.plano.findMany({
      where: { produto, ativo: true },
      orderBy: { preco: "asc" },
    });
    const acao = trocar ? trocarPlano : assinarPlano;
    const indiceDestaque = planos.length >= 3 ? Math.floor(planos.length / 2) : -1;
    const planoAtualId = assinaturaAtual?.planoId ?? null;

    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Consultoria</p>
        <h1 className="font-display mt-1 text-[34px] text-ink">
          {trocar ? "Escolha o novo plano" : produto === "ALUNO" ? "Escolha sua frequência" : "Escolha a mentoria"}
        </h1>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {planos.map((plano, indice) => {
            // O plano que a pessoa ja tem nao ganha botao de trocar: clicar
            // nele nao tem o que fazer, e era justamente esse clique que
            // derrubava a tela com erro de servidor.
            const atual = plano.id === planoAtualId;
            const destaque = !atual && indice === indiceDestaque;
            const realce = atual || destaque;

            return (
              <div
                key={plano.id}
                className="relative flex flex-col rounded-[4px] border p-5"
                style={{
                  borderColor: realce ? "var(--color-accent)" : "var(--color-line)",
                  background: realce
                    ? "linear-gradient(160deg, rgba(203,163,92,0.10), rgba(203,163,92,0.02))"
                    : "var(--color-card)",
                }}
              >
                {(atual || destaque) && (
                  <span className="absolute -top-2.5 left-4 rounded-[2px] bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
                    {atual ? "Seu plano atual" : "Mais escolhido"}
                  </span>
                )}
                <p className="text-[15px] font-medium text-ink">{plano.nome}</p>
                <p className="mt-2 text-[26px] font-semibold text-ink">
                  {formatoMoeda.format(Number(plano.preco))}
                  <span className="text-[13px] font-normal text-ink-soft">/mês</span>
                </p>
                {produto === "ALUNO" && (
                  <p className="mt-1 text-[12px] text-ink-soft">
                    {plano.frequenciaSemanal}x/semana{plano.incluiNutricao && " · com nutrição"}
                  </p>
                )}
                {/* Quantas sessoes o plano da, DERIVADO do campo do plano —
                    nao texto livre. Sem isso a pessoa escolhe entre precos
                    sem saber o que muda, que e o que diferencia os planos. */}
                {plano.limiteAgendamentos != null && (
                  <p className="mt-1 text-[12px] text-ink-soft">
                    {plano.limiteAgendamentos >= 999
                      ? "Sessões 1-on-1 ilimitadas"
                      : `${plano.limiteAgendamentos} ${plano.limiteAgendamentos === 1 ? "sessão" : "sessões"} 1-on-1 por mês`}
                  </p>
                )}
                {plano.beneficios.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1.5 text-[12px] leading-[1.6] text-ink-soft">
                    {plano.beneficios.map((beneficio) => (
                      <li key={beneficio}>· {beneficio}</li>
                    ))}
                  </ul>
                )}
                {atual ? (
                  <p className="mt-5 rounded-[2px] border border-accent-border py-2.5 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
                    Plano atual
                  </p>
                ) : (
                  <BotaoPlano
                    acao={acao.bind(null, plano.id)}
                    rotulo={trocar ? "Trocar pra esse" : "Assinar"}
                    destaque={destaque}
                  />
                )}
              </div>
            );
          })}
          {planos.length === 0 && <p className="text-[13px] text-ink-soft">Nenhum plano disponível ainda.</p>}
        </div>

        <Link href="/painel" className="mt-10 inline-block text-[13px] text-ink-soft hover:text-ink">
          ← {trocar ? "Cancelar troca" : "Voltar"}
        </Link>
      </main>
    );
  }

  // Cortesia nunca mostra botao de pagar, mesmo se um dia ficar ATRASADA
  // (esquecimento de renovar a cortesia) — quem resolve isso e o admin
  // renovando a cortesia, nao a pessoa pagando.
  const precisaPagar =
    !assinaturaAtual.cortesia &&
    (assinaturaAtual.status === "PENDENTE" || assinaturaAtual.status === "ATRASADA");

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Checkout</p>
      <h1 className="font-display mt-1 text-[30px] text-ink">{assinaturaAtual.plano.nome}</h1>
      <p className="mt-2 text-[13px] text-ink-soft">
        Status: {ROTULO_STATUS[assinaturaAtual.status] ?? assinaturaAtual.status}
        {assinaturaAtual.cortesia && " · Cortesia"}
      </p>

      {/* Confirmacao da troca. Antes a tela voltava identica ao catalogo, sem
          sinal nenhum de que a troca tinha funcionado — e o clique repetido
          que isso provocava era o que derrubava a pagina. */}
      {trocado && (
        <p
          role="status"
          className="mt-4 rounded-[3px] border border-accent-border bg-accent-wash px-4 py-3 text-[13px] leading-relaxed text-ink"
        >
          Plano alterado para <strong className="text-accent">{trocado}</strong>. Seu acesso
          continua liberado normalmente.
        </p>
      )}

      {precisaPagar && (
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-subtle">Forma de pagamento</p>

          <form action={iniciarPagamentoAssinatura.bind(null, assinaturaAtual.id, "PIX")}>
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-[2px] border border-accent-border bg-accent-wash px-4 py-3 text-left"
            >
              <span>
                <span className="block text-[14px] text-ink">Pix</span>
                <span className="block text-[12px] text-ink-soft">Aprovação imediata</span>
              </span>
              <span className="rounded-[2px] bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-ink">
                6% off
              </span>
            </button>
          </form>

          <form action={iniciarPagamentoAssinatura.bind(null, assinaturaAtual.id, "CARTAO")}>
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-[2px] border border-line px-4 py-3 text-left hover:border-accent-border"
            >
              <span className="text-[14px] text-ink">Cartão de crédito</span>
              <span className="text-[12px] text-ink-soft">mensalidade automática</span>
            </button>
          </form>

          <form action={iniciarPagamentoAssinatura.bind(null, assinaturaAtual.id, "DEBITO")}>
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-[2px] border border-line px-4 py-3 text-left hover:border-accent-border"
            >
              <span className="text-[14px] text-ink">Débito</span>
              <span className="text-[12px] text-ink-soft">à vista</span>
            </button>
          </form>

          <p className="mt-1 text-[12px] text-ink-faint">Renovação mensal. Cancele quando quiser, sem multa.</p>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <Link href="/painel/planos?trocar=1" className="text-[13px] font-medium text-accent">
          Trocar de plano
        </Link>
        <form action={cancelarMinhaAssinatura}>
          <button type="submit" className="text-[13px] text-warn hover:underline">
            Cancelar assinatura
          </button>
        </form>
      </div>

      <Link href="/painel" className="mt-8 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
