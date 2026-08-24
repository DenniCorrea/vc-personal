"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const anamneseSchema = z.object({
  tempoTreino: z.enum(["NUNCA_TREINOU", "UM_A_TRES_ANOS", "MAIS_DE_TRES_ANOS"]),
  diasDisponiveis: z.coerce.number().int().min(1).max(7),
  objetivo: z.enum(["HIPERTROFIA", "EMAGRECIMENTO", "SAUDE_CONSTANCIA", "PERFORMANCE"]),
  lesoesRestricoes: z.string().trim().optional(),
});

export async function responderAnamnese(formData: FormData) {
  const session = await exigirPapel("ALUNO");
  const parsed = anamneseSchema.parse(Object.fromEntries(formData));

  await prisma.anamnese.upsert({
    where: { usuarioId: session.user.id },
    update: {
      tempoTreino: parsed.tempoTreino,
      diasDisponiveis: parsed.diasDisponiveis,
      objetivo: parsed.objetivo,
      lesoesRestricoes: parsed.lesoesRestricoes || null,
    },
    create: {
      usuarioId: session.user.id,
      tempoTreino: parsed.tempoTreino,
      diasDisponiveis: parsed.diasDisponiveis,
      objetivo: parsed.objetivo,
      lesoesRestricoes: parsed.lesoesRestricoes || null,
    },
  });

  redirect("/painel");
}
