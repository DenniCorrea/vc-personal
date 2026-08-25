import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData } from "@/lib/data";
import { ExecucaoTreinoClient } from "./ExecucaoTreinoClient";

export default async function PaginaExecucaoTreino({ params }: PageProps<"/painel/treinos/[id]">) {
  const { id } = await params;
  const session = await exigirPapel("ALUNO");
  const hoje = hojeData();

  // Ownership: so retorna se o treino for do proprio usuario logado — mesmo
  // que alguem adivinhe o id de uma ficha de outro aluno, essa query nao
  // devolve nada.
  const treino = await prisma.treino.findFirst({
    where: { id, usuarioId: session.user.id },
    include: {
      exercicios: {
        include: { exercicio: { include: { video: true } } },
        orderBy: { ordem: "asc" },
      },
    },
  });
  if (!treino) notFound();

  // Pra cada exercicio: a ULTIMA data (antes de hoje) em que teve execucao
  // registrada, e as series de hoje (se ja tiver comecado a registrar).
  const exerciciosComHistorico = await Promise.all(
    treino.exercicios.map(async (prescricao) => {
      const ultimaExecucao = await prisma.execucaoExercicio.findFirst({
        where: { usuarioId: session.user.id, exercicioId: prescricao.exercicioId, data: { lt: hoje } },
        orderBy: { data: "desc" },
        select: { data: true },
      });

      const [seriesAnteriores, seriesHoje] = await Promise.all([
        ultimaExecucao
          ? prisma.execucaoExercicio.findMany({
              where: {
                usuarioId: session.user.id,
                exercicioId: prescricao.exercicioId,
                data: ultimaExecucao.data,
              },
              orderBy: { numeroSerie: "asc" },
            })
          : Promise.resolve([]),
        prisma.execucaoExercicio.findMany({
          where: { usuarioId: session.user.id, exercicioId: prescricao.exercicioId, data: hoje },
          orderBy: { numeroSerie: "asc" },
        }),
      ]);

      return { prescricao, seriesAnteriores, seriesHoje, dataUltimaExecucao: ultimaExecucao?.data ?? null };
    }),
  );

  return <ExecucaoTreinoClient treinoId={treino.id} treinoNome={treino.nome} exercicios={exerciciosComHistorico} />;
}
