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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Alertas
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Seus avisos</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        {alertas.some((a) => !a.lido) && (
          <form action={marcarTodosComoLidos}>
            <button
              type="submit"
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
            >
              Marcar tudo como lido
            </button>
          </form>
        )}
        {session.user.role === "ADMIN" && (
          <form action={verificarAlertasAgora}>
            <button
              type="submit"
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
            >
              Verificar alertas agora
            </button>
          </form>
        )}
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {alertas.map((alerta) => (
          <li
            key={alerta.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              alerta.lido ? "border-line bg-paper-raised" : "border-accent bg-paper-raised"
            }`}
          >
            <div>
              <p className="text-ink">{alerta.mensagem}</p>
              <p className="text-xs text-ink-soft">{formatoDataHora.format(alerta.criadoEm)}</p>
            </div>
            {!alerta.lido && (
              <form action={marcarComoLido.bind(null, alerta.id)}>
                <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                  Marcar como lido
                </button>
              </form>
            )}
          </li>
        ))}
        {alertas.length === 0 && <p className="text-sm text-ink-soft">Nenhum alerta ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
