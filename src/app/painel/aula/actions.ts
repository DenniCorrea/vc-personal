"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { trilhaDoUsuario } from "@/lib/trilha";

// Confere que ESTA aula esta liberada pra ESTE mentorado, usando a mesma
// funcao que monta a trilha. Sem isso, alguem com o id de uma aula de um
// plano superior conseguiria marcar progresso nela — e o progresso e o que
// alimenta os relatorios do Victor.
async function exigirAcessoAAula(usuarioId: string, aulaId: string) {
  const { modulos } = await trilhaDoUsuario(usuarioId);
  const liberada = modulos.some((m) => m.aulas.some((a) => a.id === aulaId));
  if (!liberada) throw new Error("Aula não disponível no seu plano.");
}

export async function marcarConcluida(aulaId: string, concluida: boolean) {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  await exigirAcessoAAula(session.user.id, aulaId);

  await prisma.progresso.upsert({
    where: { usuarioId_aulaId: { usuarioId: session.user.id, aulaId } },
    update: { concluida },
    create: { usuarioId: session.user.id, aulaId, concluida },
  });

  revalidatePath(`/painel/aula/${aulaId}`);
  revalidatePath("/painel/modulos");
  revalidatePath("/painel");
}

const duvidaSchema = z.object({
  texto: z.string().trim().min(1, "Escreva sua dúvida").max(2000),
  // Minuto do video em que a pessoa estava — o que permite o card
  // "Aula 4 · 15:32" na conversa e o "abrir no ponto" depois.
  timestampSegundos: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).optional(),
  ),
});

export async function enviarDuvidaDaAula(aulaId: string, formData: FormData) {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  await exigirAcessoAAula(session.user.id, aulaId);

  const parsed = duvidaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  await prisma.mensagem.create({
    data: {
      usuarioId: session.user.id,
      autorId: session.user.id,
      texto: parsed.data.texto,
      aulaId,
      timestampSegundos: parsed.data.timestampSegundos ?? null,
    },
  });

  revalidatePath("/painel/mensagens");
  redirect("/painel/mensagens");
}
