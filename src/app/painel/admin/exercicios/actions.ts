"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const exercicioSchema = z.object({
  nome: z.string().trim().min(2),
  descricao: z.string().trim().optional(),
  instrucoes: z.string().trim().optional(),
  cuidados: z.string().trim().optional(),
  videoId: z.string().optional(),
});

export async function salvarExercicio(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = exercicioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    instrucoes: parsed.data.instrucoes || null,
    cuidados: parsed.data.cuidados || null,
    videoId: parsed.data.videoId || null,
  };

  if (id === "novo") {
    await prisma.exercicio.create({ data: dados });
  } else {
    await prisma.exercicio.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/exercicios");
  redirect("/painel/admin/exercicios");
}

export async function alternarAtivoExercicio(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.exercicio.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/exercicios");
}
