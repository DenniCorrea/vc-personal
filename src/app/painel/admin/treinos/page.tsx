import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

export default async function PaginaAdminTreinos() {
  await exigirPapel("ADMIN");

  const alunos = await prisma.usuario.findMany({
    where: { role: "ALUNO", ativo: true },
    include: { _count: { select: { treinos: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Treinos</h1>
      <p className="mt-2 text-sm text-ink-soft">Escolha um aluno pra ver ou montar a ficha dele.</p>

      <ul className="mt-6 flex flex-col gap-2">
        {alunos.map((aluno) => (
          <li
            key={aluno.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{aluno.nome}</p>
              <p className="text-sm text-ink-soft">
                {aluno._count.treinos} {aluno._count.treinos === 1 ? "ficha" : "fichas"}
              </p>
            </div>
            <Link
              href={`/painel/admin/treinos/aluno/${aluno.id}`}
              className="text-sm font-medium text-accent"
            >
              Gerenciar
            </Link>
          </li>
        ))}
        {alunos.length === 0 && <p className="text-sm text-ink-soft">Nenhum aluno cadastrado ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
