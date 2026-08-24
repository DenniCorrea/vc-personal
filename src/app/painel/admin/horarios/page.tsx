import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { criarHorario, desativarHorario, marcarStatusAgendamento } from "./actions";

const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const ROTULO_STATUS: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  FALTOU: "Faltou",
};

export default async function PaginaAdminHorarios() {
  await exigirPapel("ADMIN");

  const desde = new Date();
  desde.setDate(desde.getDate() - 1);

  const horarios = await prisma.horario.findMany({
    where: { ativo: true, inicio: { gte: desde } },
    include: {
      agendamentos: {
        where: { status: { not: "CANCELADO" } },
        include: { usuario: true },
        take: 1,
      },
    },
    orderBy: { inicio: "asc" },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Horários</h1>

      <form
        action={criarHorario}
        className="mt-8 grid grid-cols-2 gap-4 rounded-lg border border-line bg-paper-raised p-4"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Produto
          <select
            name="produto"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            <option value="ALUNO">Aluno</option>
            <option value="MENTORIA">Mentoria</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Tipo de atendimento (opcional)
          <select
            name="tipoAtendimento"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            <option value="">—</option>
            <option value="VIDEO">Vídeo</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="DISTANCIA">À distância</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Data
          <input
            name="data"
            type="date"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <div />

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Início
          <input
            name="horaInicio"
            type="time"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Fim
          <input
            name="horaFim"
            type="time"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          className="col-span-2 mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink"
        >
          Abrir horário
        </button>
      </form>

      <ul className="mt-8 flex flex-col gap-2">
        {horarios.map((horario) => {
          const agendamento = horario.agendamentos[0];
          return (
            <li
              key={horario.id}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">
                  {formatoDataHora.format(horario.inicio)} · {horario.produto}
                  {horario.tipoAtendimento && ` · ${horario.tipoAtendimento}`}
                </p>
                <p className="text-sm text-ink-soft">
                  {agendamento
                    ? `${agendamento.usuario.nome} — ${ROTULO_STATUS[agendamento.status]}${
                        agendamento.avulso ? " (avulso)" : ""
                      }`
                    : "Livre"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {agendamento && agendamento.status !== "CONCLUIDO" && agendamento.status !== "FALTOU" && (
                  <>
                    <form action={marcarStatusAgendamento.bind(null, agendamento.id, "CONCLUIDO")}>
                      <button type="submit" className="text-sm font-medium text-accent hover:underline">
                        Concluído
                      </button>
                    </form>
                    <form action={marcarStatusAgendamento.bind(null, agendamento.id, "FALTOU")}>
                      <button type="submit" className="text-sm text-warn hover:underline">
                        Faltou
                      </button>
                    </form>
                  </>
                )}
                {!agendamento && (
                  <form action={desativarHorario.bind(null, horario.id)}>
                    <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                      Fechar
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
        {horarios.length === 0 && <p className="text-sm text-ink-soft">Nenhum horário aberto ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
