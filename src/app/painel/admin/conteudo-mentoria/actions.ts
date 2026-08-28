"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { dataHoraLocal } from "@/lib/data";

const conteudoSchema = z.object({
  pilar: z.enum(["POSICIONAMENTO", "ABORDAGEM", "MAPEAMENTO", "VENDAS", "FIDELIZACAO"]),
  tipo: z.enum(["PADRAO", "SEMANAL"]),
  titulo: z.string().trim().min(2),
  descricao: z.string().trim().optional(),
  videoId: z.string().optional(),
  publicadoEm: z.string().min(1),
});

export async function salvarConteudo(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = conteudoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    pilar: parsed.data.pilar,
    tipo: parsed.data.tipo,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    videoId: parsed.data.videoId || null,
    // O input type="date" manda "AAAA-MM-DD" — vira meia-noite local, hora
    // suficiente pra decidir "esse conteudo ja deveria estar visivel hoje?".
    publicadoEm: dataHoraLocal(parsed.data.publicadoEm, "00:00"),
  };

  if (id === "novo") {
    await prisma.conteudoConsultoria.create({ data: dados });
  } else {
    await prisma.conteudoConsultoria.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/conteudo-mentoria");
  redirect("/painel/admin/conteudo-mentoria");
}

export async function alternarAtivoConteudo(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.conteudoConsultoria.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/conteudo-mentoria");
}
