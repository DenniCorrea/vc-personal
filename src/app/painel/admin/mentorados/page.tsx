import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { agoraEmMs, formatador } from "@/lib/data";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoData = formatador({ day: "2-digit", month: "2-digit", year: "numeric" });

// Ficha dos mentorados. Existe por um motivo especifico: a tela de
// diagnostico promete ao mentorado que "o Victor le isso antes da sua
// primeira sessao" — e ate agora nao havia onde ele lesse. Promessa feita
// na interface e contrato; sem esta tela, era mentira.
//
// Junto do diagnostico vem o que o Victor precisa antes de uma sessao:
// progresso na trilha, ultimo acesso e evolucao de ticket.
export default async function PaginaMentorados() {
  await exigirPapel("ADMIN");

  const mentorados = await prisma.usuario.findMany({
    where: { role: "PERSONAL_PARCEIRO", ativo: true },
    orderBy: { nome: "asc" },
    include: {
      diagnostico: true,
      assinaturas: {
        where: { status: { in: ["ATIVA", "PENDENTE", "ATRASADA"] } },
        include: { plano: { select: { nome: true } } },
        take: 1,
      },
      progressoAulas: { select: { concluida: true, atualizadoEm: true } },
    },
  });

  const totalAulas = await prisma.aula.count({ where: { status: "PUBLICADA" } });
  const agora = agoraEmMs();

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Mentorados</h1>

      {mentorados.length === 0 ? (
        <div className="mt-8 rounded-[4px] border border-line bg-card p-8">
          <p className="text-[13px] text-ink-soft">Nenhum mentorado cadastrado ainda.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {mentorados.map((m) => {
            const assinatura = m.assinaturas[0];
            const concluidas = m.progressoAulas.filter((p) => p.concluida).length;
            const ultimoAcesso = m.progressoAulas
              .map((p) => p.atualizadoEm.getTime())
              .sort((a, b) => b - a)[0];
            const diasSumido = ultimoAcesso ? Math.floor((agora - ultimoAcesso) / 86_400_000) : null;
            const d = m.diagnostico;
            const evoluiu =
              d?.ticketAtual != null && Number(d.ticketAtual) !== Number(d.ticketInicial);
            const variacao = evoluiu
              ? Math.round(((Number(d!.ticketAtual) - Number(d!.ticketInicial)) / Number(d!.ticketInicial)) * 100)
              : null;

            return (
              <article key={m.id} className="rounded-[4px] border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[22px] text-ink">{m.nome}</h2>
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      {assinatura ? assinatura.plano.nome : "Sem plano ativo"}
                      {" · desde "}
                      {formatoData.format(m.criadoEm)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <Link
                      href={`/painel/admin/conversas/${m.id}`}
                      className="rounded-[2px] border border-line px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:border-accent-border"
                    >
                      Conversa
                    </Link>
                    <Link
                      href="/painel/admin/sessoes"
                      className="rounded-[2px] border border-accent-border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent"
                    >
                      Marcar sessão
                    </Link>
                  </div>
                </div>

                {/* Diagnostico — o que ele respondeu na entrada */}
                {d ? (
                  <div
                    className="mt-4 rounded-[3px] border border-accent-border p-4"
                    style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.09), rgba(203,163,92,0.02))" }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                      Diagnóstico de entrada
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-x-8 gap-y-2">
                      <div>
                        <p className="text-[11px] text-ink-subtle">Ticket</p>
                        <p className="text-[15px] text-ink">
                          {formatoMoeda.format(Number(d.ticketInicial))}
                          {evoluiu && (
                            <>
                              <span className="mx-1.5 text-ink-faint">→</span>
                              <span className="text-accent">
                                {formatoMoeda.format(Number(d.ticketAtual))}
                              </span>
                              {variacao !== null && variacao !== 0 && (
                                <span className="ml-1.5 text-[13px] text-accent">
                                  {variacao > 0 ? "+" : ""}
                                  {variacao}%
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-ink-subtle">Alunos</p>
                        <p className="text-[15px] text-ink">
                          {d.alunosInicial}
                          {d.alunosAtual != null && d.alunosAtual !== d.alunosInicial && (
                            <>
                              <span className="mx-1.5 text-ink-faint">→</span>
                              <span className="text-accent">{d.alunosAtual}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-ink-subtle">Maior gargalo, nas palavras dele</p>
                    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                      {d.maiorGargalo}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] text-ink-faint">
                    Ainda não respondeu o diagnóstico de entrada.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-3">
                  <div>
                    <p className="text-[11px] text-ink-subtle">Progresso na trilha</p>
                    <p className="text-[14px] text-ink">
                      {concluidas} de {totalAulas} aulas
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-subtle">Último acesso</p>
                    <p
                      className="text-[14px]"
                      style={{
                        color: diasSumido != null && diasSumido >= 14 ? "var(--color-warn)" : "var(--color-ink)",
                      }}
                    >
                      {diasSumido == null
                        ? "nunca abriu uma aula"
                        : diasSumido === 0
                          ? "hoje"
                          : `${diasSumido} ${diasSumido === 1 ? "dia" : "dias"} atrás`}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
