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
  preco: z.coerce.number().positive(),
  precoAvulso: z.coerce.number().positive().optional(),
  beneficios: z.string().optional(),
});

const planoMentoriaSchema = z.object({
  nome: z.string().trim().min(2),
  descricao: z.string().trim().min(2),
  preco: z.coerce.number().positive(),
  precoAvulso: z.coerce.number().positive().optional(),
  beneficios: z.string().optional(),
});

// Textarea de um beneficio por linha — mais facil de editar pelo admin do
// que um campo tipo "adicionar item" com JS. Linhas vazias sao descartadas.
function linhasParaBeneficios(texto: string | undefined): string[] {
  return (texto ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

export async function salvarPlanoAluno(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  // `Object.fromEntries` so mantem o ULTIMO valor de cada chave — perderia
  // silenciosamente os outros tipos de atendimento marcados, ja que os 3
  // checkboxes compartilham o name "tiposAtendimento". `getAll` pega todos.
  const bruto = { ...Object.fromEntries(formData), tiposAtendimento: formData.getAll("tiposAtendimento") };
  const parsed = planoAlunoSchema.safeParse(bruto);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos");

  const dados = {
    produto: "ALUNO" as const,
    nome: parsed.data.nome,
    frequenciaSemanal: parsed.data.frequenciaSemanal,
    limiteAgendamentos: parsed.data.frequenciaSemanal,
    incluiNutricao: parsed.data.incluiNutricao === "on",
    tiposAtendimento: parsed.data.tiposAtendimento,
    preco: parsed.data.preco,
    precoAvulso: parsed.data.precoAvulso ?? null,
    beneficios: linhasParaBeneficios(parsed.data.beneficios),
  };

  if (id === "novo") {
    await prisma.plano.create({ data: dados });
  } else {
    await prisma.plano.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/planos");
  redirect("/painel/admin/planos");
}

export async function salvarPlanoMentoria(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = planoMentoriaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados invalidos");

  const dados = {
    produto: "MENTORIA" as const,
    nome: parsed.data.nome,
    descricao: parsed.data.descricao,
    preco: parsed.data.preco,
    precoAvulso: parsed.data.precoAvulso ?? null,
    beneficios: linhasParaBeneficios(parsed.data.beneficios),
  };

  if (id === "novo") {
    await prisma.plano.create({ data: dados });
  } else {
    await prisma.plano.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/planos");
  redirect("/painel/admin/planos");
}

export async function alternarAtivoPlano(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.plano.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/planos");
}
