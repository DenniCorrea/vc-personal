"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { cancelarAssinatura } from "@/lib/assinaturas";
import type { Produto } from "@/generated/prisma/enums";

// Erro lancado em Server Action nao chega legivel em producao: o Next mascara
// com "This page couldn't load. A server error occurred." e um digest. Foi
// exatamente o que aconteceu em 10/09/2026 ao clicar duas vezes no mesmo
// plano. Por isso estas acoes DEVOLVEM estado em vez de lancar.
export type EstadoPlano = { erro?: string };

function daquiUmMes(): Date {
  const data = new Date();
  data.setMonth(data.getMonth() + 1);
  return data;
}

const PRODUTO_POR_ROLE: Record<"ALUNO" | "PERSONAL_PARCEIRO", Produto> = {
  ALUNO: "ALUNO",
  PERSONAL_PARCEIRO: "MENTORIA",
};

const STATUS_VIGENTES = ["PENDENTE", "ATIVA", "ATRASADA"] as const;

// A assinatura de `useActionState` e (estadoAnterior, formData). Com o
// `.bind(null, planoId)` da tela, ela chega aqui como o 2o e 3o argumentos —
// nao sao usados, mas precisam existir pro tipo bater.
export async function assinarPlano(
  planoId: string,
  _estadoAnterior: EstadoPlano,
  _formData: FormData,
): Promise<EstadoPlano> {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const produtoEsperado = PRODUTO_POR_ROLE[session.user.role as "ALUNO" | "PERSONAL_PARCEIRO"];

  // Confere que o plano escolhido e do produto certo pro papel de quem esta
  // assinando — sem isso, um aluno poderia manipular o formulario e assinar
  // um plano de mentoria (ou vice-versa) so trocando o id no POST.
  const plano = await prisma.plano.findFirst({
    where: { id: planoId, produto: produtoEsperado, ativo: true },
  });
  if (!plano) return { erro: "Esse plano não está disponível para o seu perfil." };

  // Ja tem assinatura vigente: quem resolve isso e trocarPlano(), nao um
  // segundo create — duas assinaturas vigentes deixariam o app sem saber
  // qual vale.
  const jaTemAssinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: [...STATUS_VIGENTES] } },
  });
  if (jaTemAssinatura) {
    return { erro: "Você já tem uma assinatura. Use “Trocar de plano” para mudar." };
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
  redirect("/painel/planos");
}

export async function cancelarMinhaAssinatura(): Promise<void> {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: [...STATUS_VIGENTES] } },
  });
  // Sem assinatura vigente nao ha o que cancelar — clique repetido, nao erro.
  if (!assinatura) redirect("/painel/planos");

  await cancelarAssinatura(assinatura);

  revalidatePath("/painel/planos");
  revalidatePath("/painel");
  redirect("/painel/planos");
}

// Trocar de plano MUDA O PLANO DA ASSINATURA QUE JA EXISTE — nao cancela nada
// e nao cria linha nova.
//
// Antes fazia o contrario: cancelava a atual e criava uma PENDENTE. Como
// Modulos, Bonus, Comunidade e Agenda exigem assinatura ATIVA, o efeito era
// que trocar de plano DERRUBAVA o acesso que a pessoa ja tinha pago, na hora,
// sem aviso (relatado pelo Denni em 10/09/2026). Cancelar acesso pago porque
// alguem quis mudar de plano e errado em qualquer cenario de cobranca — por
// isso a correcao e preservar a assinatura, nao ajustar o gate.
//
// O `status` e preservado de proposito, porque status significa "situacao de
// pagamento" e o plano nao muda isso:
//   ATIVA     -> segue ATIVA, ja com os beneficios do plano novo
//   PENDENTE  -> segue PENDENTE, agora apontando pro plano novo
//   ATRASADA  -> segue ATRASADA
//
// Sessoes ja usadas no ciclo continuam contando (mesma assinaturaId): quem
// usou 1 de 1 e sobe pro plano de 5 fica com 4 disponiveis, nao 5.
//
// >>> COSTURA COM O MERCADO PAGO (unica parte que falta) <<<
// Quando a cobranca entrar, o upgrade de uma assinatura ATIVA precisa cobrar
// a diferenca proporcional (e o downgrade, creditar) e atualizar o
// PreApproval recorrente. Hoje, sem cobranca ligada, a troca vale na hora.
// O ponto de enganche e aqui embaixo, logo depois do update.
export async function trocarPlano(
  novoPlanoId: string,
  _estadoAnterior: EstadoPlano,
  _formData: FormData,
): Promise<EstadoPlano> {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const produtoEsperado = PRODUTO_POR_ROLE[session.user.role as "ALUNO" | "PERSONAL_PARCEIRO"];

  const novoPlano = await prisma.plano.findFirst({
    where: { id: novoPlanoId, produto: produtoEsperado, ativo: true },
  });
  if (!novoPlano) return { erro: "Esse plano não está disponível para o seu perfil." };

  const assinaturaAtual = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: { in: [...STATUS_VIGENTES] } },
    orderBy: { criadoEm: "desc" },
  });
  if (!assinaturaAtual) return { erro: "Você não tem uma assinatura para trocar." };

  // Clicar de novo no plano que ja e o seu nao e erro — e um clique repetido,
  // normalmente porque a tela nao deixou claro que a primeira troca funcionou.
  // Trata como no-op e volta pro painel de plano.
  if (assinaturaAtual.planoId === novoPlanoId) {
    redirect("/painel/planos");
  }

  // `updateMany` com usuarioId no where: se a assinatura nao for dessa pessoa,
  // a operacao simplesmente nao afeta linha nenhuma, em vez de alterar a de
  // outra pessoa com um id adivinhado.
  await prisma.assinatura.updateMany({
    where: { id: assinaturaAtual.id, usuarioId: session.user.id },
    data: { planoId: novoPlano.id },
  });

  // (Mercado Pago entra aqui — ver bloco acima.)

  revalidatePath("/painel/planos");
  revalidatePath("/painel");
  revalidatePath("/painel/agenda");
  redirect(`/painel/planos?trocado=${encodeURIComponent(novoPlano.nome)}`);
}
