"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { enviarImagemPrivada } from "@/lib/cloudinary";

export async function enviarFotoProgresso(formData: FormData) {
  const session = await exigirPapel("ALUNO");

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new Error("Selecione uma foto.");

  const legenda = String(formData.get("legenda") ?? "").trim() || null;

  // Privada, nao publica: foto de corpo e o dado mais sensivel do app.
  // Guardamos o identificador no Cloudinary, nunca uma URL aberta — ver
  // src/app/api/fotos-progresso/[id]/route.ts.
  const { publicId, formato } = await enviarImagemPrivada(arquivo, "fotos-progresso");

  await prisma.fotoProgresso.create({
    data: { usuarioId: session.user.id, publicId, formato, legenda },
  });

  revalidatePath("/painel/evolucao");
}
