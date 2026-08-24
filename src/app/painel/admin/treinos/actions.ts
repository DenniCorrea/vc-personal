"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

export async function criarTreino(usuarioId: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const nome = z.string().trim().min(2).parse(formData.get("nome"));

  const treino = await prisma.treino.create({ data: { usuarioId, nome } });
  revalidatePath(`/painel/admin/treinos/aluno/${usuarioId}`);
  redirect(`/painel/admin/treinos/${treino.id}`);
}

export async function alternarAtivoTreino(id: string, usuarioId: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.treino.update({ where: { id }, data: { ativo } });
  revalidatePath(`/painel/admin/treinos/aluno/${usuarioId}`);
}

const prescricaoSchema = z.object({
  exercicioId: z.string().min(1),
  series: z.coerce.number().int().positive().optional(),
  repeticoes: z.string().trim().optional(),
  carga: z.string().trim().optional(),
  descanso: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

export async function adicionarExercicioAoTreino(treinoId: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = prescricaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const ultimaOrdem = await prisma.treinoExercicio.count({ where: { treinoId } });

  await prisma.treinoExercicio.create({
    data: {
      treinoId,
      exercicioId: parsed.data.exercicioId,
      ordem: ultimaOrdem,
      series: parsed.data.series,
      repeticoes: parsed.data.repeticoes || null,
      carga: parsed.data.carga || null,
      descanso: parsed.data.descanso || null,
      observacoes: parsed.data.observacoes || null,
    },
  });
  revalidatePath(`/painel/admin/treinos/${treinoId}`);
}

export async function removerExercicioDoTreino(treinoExercicioId: string, treinoId: string) {
  await exigirPapel("ADMIN");
  await prisma.treinoExercicio.delete({ where: { id: treinoExercicioId } });
  revalidatePath(`/painel/admin/treinos/${treinoId}`);
}
