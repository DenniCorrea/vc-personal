"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const planoAlunoSchema = z.object({
  nome: z.string().trim().min(2),
  frequenciaSemanal: z.coerce.number().int().min(1).max(7),
  incluiNutricao: z.literal("on").optional(),
  tiposAtendimento: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .pipe(z.array(z.enum(["VIDEO", "PRESENCIAL", "DISTANCIA"])).min(1)),
  precoMensal: z.coerce.number().positive(),
});

const planoConsultoriaSchema = z.object({
  nome: z.string().trim().min(2),
  descricao: z.string().trim().min(2),
  precoMensal: z.coerce.number().positive(),
});

export async function salvarPlanoAluno(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  // `Object.fromEntries` so mantem o ULTIMO valor de cada chave — perderia
  // silenciosamente os outros tipos de atendimento marcados, ja que os 3
  // checkboxes compartilham o name "tiposAtendimento". `getAll` pega todos.
  const bruto = { ...Object.fromEntries(formData), tiposAtendimento: formData.getAll("tiposAtendimento") };
  const parsed = planoAlunoSchema.safeParse(bruto);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos");

  const dados = {
    nome: parsed.data.nome,
    frequenciaSemanal: parsed.data.frequenciaSemanal,
    incluiNutricao: parsed.data.incluiNutricao === "on",
    tiposAtendimento: parsed.data.tiposAtendimento,
    precoMensal: parsed.data.precoMensal,
  };

  if (id === "novo") {
    await prisma.planoAluno.create({ data: dados });
  } else {
    await prisma.planoAluno.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/planos");
  redirect("/painel/admin/planos");
}

export async function salvarPlanoConsultoria(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = planoConsultoriaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos");

  if (id === "novo") {
    await prisma.planoConsultoria.create({ data: parsed.data });
  } else {
    await prisma.planoConsultoria.update({ where: { id }, data: parsed.data });
  }
  revalidatePath("/painel/admin/planos");
  redirect("/painel/admin/planos");
}

export async function alternarAtivoPlanoAluno(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.planoAluno.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/planos");
}

export async function alternarAtivoPlanoConsultoria(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.planoConsultoria.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/planos");
}
