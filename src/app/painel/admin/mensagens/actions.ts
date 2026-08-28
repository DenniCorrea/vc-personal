"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { dataHoraLocal } from "@/lib/data";

const mensagemSchema = z.object({
  texto: z.string().trim().min(2),
  frequencia: z.enum(["DIARIA", "SEMANAL"]),
  publicadoEm: z.string().min(1),
});

export async function salvarMensagem(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = mensagemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    texto: parsed.data.texto,
    frequencia: parsed.data.frequencia,
    publicadoEm: dataHoraLocal(parsed.data.publicadoEm, "00:00"),
  };

  if (id === "novo") {
    await prisma.mensagemMentalidade.create({ data: dados });
  } else {
    await prisma.mensagemMentalidade.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/mensagens");
  redirect("/painel/admin/mensagens");
}

export async function alternarAtivoMensagem(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.mensagemMentalidade.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/mensagens");
}
