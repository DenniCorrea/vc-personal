"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { cancelarAssinatura } from "@/lib/assinaturas";
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
  // pendente, ativa ou atrasada — pra isso existe cancelarMinhaAssinatura()
  // e trocarPlano() abaixo.
  const jaTemAssinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
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

export async function cancelarMinhaAssinatura() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
  });
  if (!assinatura) throw new Error("Você não tem uma assinatura pra cancelar.");

  await cancelarAssinatura(assinatura);

  revalidatePath("/painel/planos");
  revalidatePath("/painel");
}

export async function trocarPlano(novoPlanoId: string) {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const produtoEsperado = PRODUTO_POR_ROLE[session.user.role as "ALUNO" | "PERSONAL_PARCEIRO"];

  const novoPlano = await prisma.plano.findFirst({
    where: { id: novoPlanoId, produto: produtoEsperado, ativo: true },
  });
  if (!novoPlano) throw new Error("Plano inválido para o seu perfil.");

  const assinaturaAtual = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
  });
  if (!assinaturaAtual) throw new Error("Você não tem uma assinatura ativa pra trocar.");
  if (assinaturaAtual.planoId === novoPlanoId) throw new Error("Você já está nesse plano.");

  // Trocar = cancela a atual (incluindo a cobranca recorrente no Mercado
  // Pago, se tiver) e cria uma nova PENDENTE — a pessoa passa pelo checkout
  // de novo pro plano novo, mesmo fluxo de quem esta assinando pela
  // primeira vez.
  await cancelarAssinatura(assinaturaAtual);
  await prisma.assinatura.create({
    data: {
      usuarioId: session.user.id,
      planoId: novoPlano.id,
      status: "PENDENTE",
      dataProximaRenovacao: daquiUmMes(),
    },
  });

  revalidatePath("/painel/planos");
  revalidatePath("/painel");
}
