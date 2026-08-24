"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarImagem } from "@/lib/cloudinary";

const exercicioSchema = z.object({
  nome: z.string().trim().min(2),
  descricao: z.string().trim().optional(),
  instrucoes: z.string().trim().optional(),
  cuidados: z.string().trim().optional(),
  videoId: z.string().optional(),
  grupoMuscularPrincipal: z.string().trim().optional(),
  gruposMuscularesSecundarios: z.string().trim().optional(),
});

export async function salvarExercicio(id: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = exercicioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  // Imagem anatomica: sempre a mesma imagem PADRAO (a que ja aparece nos
  // aparelhos/na internet pra aquele grupo muscular) — o admin faz upload
  // uma vez por exercicio, nao e arte custom.
  const arquivoImagem = formData.get("imagemAnatomica");
  const novaImagemUrl =
    arquivoImagem instanceof File && arquivoImagem.size > 0
      ? await enviarImagem(arquivoImagem, "anatomia")
      : null;

  const dados = {
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    instrucoes: parsed.data.instrucoes || null,
    cuidados: parsed.data.cuidados || null,
    videoId: parsed.data.videoId || null,
    grupoMuscularPrincipal: parsed.data.grupoMuscularPrincipal || null,
    gruposMuscularesSecundarios: parsed.data.gruposMuscularesSecundarios
      ? parsed.data.gruposMuscularesSecundarios.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    ...(novaImagemUrl ? { imagemAnatomica: novaImagemUrl } : {}),
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
