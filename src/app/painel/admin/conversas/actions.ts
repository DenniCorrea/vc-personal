"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const enviarSchema = z.object({ texto: z.string().trim().min(1).max(2000) });

export async function enviarMensagemAdmin(usuarioId: string, formData: FormData) {
  const session = await exigirPapel("ADMIN");
  const parsed = enviarSchema.parse(Object.fromEntries(formData));

  await prisma.mensagem.create({
    data: { usuarioId, autorId: session.user.id, texto: parsed.texto },
  });

  await prisma.mensagem.updateMany({
    where: { usuarioId, autorId: usuarioId, lida: false },
    data: { lida: true },
  });

  revalidatePath(`/painel/admin/conversas/${usuarioId}`);
  revalidatePath("/painel/admin");
}
