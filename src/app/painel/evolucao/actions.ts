"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarImagem } from "@/lib/cloudinary";

export async function enviarFotoProgresso(formData: FormData) {
  const session = await exigirPapel("ALUNO");

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new Error("Selecione uma foto.");

  const legenda = String(formData.get("legenda") ?? "").trim() || null;
  const url = await enviarImagem(arquivo, "fotos-progresso");

  await prisma.fotoProgresso.create({
    data: { usuarioId: session.user.id, url, legenda },
  });

  revalidatePath("/painel/evolucao");
}
