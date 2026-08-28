import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";
import { inicioDoCicloAtual } from "@/lib/mentoria";

const formatoDia = formatador({ weekday: "long", day: "2-digit", month: "long" });
const formatoHora = formatador({ hour: "2-digit", minute: "2-digit" });

// Agenda do mentorado — SOMENTE LEITURA desde 28/08/2026.
//
// Regra revisada pelo Victor: ele combina a sessao por fora (conversa,
// WhatsApp) e marca direto no nome da pessoa; o mentorado so e avisado.
// Por isso aqui nao ha mais lista de horarios vagos nem botao de reservar
// — oferecer isso seria prometer um auto-atendimento que nao existe.
export default async function PaginaAgenda() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
    include: { plano: true },
  });

  if (!assinatura) {
    return (
      <main className="max-w-md pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Minhas sessões</p>
        <h1 className="font-display mt-1 text-[28px] text-ink">Você ainda não tem assinatura ativa</h1>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const agora = new Date();

  const [proximas, passadas, usadasNoCiclo] = await Promise.all([
    prisma.agendamento.findMany({
      where: { usuarioId: session.user.id, status: { not: "CANCELADO" }, horario: { inicio: { gte: agora } } },
      orderBy: { horario: { inicio: "asc" } },
      include: { horario: true },
    }),
    prisma.agendamento.findMany({
      where: { usuarioId: session.user.id, horario: { inicio: { lt: agora } } },
      orderBy: { horario: { inicio: "desc" } },
      take: 5,
      include: { horario: true },
    }),
    prisma.agendamento.count({
      where: {
        assinaturaId: assinatura.id,
        avulso: false,
        status: { not: "CANCELADO" },
        horario: { inicio: { gte: inicioDoCicloAtual(assinatura.dataProximaRenovacao) } },
      },
    }),
  ]);

  const limite = assinatura.plano.limiteAgendamentos ?? null;

  return (
    <main className="max-w-2xl pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Minhas sessões</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-[32px] text-ink md:text-[36px]">Agenda</h1>
        {limite != null && (
          <p className="text-[13px] text-ink-soft">
            {usadasNoCiclo} de {limite >= 999 ? "∞" : limite} usadas neste ciclo
          </p>
        )}
      </div>

      {proximas.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[14px] text-ink">Nenhuma sessão marcada.</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            O Victor combina o horário com você e marca por aqui — você recebe um aviso assim
            que ele marcar, e lembretes antes da sessão.
          </p>
          <Link href="/painel/mensagens" className="mt-3 inline-block text-[13px] font-medium text-accent">
            Falar com o Victor
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5">
          {proximas.map((s, i) => (
            <div
              key={s.id}
              className="rounded-[4px] border p-5"
              style={{
                borderColor: i === 0 ? "var(--color-accent-border)" : "var(--color-line)",
                background:
                  i === 0
                    ? "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))"
                    : "var(--color-card)",
              }}
            >
              {i === 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Próxima</p>
              )}
              <p className="font-display mt-1 text-[22px] capitalize text-ink">
                {formatoDia.format(s.horario.inicio)}
              </p>
              <p className="mt-0.5 font-mono text-[15px] text-ink-soft">
                {formatoHora.format(s.horario.inicio)} — {formatoHora.format(s.horario.fim)}
              </p>
            </div>
          ))}
        </div>
      )}

      {passadas.length > 0 && (
        <section className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Sessões anteriores</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {passadas.map((s) => (
              <div key={s.id} className="flex items-center gap-4 rounded-[3px] border border-line px-4 py-2.5">
                <span className="font-mono text-[12px] text-ink-faint">
                  {formatoHora.format(s.horario.inicio)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] capitalize text-ink-soft">
                  {formatoDia.format(s.horario.inicio)}
                </span>
                <span className="text-[12px] text-ink-faint">
                  {s.status === "CANCELADO" ? "cancelada" : s.status === "CONCLUIDO" ? "realizada" : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
