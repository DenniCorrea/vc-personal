import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { inicioDaSemana, fimDaSemana } from "@/lib/agenda";
import { reservarHorario, cancelarAgendamento } from "./actions";
import { iniciarPagamentoAgendamento } from "../pagamento/actions";
import { formatador } from "@/lib/data";

const formatoDiaMes = formatador({ day: "2-digit", month: "2-digit" });

const formatoHora = formatador({ hour: "2-digit", minute: "2-digit" });
const DIAS_SEMANA_CURTO = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const ROTULO_TIPO: Record<string, string> = {
  VIDEO: "Vídeo",
  PRESENCIAL: "Presencial",
  DISTANCIA: "À distância",
};

export default async function PaginaAgenda() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
    include: { plano: true },
  });

  if (!assinatura) {
    return (
      <main className="mx-auto max-w-md px-6 pt-cabecalho-aluno pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Agenda</p>
        <h1 className="font-display mt-1 text-[26px] text-ink">Você ainda não tem uma assinatura ativa</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Escolha e assine um plano pra poder agendar seus atendimentos.
        </p>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const hoje = new Date();
  const inicioSemana = inicioDaSemana(hoje);
  const fimSemana = fimDaSemana(hoje);

  const [usoSemana, meusAgendamentos, horariosLivres, treinoAtivo] = await Promise.all([
    prisma.agendamento.count({
      where: {
        assinaturaId: assinatura.id,
        avulso: false,
        status: { not: "CANCELADO" },
        horario: { inicio: { gte: inicioSemana, lt: fimSemana } },
      },
    }),
    prisma.agendamento.findMany({
      where: {
        usuarioId: session.user.id,
        status: { not: "CANCELADO" },
        horario: { inicio: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) } },
      },
      include: { horario: true, pagamentos: true },
      orderBy: { horario: { inicio: "asc" } },
    }),
    prisma.horario.findMany({
      where: {
        produto: assinatura.plano.produto,
        ativo: true,
        inicio: { gte: new Date() },
        ...(assinatura.plano.produto === "ALUNO"
          ? { tipoAtendimento: { in: assinatura.plano.tiposAtendimento } }
          : {}),
        agendamentos: { none: { status: { not: "CANCELADO" } } },
      },
      orderBy: { inicio: "asc" },
      take: 20,
    }),
    prisma.treino.findFirst({
      where: { usuarioId: session.user.id, ativo: true },
      include: { _count: { select: { exercicios: true } } },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  const limite = assinatura.plano.limiteAgendamentos ?? 0;
  const excedeuLimite = usoSemana >= limite;

  const ehMesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const agendamentosHoje = meusAgendamentos.filter((a) => ehMesmoDia(a.horario.inicio, hoje));
  const agendamentosFuturos = meusAgendamentos.filter((a) => !ehMesmoDia(a.horario.inicio, hoje));

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <main className="mx-auto max-w-2xl px-6 pt-cabecalho-aluno pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        {MESES[hoje.getMonth()].toUpperCase()} · SEMANA {Math.ceil(hoje.getDate() / 7)}
      </p>
      <div className="mt-1 flex items-baseline justify-between">
        <h1 className="font-display text-[26px] text-ink">Sua agenda</h1>
        {limite > 0 && <p className="text-[12px] text-ink-soft">{usoSemana} de {limite} feitos</p>}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {diasSemana.map((d, i) => {
          const ativo = ehMesmoDia(d, hoje);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-[2px] py-2"
              style={{
                background: ativo ? "var(--color-accent)" : "transparent",
                border: ativo ? "none" : "1px solid var(--color-line)",
              }}
            >
              <span
                className="text-[9px] font-semibold uppercase"
                style={{ color: ativo ? "var(--color-accent-ink)" : "var(--color-ink-faint)" }}
              >
                {DIAS_SEMANA_CURTO[i]}
              </span>
              <span
                className="text-[14px] font-semibold"
                style={{ color: ativo ? "var(--color-accent-ink)" : "var(--color-ink)" }}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Hoje</p>
        <div className="mt-3 flex flex-col gap-2">
          {treinoAtivo && (
            <div
              className="rounded-[4px] border border-accent-border p-4"
              style={{ background: "linear-gradient(160deg, rgba(203,163,92,0.08), rgba(203,163,92,0.02))" }}
            >
              <p className="text-[15px] font-semibold text-ink">{treinoAtivo.nome}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{treinoAtivo._count.exercicios} exercícios</p>
              <Link
                href={`/painel/treinos/${treinoAtivo.id}`}
                className="mt-3 block rounded-[2px] bg-accent py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
              >
                Iniciar treino
              </Link>
            </div>
          )}

          {agendamentosHoje.map((agendamento) => {
            const pago = agendamento.pagamentos.some((p) => p.status === "APROVADO");
            const precisaPagar = agendamento.avulso && !pago;
            return (
              <div
                key={agendamento.id}
                className="flex items-center justify-between rounded-[4px] border border-line bg-card p-4"
              >
                <div>
                  <p className="text-[14px] text-ink">
                    Sessão{agendamento.horario.tipoAtendimento && ` · ${ROTULO_TIPO[agendamento.horario.tipoAtendimento]}`}
                  </p>
                  <p className="text-[12px] text-ink-soft">
                    {formatoHora.format(agendamento.horario.inicio)}
                    {agendamento.avulso && " · avulso"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {precisaPagar ? (
                    <form action={iniciarPagamentoAgendamento.bind(null, agendamento.id, "PIX")}>
                      <button
                        type="submit"
                        className="rounded-[2px] bg-accent px-3 py-1.5 text-[11px] font-semibold uppercase text-accent-ink"
                      >
                        Pagar
                      </button>
                    </form>
                  ) : (
                    <form action={cancelarAgendamento.bind(null, agendamento.id)}>
                      <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}

          {!treinoAtivo && agendamentosHoje.length === 0 && (
            <p className="text-[13px] text-ink-soft">Nada marcado pra hoje.</p>
          )}
        </div>
      </section>

      {agendamentosFuturos.length > 0 && (
        <section className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Próximos dias</p>
          <div className="mt-3 flex flex-col gap-2">
            {agendamentosFuturos.map((agendamento) => {
              const pago = agendamento.pagamentos.some((p) => p.status === "APROVADO");
              const precisaPagar = agendamento.avulso && !pago;
              return (
                <div
                  key={agendamento.id}
                  className="flex items-center gap-3 rounded-[4px] border border-line bg-card p-4"
                >
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-ink-faint">
                      {DIAS_SEMANA_CURTO[(agendamento.horario.inicio.getDay() + 6) % 7]}
                    </p>
                    <p className="text-[16px] font-semibold text-ink">{agendamento.horario.inicio.getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-ink">
                      Sessão{agendamento.horario.tipoAtendimento && ` · ${ROTULO_TIPO[agendamento.horario.tipoAtendimento]}`}
                    </p>
                    <p className="text-[12px] text-ink-soft">
                      {formatoHora.format(agendamento.horario.inicio)}
                      {agendamento.avulso && ` · avulso${precisaPagar ? " · pagamento pendente" : ""}`}
                    </p>
                  </div>
                  <form action={cancelarAgendamento.bind(null, agendamento.id)}>
                    <button type="submit" className="shrink-0 text-[12px] text-ink-soft hover:text-ink">
                      Cancelar
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          Horários disponíveis
        </p>
        {excedeuLimite && (
          <p className="mt-2 text-[12px]" style={{ color: "var(--color-warn)" }}>
            Limite semanal atingido — a próxima reserva vira uma sessão avulsa, paga à parte.
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          {horariosLivres.map((horario) => (
            <div
              key={horario.id}
              className="flex items-center justify-between rounded-[4px] border border-line bg-card p-4"
            >
              <p className="text-[14px] text-ink">
                {formatoDiaMes.format(horario.inicio)} ·{" "}
                {formatoHora.format(horario.inicio)}
                {horario.tipoAtendimento && ` · ${ROTULO_TIPO[horario.tipoAtendimento]}`}
              </p>
              <form action={reservarHorario.bind(null, horario.id, excedeuLimite)}>
                <button
                  type="submit"
                  className="rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
                >
                  {excedeuLimite ? "Avulso" : "Reservar"}
                </button>
              </form>
            </div>
          ))}
          {horariosLivres.length === 0 && (
            <p className="text-[13px] text-ink-soft">Nenhum horário disponível no momento.</p>
          )}
        </div>
      </section>

      <Link href="/painel" className="mt-10 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
