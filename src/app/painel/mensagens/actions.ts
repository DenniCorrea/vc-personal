"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const enviarSchema = z.object({ texto: z.string().trim().min(1).max(2000) });

// O aluno so escreve na PROPRIA thread (usuarioId = ele mesmo). O admin usa
// uma action separada (painel/admin/mensagens) que recebe o usuarioId do
// aluno como parametro, porque ele escreve em varias threads.
export async function enviarMensagemAluno(formData: FormData) {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const parsed = enviarSchema.parse(Object.fromEntries(formData));

  await prisma.mensagem.create({
    data: { usuarioId: session.user.id, autorId: session.user.id, texto: parsed.texto },
  });

  revalidatePath("/painel/mensagens");
}

export async function marcarMensagensComoLidas() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  await prisma.mensagem.updateMany({
    where: { usuarioId: session.user.id, autorId: { not: session.user.id }, lida: false },
    data: { lida: true },
  });
}
