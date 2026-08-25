import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import { marcarComoLido, marcarTodosComoLidos, verificarAlertasAgora } from "./actions";

const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PaginaAlertas() {
  const session = await exigirSessao();

  const alertas = await prisma.alerta.findMany({
    where: { usuarioId: session.user.id },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-2xl px-6 pt-cabecalho-aluno pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Alertas</p>
      <h1 className="font-display mt-1 text-[26px] text-ink">Seus avisos</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        {alertas.some((a) => !a.lido) && (
          <form action={marcarTodosComoLidos}>
            <button
              type="submit"
              className="rounded-[2px] border border-line px-4 py-2 text-[12px] font-medium text-ink hover:border-accent-border"
            >
              Marcar tudo como lido
            </button>
          </form>
        )}
        {session.user.role === "ADMIN" && (
          <form action={verificarAlertasAgora}>
            <button
              type="submit"
              className="rounded-[2px] border border-line px-4 py-2 text-[12px] font-medium text-ink hover:border-accent-border"
            >
              Verificar alertas agora
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className="flex items-center justify-between rounded-[4px] border p-4"
            style={{
              borderColor: alerta.lido ? "var(--color-line)" : "var(--color-accent-border)",
              background: alerta.lido ? "var(--color-card)" : "var(--color-accent-wash)",
            }}
          >
            <div>
              <p className="text-[14px] text-ink">{alerta.mensagem}</p>
              <p className="mt-0.5 text-[12px] text-ink-faint">{formatoDataHora.format(alerta.criadoEm)}</p>
            </div>
            {!alerta.lido && (
              <form action={marcarComoLido.bind(null, alerta.id)}>
                <button type="submit" className="shrink-0 text-[12px] text-ink-soft hover:text-ink">
                  Marcar como lido
                </button>
              </form>
            )}
          </div>
        ))}
        {alertas.length === 0 && <p className="text-[13px] text-ink-soft">Nenhum alerta ainda.</p>}
      </div>

      <Link href="/painel" className="mt-10 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
