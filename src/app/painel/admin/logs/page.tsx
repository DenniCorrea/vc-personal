import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PaginaLogsAdmin() {
  await exigirPapel("ADMIN");

  const logs = await prisma.logAdmin.findMany({
    include: { admin: true },
    orderBy: { criadoEm: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        Histórico de ações administrativas
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Registro de ações que mexem em acesso ou dinheiro — cortesias, planos, vídeos.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-lg border border-line bg-paper-raised px-4 py-3">
            <p className="text-ink">
              <span className="font-medium">{log.admin.nome}</span> {log.acao}{" "}
              <span className="text-ink-soft">({log.entidade})</span>
            </p>
            <p className="text-xs text-ink-soft">{formatoDataHora.format(log.criadoEm)}</p>
          </li>
        ))}
        {logs.length === 0 && <p className="text-sm text-ink-soft">Nenhuma ação registrada ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
