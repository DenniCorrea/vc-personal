"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import type { Produto } from "@/generated/prisma/enums";

function daquiUmMes(): Date {
  const data = new Date();
  data.setMonth(data.getMonth() + 1);
  return data;
}

const PRODUTO_POR_ROLE: Record<"ALUNO" | "PERSONAL_PARCEIRO", Produto> = {
  ALUNO: "ALUNO",
  PERSONAL_PARCEIRO: "MENTORIA",
};

export async function assinarPlano(planoId: string) {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const produtoEsperado = PRODUTO_POR_ROLE[session.user.role as "ALUNO" | "PERSONAL_PARCEIRO"];

  // Confere que o plano escolhido e do produto certo pro papel de quem esta
  // assinando — sem isso, um aluno poderia manipular o formulario e assinar
  // um plano de mentoria (ou vice-versa) so trocando o id no POST.
  const plano = await prisma.plano.findFirst({
    where: { id: planoId, produto: produtoEsperado, ativo: true },
  });
  if (!plano) {
    throw new Error("Plano inválido para o seu perfil.");
  }

  // Regra de negocio: nao deixa assinar de novo se ja tem uma assinatura
  // pendente ou ativa. Cancelar/trocar de plano fica pra uma fase futura.
  const jaTemAssinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA"] } },
  });
  if (jaTemAssinatura) {
    throw new Error("Você já tem uma assinatura pendente ou ativa.");
  }

  await prisma.assinatura.create({
    data: {
      usuarioId: session.user.id,
      planoId: plano.id,
      status: "PENDENTE",
      dataProximaRenovacao: daquiUmMes(),
    },
  });

  revalidatePath("/painel/planos");
  revalidatePath("/painel");
}
