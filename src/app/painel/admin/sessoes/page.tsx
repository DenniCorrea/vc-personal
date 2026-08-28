import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador, paraInputDate } from "@/lib/data";
import { cancelarSessao, concluirSessao } from "./actions";
import { MarcarSessaoForm } from "./MarcarSessaoForm";

const formatoDia = formatador({ weekday: "short", day: "2-digit", month: "2-digit" });
const formatoHora = formatador({ hour: "2-digit", minute: "2-digit" });

// Agenda do mentor (handoff 6f, com a regra revisada pelo Victor em
// 28/08/2026): quem marca e ELE, direto no nome do mentorado. Nao existe
// mais horario vago pra alguem escolher.
export default async function PaginaSessoes() {
  await exigirPapel("ADMIN");

  const agora = new Date();

  const [mentorados, proximas, passadas] = await Promise.all([
    prisma.usuario.findMany({
      where: { role: "PERSONAL_PARCEIRO", ativo: true, assinaturas: { some: { status: "ATIVA" } } },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        assinaturas: {
          where: { status: "ATIVA" },
          take: 1,
          include: { plano: { select: { nome: true, limiteAgendamentos: true } } },
        },
      },
    }),
    prisma.agendamento.findMany({
      where: { status: { not: "CANCELADO" }, horario: { inicio: { gte: agora } } },
      orderBy: { horario: { inicio: "asc" } },
      include: {
        usuario: { select: { id: true, nome: true } },
        horario: true,
        assinatura: { include: { plano: { select: { nome: true } } } },
      },
    }),
    prisma.agendamento.findMany({
      where: { horario: { inicio: { lt: agora } } },
      orderBy: { horario: { inicio: "desc" } },
      take: 10,
      include: { usuario: { select: { nome: true } }, horario: true },
    }),
  ]);

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Sessões 1-on-1</h1>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Próximas sessões
          </p>

          {proximas.length === 0 ? (
            <div className="mt-3 rounded-[4px] border border-line bg-card p-6">
              <p className="text-[13px] text-ink-soft">Nenhuma sessão marcada.</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {proximas.map((s, i) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-4 rounded-[4px] border p-4"
                  style={{
                    borderColor: i === 0 ? "var(--color-accent-border)" : "var(--color-line)",
                    background: i === 0 ? "var(--color-accent-wash)" : "var(--color-card)",
                  }}
                >
                  <div className="shrink-0 text-center">
                    <p className="text-[11px] uppercase text-ink-faint">{formatoDia.format(s.horario.inicio)}</p>
                    <p className="font-mono text-[15px] text-ink">{formatoHora.format(s.horario.inicio)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-ink">{s.usuario.nome}</p>
                    <p className="text-[12px] text-ink-soft">
                      {s.assinatura.plano.nome} ·{" "}
                      {Math.round((s.horario.fim.getTime() - s.horario.inicio.getTime()) / 60_000)} min
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/painel/admin/conversas/${s.usuario.id}`}
                      className="text-[12px] font-medium text-accent"
                    >
                      Conversa
                    </Link>
                    <form action={concluirSessao.bind(null, s.id)}>
                      <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                        Concluir
                      </button>
                    </form>
                    <form action={cancelarSessao.bind(null, s.id)}>
                      <button type="submit" className="text-[12px] text-ink-soft hover:text-warn">
                        Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {passadas.length > 0 && (
            <>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                Histórico
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {passadas.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 rounded-[3px] border border-line px-4 py-2.5">
                    <span className="font-mono text-[12px] text-ink-faint">
                      {formatoDia.format(s.horario.inicio)} {formatoHora.format(s.horario.inicio)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">{s.usuario.nome}</span>
                    <span className="text-[12px] text-ink-faint">
                      {s.status === "CANCELADO" ? "cancelada" : s.status === "CONCLUIDO" ? "concluída" : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside>
          <div
            className="rounded-[4px] border border-accent-border p-5"
            style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.10), rgba(203,163,92,0.02))" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Marcar sessão</p>
            <MarcarSessaoForm
              mentorados={mentorados.map((m) => ({
                id: m.id,
                nome: m.nome,
                plano: m.assinaturas[0]?.plano.nome ?? "",
              }))}
              dataPadrao={paraInputDate(agora)}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
