import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoExercicio } from "./actions";

export default async function PaginaAdminExercicios() {
  await exigirPapel("ADMIN");

  const exercicios = await prisma.exercicio.findMany({
    include: { video: true },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Exercícios</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Catálogo reutilizável — os números de série/repetição ficam na ficha de cada aluno, não
        aqui.
      </p>

      <Link
        href="/painel/admin/exercicios/novo"
        className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        + Novo exercício
      </Link>

      <ul className="mt-6 flex flex-col gap-2">
        {exercicios.map((exercicio) => (
          <li
            key={exercicio.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">
                {exercicio.nome}{" "}
                {!exercicio.ativo && <span className="text-xs font-normal text-ink-soft">(inativo)</span>}
              </p>
              <p className="text-sm text-ink-soft">
                {exercicio.video ? `Vídeo: ${exercicio.video.titulo}` : "Sem vídeo vinculado"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/painel/admin/exercicios/${exercicio.id}`} className="text-sm font-medium text-accent">
                Editar
              </Link>
              <form action={alternarAtivoExercicio.bind(null, exercicio.id, !exercicio.ativo)}>
                <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                  {exercicio.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
            </div>
          </li>
        ))}
        {exercicios.length === 0 && <p className="text-sm text-ink-soft">Nenhum exercício cadastrado ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
