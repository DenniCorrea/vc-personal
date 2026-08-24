"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData } from "@/lib/data";

const registrarSerieSchema = z.object({
  exercicioId: z.string().min(1),
  numeroSerie: z.coerce.number().int().positive(),
  carga: z.string().optional(),
  repeticoes: z.string().optional(),
});

// Salva UMA serie de UM exercicio, no dia de hoje. Upsert por
// (usuario, exercicio, data, numeroSerie) — reenviar a mesma serie so
// atualiza o valor, nunca duplica (o design pede "salvamento otimista por
// serie", ou seja, cada linha se salva sozinha).
export async function registrarSerie(treinoId: string, formData: FormData) {
  const session = await exigirPapel("ALUNO");
  const parsed = registrarSerieSchema.parse(Object.fromEntries(formData));

  const carga = parsed.carga ? Number(parsed.carga) : null;
  const repeticoes = parsed.repeticoes ? Number(parsed.repeticoes) : null;

  await prisma.execucaoExercicio.upsert({
    where: {
      usuarioId_exercicioId_data_numeroSerie: {
        usuarioId: session.user.id,
        exercicioId: parsed.exercicioId,
        data: hojeData(),
        numeroSerie: parsed.numeroSerie,
      },
    },
    update: { carga, repeticoes },
    create: {
      usuarioId: session.user.id,
      exercicioId: parsed.exercicioId,
      data: hojeData(),
      numeroSerie: parsed.numeroSerie,
      carga,
      repeticoes,
    },
  });

  revalidatePath(`/painel/treinos/${treinoId}`);
  revalidatePath("/painel");
}
