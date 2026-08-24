import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { criarTreino, alternarAtivoTreino } from "../../actions";

export default async function PaginaTreinosDoAluno({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  await exigirPapel("ADMIN");
  const { usuarioId } = await params;

  const aluno = await prisma.usuario.findFirst({ where: { id: usuarioId, role: "ALUNO" } });
  if (!aluno) notFound();

  const treinos = await prisma.treino.findMany({
    where: { usuarioId },
    include: { _count: { select: { exercicios: true } } },
    orderBy: { criadoEm: "asc" },
  });

  const criar = criarTreino.bind(null, usuarioId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Fichas de {aluno.nome}</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {treinos.map((treino) => (
          <li
            key={treino.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">
                {treino.nome}{" "}
                {!treino.ativo && <span className="text-xs font-normal text-ink-soft">(inativo)</span>}
              </p>
              <p className="text-sm text-ink-soft">{treino._count.exercicios} exercícios</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/painel/admin/treinos/${treino.id}`} className="text-sm font-medium text-accent">
                Editar
              </Link>
              <form action={alternarAtivoTreino.bind(null, treino.id, usuarioId, !treino.ativo)}>
                <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                  {treino.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
            </div>
          </li>
        ))}
        {treinos.length === 0 && <p className="text-sm text-ink-soft">Nenhuma ficha ainda.</p>}
      </ul>

      <form action={criar} className="mt-8 flex gap-2">
        <input
          name="nome"
          placeholder="ex: Treino A - Superior"
          required
          className="flex-1 rounded-lg border border-line bg-paper-raised px-3 py-2 text-base text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
        >
          + Nova ficha
        </button>
      </form>

      <Link href="/painel/admin/treinos" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pra lista de alunos
      </Link>
    </main>
  );
}
