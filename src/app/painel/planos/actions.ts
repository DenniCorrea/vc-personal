"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

function daquiUmMes(): Date {
  const data = new Date();
  data.setMonth(data.getMonth() + 1);
  return data;
}

export async function assinarPlanoAluno(planoId: string) {
  const session = await exigirPapel("ALUNO");
  await criarAssinaturaSePossivel(session.user.id, { planoAlunoId: planoId });
  revalidatePath("/painel/planos");
  revalidatePath("/painel");
}

export async function assinarPlanoConsultoria(planoId: string) {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  await criarAssinaturaSePossivel(session.user.id, { planoConsultoriaId: planoId });
  revalidatePath("/painel/planos");
  revalidatePath("/painel");
}

async function criarAssinaturaSePossivel(
  usuarioId: string,
  planoRef: { planoAlunoId: string } | { planoConsultoriaId: string },
) {
  // Regra de negocio: nao deixa assinar de novo se ja tem uma assinatura
  // pendente ou ativa. Cancelar/trocar de plano fica pra uma fase futura.
  const jaTemAssinatura = await prisma.assinatura.findFirst({
    where: { usuarioId, status: { in: ["PENDENTE", "ATIVA"] } },
  });
  if (jaTemAssinatura) {
    throw new Error("Você já tem uma assinatura pendente ou ativa.");
  }

  await prisma.assinatura.create({
    data: {
      usuarioId,
      ...planoRef,
      status: "PENDENTE",
      dataProximaRenovacao: daquiUmMes(),
    },
  });
}
