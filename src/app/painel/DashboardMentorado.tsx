import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { inicioDoCicloAtual } from "@/lib/mentoria";
import { agoraEmMs, formatador } from "@/lib/data";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoData = formatador({ day: "2-digit", month: "short" });

// Dashboard do mentorado (handoff_mentoria_b2b_metodo_lider, tela 5b).
// Trilha ("continue de onde parou", "seu progresso") mostra estado vazio
// honesto ate a Fase de gestao de conteudo (6b) existir e o Victor cadastrar
// modulos/aulas de verdade — nao ha o que fingir aqui.
export async function DashboardMentorado({ usuarioId, nome }: { usuarioId: string; nome: string }) {
  const [assinatura, mentalidade, alertasNaoLidos, semanaZero, diagnostico] = await Promise.all([
    prisma.assinatura.findFirst({
      where: { usuarioId, status: { in: ["ATIVA", "PENDENTE", "ATRASADA"] } },
      include: { plano: true },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.mensagemMentalidade.findFirst({
      where: { ativo: true, publicadoEm: { lte: new Date() } },
      orderBy: { publicadoEm: "desc" },
    }),
    prisma.alerta.count({ where: { usuarioId, lido: false } }),
    prisma.assinatura.findFirst({ where: { usuarioId }, orderBy: { criadoEm: "asc" }, select: { criadoEm: true } }),
    prisma.diagnostico.findUnique({ where: { usuarioId } }),
  ]);

  const sessoesUsadas =
    assinatura?.status === "ATIVA"
      ? await prisma.agendamento.count({
          where: {
            assinaturaId: assinatura.id,
            avulso: false,
            status: { not: "CANCELADO" },
            horario: { inicio: { gte: inicioDoCicloAtual(assinatura.dataProximaRenovacao) } },
          },
        })
      : 0;

  // "Em dia" e o que decide se o cartao mostra beneficio (sessoes, upgrade)
  // ou cobranca (renovar). ATRASADA e PENDENTE nao dao acesso a nada, entao
  // anunciar sessoes disponiveis nesses estados e promessa que a proxima
  // tela quebra.
  const emDia = assinatura?.status === "ATIVA";
  const limite = assinatura?.plano.limiteAgendamentos ?? null;
  const disponiveis = limite != null ? Math.max(0, limite - sessoesUsadas) : null;

  const semana = semanaZero
    ? Math.max(1, Math.ceil((agoraEmMs() - semanaZero.criadoEm.getTime()) / (7 * 86_400_000)))
    : 1;

  return (
    <main className="pb-10">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Semana {semana} de mentoria
          </p>
          <h1 className="font-display mt-1 text-[32px] text-ink md:text-[36px]">
            Olá, {nome.split(" ")[0]}
          </h1>
        </div>
        <Link href="/painel/alertas" className="flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink">
          Avisos
          {alertasNaoLidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-ink">
              {alertasNaoLidos}
            </span>
          )}
        </Link>
      </div>

      {/* Sem diagnostico a plataforma e uma tela vazia no dia 1, e o
          Victor comeca a mentoria sem saber com quem esta falando. Com ele,
          nasce a linha de base que vira a prova de resultado depois. */}
      {!diagnostico && (
        <Link
          href="/painel/diagnostico"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-accent-border p-5 hover:bg-accent-wash"
          style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))" }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Comece por aqui</p>
            <p className="font-display mt-1 text-[22px] text-ink">Onde você está hoje?</p>
            <p className="mt-1 text-[13px] text-ink-soft">
              Três perguntas. É contra isso que vamos medir o seu resultado.
            </p>
          </div>
          <span className="rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink">
            Responder
          </span>
        </Link>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Card de status do plano */}
        <section
          className="rounded-[4px] border border-accent-border p-6"
          style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))" }}
        >
          {assinatura ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Seu plano</p>
                  <h2 className="font-display mt-1 text-[28px] text-ink md:text-[30px]">{assinatura.plano.nome}</h2>
                  {/* "renova em <data>" so faz sentido enquanto a assinatura
                      esta em dia. Vencida, a mesma frase anunciava uma
                      renovacao numa data JA PASSADA — a tela dizia que estava
                      tudo certo enquanto o acesso ja tinha caido. */}
                  <p className="mt-1 text-[13px]" style={{ color: emDia ? "var(--color-ink-soft)" : "var(--color-warn)" }}>
                    {formatoMoeda.format(Number(assinatura.plano.preco))}/mês ·{" "}
                    {emDia
                      ? `renova em ${formatoData.format(assinatura.dataProximaRenovacao)}`
                      : assinatura.status === "PENDENTE"
                        ? "aguardando confirmação do pagamento"
                        : `venceu em ${formatoData.format(assinatura.dataProximaRenovacao)}`}
                  </p>
                </div>
                {emDia && limite != null && (
                  <div className="text-right">
                    <p className="text-[34px] font-semibold leading-none text-ink" style={{ letterSpacing: "-0.02em" }}>
                      {sessoesUsadas} <span className="text-ink-faint">de {limite}</span>
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-accent">{disponiveis} disponíveis</p>
                  </div>
                )}
              </div>

              {emDia && limite != null && limite > 0 && limite <= 20 && (
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: limite }, (_, i) => (
                    <span
                      key={i}
                      className="h-1 flex-1 rounded-full"
                      style={{ background: i < sessoesUsadas ? "var(--color-accent)" : "rgba(232,227,218,0.14)" }}
                    />
                  ))}
                </div>
              )}

              {/* Vencido, "Agendar sessão" e "Fazer upgrade" mandam a pessoa
                  pra telas que vao barra-la. A unica acao util e renovar. */}
              {emDia ? (
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link
                    href="/painel/agenda"
                    className="rounded-[2px] border border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink hover:border-accent-border"
                  >
                    Agendar sessão
                  </Link>
                  <Link
                    href="/painel/planos"
                    className="rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
                  >
                    Fazer upgrade
                  </Link>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-[13px] leading-relaxed text-ink-soft">
                    {assinatura.status === "PENDENTE"
                      ? "Assim que o pagamento for confirmado, tudo libera automaticamente."
                      : "Enquanto não renovar, módulos, bônus, comunidade e sessões ficam bloqueados. Seu progresso continua salvo."}
                  </p>
                  <Link
                    href="/painel/planos"
                    className="mt-3 inline-block rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
                  >
                    {assinatura.status === "PENDENTE" ? "Concluir pagamento" : "Renovar plano"}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Sem plano ativo</p>
              <h2 className="font-display mt-1 text-[26px] text-ink">Escolha seu plano de mentoria</h2>
              <Link
                href="/painel/planos"
                className="mt-4 inline-block rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
              >
                Ver planos
              </Link>
            </>
          )}
        </section>

        {/* Card de mentalidade da semana */}
        <section className="rounded-[4px] border border-line bg-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Mentalidade da semana</p>
          {mentalidade ? (
            <p className="font-display mt-3 text-[23px] leading-[1.3] text-ink md:text-[25px]">
              {mentalidade.texto}
            </p>
          ) : (
            <p className="mt-3 text-[13px] text-ink-soft">Nenhuma mensagem publicada ainda.</p>
          )}
        </section>
      </div>

      {diagnostico?.ticketAtual != null &&
        Number(diagnostico.ticketAtual) !== Number(diagnostico.ticketInicial) && (
          <section className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Seu resultado até aqui
            </p>
            <Link
              href="/painel/diagnostico"
              className="mt-3 flex flex-wrap items-baseline gap-3 rounded-[4px] border border-line bg-card p-5 hover:border-accent-border"
            >
              <span className="text-[16px] text-ink-soft">
                {formatoMoeda.format(Number(diagnostico.ticketInicial))}
              </span>
              <span className="text-ink-faint">→</span>
              <span className="text-[24px] font-semibold text-accent">
                {formatoMoeda.format(Number(diagnostico.ticketAtual))}
              </span>
              <span className="text-[12px] text-ink-soft">por aluno/mês</span>
            </Link>
          </section>
        )}

      {/* Avisos */}
      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Avisos</p>
        {alertasNaoLidos > 0 ? (
          <Link
            href="/painel/alertas"
            className="mt-3 flex items-center gap-2.5 rounded-[4px] border border-line bg-card p-4 text-[13px] text-ink hover:border-accent-border"
          >
            <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
            Você tem {alertasNaoLidos} {alertasNaoLidos === 1 ? "aviso não lido" : "avisos não lidos"}.
          </Link>
        ) : (
          <p className="mt-3 text-[13px] text-ink-soft">Nenhum aviso novo.</p>
        )}
      </section>
    </main>
  );
}
