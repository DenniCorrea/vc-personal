import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoPlanoAluno, alternarAtivoPlanoConsultoria } from "./actions";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function PaginaAdminPlanos() {
  await exigirPapel("ADMIN");

  const [planosAluno, planosConsultoria] = await Promise.all([
    prisma.planoAluno.findMany({ orderBy: { criadoEm: "asc" } }),
    prisma.planoConsultoria.findMany({ orderBy: { criadoEm: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Planos</h1>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Planos de aluno</h2>
          <Link href="/painel/admin/planos/aluno/novo" className="text-sm font-medium text-accent">
            + Novo plano
          </Link>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {planosAluno.map((plano) => (
            <li
              key={plano.id}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">
                  {plano.nome}{" "}
                  {!plano.ativo && (
                    <span className="text-xs font-normal text-ink-soft">(inativo)</span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">
                  {plano.frequenciaSemanal}x/semana · {formatoMoeda.format(Number(plano.precoMensal))}
                  /mês{plano.incluiNutricao ? " · com nutrição" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/painel/admin/planos/aluno/${plano.id}`}
                  className="text-sm font-medium text-accent"
                >
                  Editar
                </Link>
                <form
                  action={alternarAtivoPlanoAluno.bind(null, plano.id, !plano.ativo)}
                >
                  <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                    {plano.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
              </div>
            </li>
          ))}
          {planosAluno.length === 0 && (
            <p className="text-sm text-ink-soft">Nenhum plano de aluno cadastrado ainda.</p>
          )}
        </ul>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Planos de consultoria</h2>
          <Link
            href="/painel/admin/planos/consultoria/novo"
            className="text-sm font-medium text-accent"
          >
            + Novo plano
          </Link>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {planosConsultoria.map((plano) => (
            <li
              key={plano.id}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">
                  {plano.nome}{" "}
                  {!plano.ativo && (
                    <span className="text-xs font-normal text-ink-soft">(inativo)</span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">
                  {formatoMoeda.format(Number(plano.precoMensal))}/mês
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/painel/admin/planos/consultoria/${plano.id}`}
                  className="text-sm font-medium text-accent"
                >
                  Editar
                </Link>
                <form
                  action={alternarAtivoPlanoConsultoria.bind(null, plano.id, !plano.ativo)}
                >
                  <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                    {plano.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
              </div>
            </li>
          ))}
          {planosConsultoria.length === 0 && (
            <p className="text-sm text-ink-soft">Nenhum plano de consultoria cadastrado ainda.</p>
          )}
        </ul>
      </section>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
