import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoPlano } from "./actions";
import type { PlanoModel } from "@/generated/prisma/models";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function PaginaAdminPlanos() {
  await exigirPapel("ADMIN");

  const [planosAluno, planosMentoria] = await Promise.all([
    prisma.plano.findMany({ where: { produto: "ALUNO" }, orderBy: { criadoEm: "asc" } }),
    prisma.plano.findMany({ where: { produto: "MENTORIA" }, orderBy: { criadoEm: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Planos</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Dois produtos, dois públicos — os planos de aluno nunca aparecem pra quem assina
        mentoria, e vice-versa.
      </p>

      <SecaoPlanos
        titulo="Planos de aluno"
        hrefNovo="/painel/admin/planos/aluno/novo"
        hrefEditarBase="/painel/admin/planos/aluno"
        planos={planosAluno}
        detalhe={(plano) =>
          `${plano.frequenciaSemanal}x/semana · ${formatoMoeda.format(Number(plano.preco))}/mês${
            plano.incluiNutricao ? " · com nutrição" : ""
          }`
        }
      />

      <SecaoPlanos
        titulo="Planos de mentoria"
        hrefNovo="/painel/admin/planos/mentoria/novo"
        hrefEditarBase="/painel/admin/planos/mentoria"
        planos={planosMentoria}
        detalhe={(plano) => `${formatoMoeda.format(Number(plano.preco))}/mês`}
      />

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}

function SecaoPlanos({
  titulo,
  hrefNovo,
  hrefEditarBase,
  planos,
  detalhe,
}: {
  titulo: string;
  hrefNovo: string;
  hrefEditarBase: string;
  planos: PlanoModel[];
  detalhe: (plano: PlanoModel) => string;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">{titulo}</h2>
        <Link href={hrefNovo} className="text-sm font-medium text-accent">
          + Novo plano
        </Link>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {planos.map((plano) => (
          <li
            key={plano.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">
                {plano.nome}{" "}
                {!plano.ativo && <span className="text-xs font-normal text-ink-soft">(inativo)</span>}
              </p>
              <p className="text-sm text-ink-soft">{detalhe(plano)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`${hrefEditarBase}/${plano.id}`} className="text-sm font-medium text-accent">
                Editar
              </Link>
              <form action={alternarAtivoPlano.bind(null, plano.id, !plano.ativo)}>
                <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                  {plano.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
            </div>
          </li>
        ))}
        {planos.length === 0 && <p className="text-sm text-ink-soft">Nenhum plano cadastrado ainda.</p>}
      </ul>
    </section>
  );
}
