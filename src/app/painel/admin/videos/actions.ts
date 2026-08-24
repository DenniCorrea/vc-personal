"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const videoSchema = z.object({
  produto: z.enum(["ALUNO", "MENTORIA"]),
  titulo: z.string().trim().min(2),
  descricao: z.string().trim().optional(),
  vimeoId: z.string().trim().min(1),
  vimeoHash: z.string().trim().optional(),
});

export async function salvarVideo(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = videoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    produto: parsed.data.produto,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    vimeoId: parsed.data.vimeoId,
    vimeoHash: parsed.data.vimeoHash || null,
  };

  if (id === "novo") {
    await prisma.video.create({ data: dados });
  } else {
    await prisma.video.update({ where: { id }, data: dados });
  }
  revalidatePath("/painel/admin/videos");
  redirect("/painel/admin/videos");
}

export async function alternarAtivoVideo(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.video.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/videos");
}
