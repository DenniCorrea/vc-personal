"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

// Só ALUNO: ver o comentário em ./page.tsx. Esconder a tela do menu não
// basta — Server Action é um endpoint, e aceita POST de quem souber o
// caminho. Quem protege é a própria ação.
import { hojeData } from "@/lib/data";
import type { TipoHabito } from "@/generated/prisma/enums";

const metaSchema = z.object({
  metaValor: z.coerce.number().positive(),
  lembreteHorario: z.string().trim().optional(),
  lembreteAtivo: z.literal("on").optional(),
});

export async function definirMeta(tipo: TipoHabito, formData: FormData) {
  const session = await exigirPapel("ALUNO");
  const parsed = metaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    metaValor: parsed.data.metaValor,
    lembreteHorario: parsed.data.lembreteHorario || null,
    lembreteAtivo: parsed.data.lembreteAtivo === "on",
  };

  await prisma.habito.upsert({
    where: { usuarioId_tipo: { usuarioId: session.user.id, tipo } },
    update: dados,
    create: { usuarioId: session.user.id, tipo, ...dados },
  });
  revalidatePath("/painel/habitos");
}

// Pra agua: os botoes de "+250ml" SOMAM ao que ja foi registrado hoje —
// ninguem quer perder a conta do que ja bebeu porque clicou de novo.
export async function incrementarHabito(tipo: TipoHabito, delta: number) {
  const session = await exigirPapel("ALUNO");

  const habito = await prisma.habito.findUnique({
    where: { usuarioId_tipo: { usuarioId: session.user.id, tipo } },
  });
  if (!habito) throw new Error("Defina uma meta antes de registrar.");

  await prisma.habitoRegistro.upsert({
    where: { habitoId_data: { habitoId: habito.id, data: hojeData() } },
    update: { valor: { increment: delta } },
    create: { habitoId: habito.id, data: hojeData(), valor: delta },
  });
  revalidatePath("/painel/habitos");
}

// Pra sono: um valor unico por dia ("dormi 7h essa noite"), substitui o
// que tinha antes em vez de somar.
export async function definirValorHabito(tipo: TipoHabito, formData: FormData) {
  const session = await exigirPapel("ALUNO");
  const valor = z.coerce.number().nonnegative().parse(formData.get("valor"));

  const habito = await prisma.habito.findUnique({
    where: { usuarioId_tipo: { usuarioId: session.user.id, tipo } },
  });
  if (!habito) throw new Error("Defina uma meta antes de registrar.");

  await prisma.habitoRegistro.upsert({
    where: { habitoId_data: { habitoId: habito.id, data: hojeData() } },
    update: { valor },
    create: { habitoId: habito.id, data: hojeData(), valor },
  });
  revalidatePath("/painel/habitos");
}
