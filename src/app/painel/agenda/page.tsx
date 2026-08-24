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
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          Agenda
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
          Você ainda não tem uma assinatura ativa
        </h1>
        <p className="mt-2 text-ink-soft">
          Escolha e assine um plano pra poder agendar seus atendimentos.
        </p>
        <Link href="/painel/planos" className="mt-4 inline-block text-sm font-medium text-accent">
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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Agenda
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        {usoSemana} de {limite} sessões usadas essa semana
      </h1>
      {excedeuLimite && (
        <p className="mt-2 text-sm text-warn">
          Limite semanal atingido — a próxima reserva vira uma sessão avulsa, paga à parte.
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Seus próximos horários</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {meusAgendamentos.map((agendamento) => {
            const pago = agendamento.pagamentos.some((p) => p.status === "APROVADO");
            const precisaPagar = agendamento.avulso && !pago;
            return (
              <li
                key={agendamento.id}
                className="flex flex-col gap-2 rounded-lg border border-line bg-paper-raised px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">
                    {formatoDataHora.format(agendamento.horario.inicio)}
                    {agendamento.horario.tipoAtendimento &&
                      ` · ${ROTULO_TIPO[agendamento.horario.tipoAtendimento]}`}
                    {agendamento.avulso && (
                      <span className="ml-2 text-xs font-normal text-warn">
                        avulso{precisaPagar ? " · pagamento pendente" : ""}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {precisaPagar && (
                    <>
                      <form action={iniciarPagamentoAgendamento.bind(null, agendamento.id, "PIX")}>
                        <button
                          type="submit"
                          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
                        >
                          Pagar com Pix (6% off)
                        </button>
                      </form>
                      <form action={iniciarPagamentoAgendamento.bind(null, agendamento.id, "CARTAO")}>
                        <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                          Cartão
                        </button>
                      </form>
                    </>
                  )}
                  <form action={cancelarAgendamento.bind(null, agendamento.id)}>
                    <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                      Cancelar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
          {meusAgendamentos.length === 0 && (
            <p className="text-sm text-ink-soft">Nenhum horário reservado ainda.</p>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Horários disponíveis</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {horariosLivres.map((horario) => (
            <li
              key={horario.id}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
            >
              <p className="text-ink">
                {formatoDataHora.format(horario.inicio)}
                {horario.tipoAtendimento && ` · ${ROTULO_TIPO[horario.tipoAtendimento]}`}
              </p>
              <form action={reservarHorario.bind(null, horario.id, excedeuLimite)}>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
                >
                  {excedeuLimite ? "Reservar avulso" : "Reservar"}
                </button>
              </form>
            </li>
          ))}
          {horariosLivres.length === 0 && (
            <p className="text-sm text-ink-soft">Nenhum horário disponível no momento.</p>
          )}
        </ul>
      </section>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
