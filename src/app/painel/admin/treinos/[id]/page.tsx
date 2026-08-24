import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { adicionarExercicioAoTreino, removerExercicioDoTreino } from "../actions";

export default async function PaginaEditarTreino({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const [treino, exercicios] = await Promise.all([
    prisma.treino.findUnique({
      where: { id },
      include: {
        usuario: true,
        exercicios: { include: { exercicio: true }, orderBy: { ordem: "asc" } },
      },
    }),
    prisma.exercicio.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!treino) notFound();

  const adicionar = adicionarExercicioAoTreino.bind(null, treino.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin · {treino.usuario.nome}
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{treino.nome}</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {treino.exercicios.map((prescricao) => (
          <li
            key={prescricao.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{prescricao.exercicio.nome}</p>
              <p className="text-sm text-ink-soft">
                {[
                  prescricao.series && `${prescricao.series} séries`,
                  prescricao.repeticoes && `${prescricao.repeticoes} repetições`,
                  prescricao.carga && `carga: ${prescricao.carga}`,
                  prescricao.descanso && `descanso: ${prescricao.descanso}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {prescricao.observacoes && (
                <p className="mt-1 text-xs text-ink-soft">{prescricao.observacoes}</p>
              )}
            </div>
            <form action={removerExercicioDoTreino.bind(null, prescricao.id, treino.id)}>
              <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                Remover
              </button>
            </form>
          </li>
        ))}
        {treino.exercicios.length === 0 && (
          <p className="text-sm text-ink-soft">Nenhum exercício nessa ficha ainda.</p>
        )}
      </ul>

      <form
        action={adicionar}
        className="mt-8 grid grid-cols-2 gap-3 rounded-lg border border-line bg-paper-raised p-4"
      >
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-ink">
          Exercício
          <select
            name="exercicioId"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            {exercicios.map((exercicio) => (
              <option key={exercicio.id} value={exercicio.id}>
                {exercicio.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Séries
          <input
            name="series"
            type="number"
            min={1}
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Repetições
          <input
            name="repeticoes"
            placeholder="ex: 8-12"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Carga
          <input
            name="carga"
            placeholder="ex: 20kg"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Descanso
          <input
            name="descanso"
            placeholder="ex: 60s"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-ink">
          Observações
          <input
            name="observacoes"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          className="col-span-2 mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink"
        >
          + Adicionar à ficha
        </button>
      </form>

      <Link
        href={`/painel/admin/treinos/aluno/${treino.usuarioId}`}
        className="mt-10 inline-block text-sm text-ink-soft hover:text-ink"
      >
        ← Voltar pras fichas de {treino.usuario.nome}
      </Link>
    </main>
  );
}
