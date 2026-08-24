"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const avaliacaoSchema = z.object({
  data: z.string().min(1),
  peso: z.coerce.number().positive().optional(),
  altura: z.coerce.number().positive().optional(),
  percentualGordura: z.coerce.number().positive().optional(),
  cintura: z.coerce.number().positive().optional(),
  bracoDireito: z.coerce.number().positive().optional(),
  coxa: z.coerce.number().positive().optional(),
  observacoesNutricionais: z.string().trim().optional(),
});

// Medidas guardadas como JSON (ver comentario no schema.prisma sobre o
// campo `Avaliacao.medidas`) — o form so expoe as 3 mais comuns por
// enquanto; o admin pode adicionar mais campos direto no banco se precisar
// de uma medida fora dessa lista, sem migration.
export async function registrarAvaliacao(usuarioId: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = avaliacaoSchema.parse(Object.fromEntries(formData));

  const medidas: Record<string, number> = {};
  if (parsed.cintura) medidas.cintura = parsed.cintura;
  if (parsed.bracoDireito) medidas["braço direito"] = parsed.bracoDireito;
  if (parsed.coxa) medidas.coxa = parsed.coxa;

  await prisma.avaliacao.create({
    data: {
      usuarioId,
      data: new Date(`${parsed.data}T00:00`),
      peso: parsed.peso ?? null,
      altura: parsed.altura ?? null,
      percentualGordura: parsed.percentualGordura ?? null,
      medidas: Object.keys(medidas).length > 0 ? medidas : undefined,
      observacoesNutricionais: parsed.observacoesNutricionais || null,
    },
  });

  revalidatePath(`/painel/admin/alunos/${usuarioId}`);
}
