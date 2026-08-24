"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

// Campo numerico opcional vindo de um <input type="number"> que pode
// chegar vazio ("") — sem o preprocess, z.coerce.number() transforma ""
// em 0, e ".positive()" rejeita 0 mesmo quando o campo so foi deixado em
// branco de proposito.
const numeroOpcional = () =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().positive().optional());

const avaliacaoSchema = z.object({
  data: z.string().min(1),
  peso: numeroOpcional(),
  altura: numeroOpcional(),
  percentualGordura: numeroOpcional(),
  cintura: numeroOpcional(),
  bracoDireito: numeroOpcional(),
  coxa: numeroOpcional(),
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

  // Constroi via Date.UTC a partir dos componentes do input (AAAA-MM-DD),
  // igual o hojeData() em src/lib/data.ts — nao usar `new Date(str+"T00:00")`
  // aqui, que depende do fuso do processo Node pra interpretar a hora local.
  const [ano, mes, dia] = parsed.data.split("-").map(Number);

  await prisma.avaliacao.create({
    data: {
      usuarioId,
      data: new Date(Date.UTC(ano, mes - 1, dia)),
      peso: parsed.peso ?? null,
      altura: parsed.altura ?? null,
      percentualGordura: parsed.percentualGordura ?? null,
      medidas: Object.keys(medidas).length > 0 ? medidas : undefined,
      observacoesNutricionais: parsed.observacoesNutricionais || null,
    },
  });

  revalidatePath(`/painel/admin/alunos/${usuarioId}`);
}
