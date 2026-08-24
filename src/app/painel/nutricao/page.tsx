import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData } from "@/lib/data";
import { CheckinForm } from "./CheckinForm";

export default async function PaginaNutricao() {
  const session = await exigirPapel("ALUNO");
  const hoje = hojeData();

  const plano = await prisma.planoNutricional.findUnique({
    where: { usuarioId: session.user.id },
    include: {
      refeicoes: {
        include: { checkins: { where: { data: hoje } } },
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!plano || plano.refeicoes.length === 0) {
    return (
      <main className="px-6 pt-13 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Nutrição</p>
        <h1 className="font-display mt-1 text-[28px] text-ink">Plano alimentar</h1>
        <p className="mt-4 text-[14px] text-ink-soft">
          Seu plano atual não inclui um planejamento alimentar, ou o Victor ainda não montou o seu.
        </p>
      </main>
    );
  }

  const feitas = plano.refeicoes.filter((r) => r.checkins.length > 0);
  const primeiraNaoFeita = plano.refeicoes.find((r) => r.checkins.length === 0);

  return (
    <main className="px-6 pt-13 pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
      </p>
      <h1 className="font-display mt-1 text-[28px] text-ink">Plano alimentar</h1>

      <div className="mt-6 flex flex-col gap-3">
        {plano.refeicoes.map((refeicao) => {
          const checkin = refeicao.checkins[0];

          if (checkin) {
            return (
              <div key={refeicao.id} className="rounded-[4px] border border-line bg-card p-4 opacity-72">
                <div className="flex items-baseline justify-between">
                  <p className="text-[15px] font-medium text-ink">{refeicao.nome}</p>
                  <p
                    className="text-[12px] font-medium"
                    style={{ color: checkin.status === "SEGUIU" ? "var(--color-accent)" : "var(--color-ink-soft)" }}
                  >
                    {checkin.status === "SEGUIU" ? "Segui o planejamento" : "Fiz adaptações"}
                  </p>
                </div>
                {checkin.observacaoAdaptacao && (
                  <p
                    className="mt-2 rounded-[2px] border-l-2 border-accent p-2 text-[12px] text-ink-soft"
                    style={{ background: "rgba(201,168,124,0.06)" }}
                  >
                    {checkin.observacaoAdaptacao}
                  </p>
                )}
              </div>
            );
          }

          if (refeicao.id === primeiraNaoFeita?.id) {
            return (
              <CheckinForm
                key={refeicao.id}
                refeicaoId={refeicao.id}
                nome={refeicao.nome}
                horario={refeicao.horario}
                composicao={refeicao.composicao}
              />
            );
          }

          return (
            <div key={refeicao.id} className="rounded-[4px] border border-line p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[15px] text-ink">{refeicao.nome}</p>
                {refeicao.horario && <p className="text-[12px] text-ink-faint">{refeicao.horario}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-soft">
        {feitas.length} de {plano.refeicoes.length} refeições hoje
      </p>
    </main>
  );
}
