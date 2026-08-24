"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData } from "@/lib/data";

const checkinSchema = z.object({
  refeicaoId: z.string().min(1),
  status: z.enum(["SEGUIU", "ADAPTOU"]),
  observacaoAdaptacao: z.string().trim().optional(),
});

// Ownership: so aceita check-in de uma refeicao que pertence ao PROPRIO
// plano nutricional do usuario logado — sem isso, alguem poderia mandar o
// id da refeicao de outro aluno e poluir o check-in dele.
export async function registrarCheckinNutricional(formData: FormData) {
  const session = await exigirPapel("ALUNO");
  const parsed = checkinSchema.parse(Object.fromEntries(formData));

  const refeicao = await prisma.refeicao.findFirst({
    where: { id: parsed.refeicaoId, planoNutricional: { usuarioId: session.user.id } },
  });
  if (!refeicao) throw new Error("Refeição não encontrada.");

  await prisma.checkinNutricional.upsert({
    where: { refeicaoId_data: { refeicaoId: refeicao.id, data: hojeData() } },
    update: {
      status: parsed.status,
      observacaoAdaptacao: parsed.status === "ADAPTOU" ? parsed.observacaoAdaptacao || null : null,
    },
    create: {
      refeicaoId: refeicao.id,
      data: hojeData(),
      status: parsed.status,
      observacaoAdaptacao: parsed.status === "ADAPTOU" ? parsed.observacaoAdaptacao || null : null,
    },
  });

  revalidatePath("/painel/nutricao");
  revalidatePath("/painel");
}
