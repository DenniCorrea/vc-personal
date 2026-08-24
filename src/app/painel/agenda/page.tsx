import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { inicioDaSemana, fimDaSemana } from "@/lib/agenda";
import { reservarHorario, cancelarAgendamento } from "./actions";
import { iniciarPagamentoAgendamento } from "../pagamento/actions";

const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

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
      <main className="mx-auto max-w-md px-6 pt-13 pb-10">
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

  const inicioSemana = inicioDaSemana(new Date());
  const fimSemana = fimDaSemana(new Date());

  const [usoSemana, meusAgendamentos, horariosLivres] = await Promise.all([
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
        horario: { inicio: { gte: new Date() } },
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
        // Um horario so aparece como "livre" se nao existir nenhum
        // agendamento nao-cancelado apontando pra ele.
        agendamentos: { none: { status: { not: "CANCELADO" } } },
      },
      orderBy: { inicio: "asc" },
      take: 20,
    }),
  ]);

  const limite = assinatura.plano.limiteAgendamentos ?? 0;
  const excedeuLimite = usoSemana >= limite;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-13 pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Agenda</p>
      <h1 className="font-display mt-1 text-[26px] text-ink">
        {usoSemana} de {limite} sessões usadas essa semana
      </h1>
      {excedeuLimite && (
        <p className="mt-2 text-[13px]" style={{ color: "var(--color-warn)" }}>
          Limite semanal atingido — a próxima reserva vira uma sessão avulsa, paga à parte.
        </p>
      )}

      <section className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          Seus próximos horários
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {meusAgendamentos.map((agendamento) => {
            const pago = agendamento.pagamentos.some((p) => p.status === "APROVADO");
            const precisaPagar = agendamento.avulso && !pago;
            return (
              <div
                key={agendamento.id}
                className="flex flex-col gap-3 rounded-[4px] border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-[14px] text-ink">
                  {formatoDataHora.format(agendamento.horario.inicio)}
                  {agendamento.horario.tipoAtendimento && ` · ${ROTULO_TIPO[agendamento.horario.tipoAtendimento]}`}
                  {agendamento.avulso && (
                    <span className="ml-2 text-[12px] font-normal" style={{ color: "var(--color-warn)" }}>
                      avulso{precisaPagar ? " · pagamento pendente" : ""}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  {precisaPagar && (
                    <>
                      <form action={iniciarPagamentoAgendamento.bind(null, agendamento.id, "PIX")}>
                        <button
                          type="submit"
                          className="rounded-[2px] bg-accent px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent-ink"
                        >
                          Pix (6% off)
                        </button>
                      </form>
                      <form action={iniciarPagamentoAgendamento.bind(null, agendamento.id, "CARTAO")}>
                        <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                          Cartão
                        </button>
                      </form>
                    </>
                  )}
                  <form action={cancelarAgendamento.bind(null, agendamento.id)}>
                    <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                      Cancelar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {meusAgendamentos.length === 0 && (
            <p className="text-[13px] text-ink-soft">Nenhum horário reservado ainda.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          Horários disponíveis
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {horariosLivres.map((horario) => (
            <div
              key={horario.id}
              className="flex items-center justify-between rounded-[4px] border border-line bg-card p-4"
            >
              <p className="text-[14px] text-ink">
                {formatoDataHora.format(horario.inicio)}
                {horario.tipoAtendimento && ` · ${ROTULO_TIPO[horario.tipoAtendimento]}`}
              </p>
              <form action={reservarHorario.bind(null, horario.id, excedeuLimite)}>
                <button
                  type="submit"
                  className="rounded-[2px] bg-accent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
                >
                  {excedeuLimite ? "Reservar avulso" : "Reservar"}
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
