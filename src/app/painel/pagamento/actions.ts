"use server";

import { redirect } from "next/navigation";
import { Preference, PreApproval } from "mercadopago";
import { mercadoPagoConfig, urlBase, aplicarDescontoPix } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import type { MetodoPagamento } from "@/generated/prisma/enums";

// IDs de `payment_type` que o Mercado Pago usa pra classificar cada forma de
// pagamento no Brasil. Confirmar contra o sandbox de verdade assim que
// tivermos credenciais — isso e o tipo de detalhe que so se confirma testando
// com a conta real, a documentacao as vezes diverge por pais.
const TIPOS_NAO_PIX = [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }];
const TIPO_PIX = [{ id: "bank_transfer" }];

function excluirTiposPara(metodo: MetodoPagamento) {
  return metodo === "PIX" ? TIPOS_NAO_PIX : TIPO_PIX.concat([{ id: "ticket" }, { id: "atm" }]);
}

// Pagamento avulso (nao-recorrente) via Preference/Checkout Pro — usado pra
// Pix, debito, e tambem pra cartao quando NAO e uma assinatura (ex: sessao
// avulsa). Cria o registro local, cria a Preference no Mercado Pago, e
// redireciona pro checkout deles.
async function pagarComPreference(params: {
  usuarioId: string;
  email: string;
  titulo: string;
  metodo: MetodoPagamento;
  valorOriginal: number;
  assinaturaId?: string;
  agendamentoId?: string;
}) {
  const { desconto, valorFinal } =
    params.metodo === "PIX" ? aplicarDescontoPix(params.valorOriginal) : { desconto: 0, valorFinal: params.valorOriginal };

  const pagamento = await prisma.pagamento.create({
    data: {
      usuarioId: params.usuarioId,
      assinaturaId: params.assinaturaId,
      agendamentoId: params.agendamentoId,
      valorOriginal: params.valorOriginal,
      desconto,
      valorFinal,
      metodo: params.metodo,
    },
  });

  let initPoint: string;
  try {
    const preference = new Preference(mercadoPagoConfig);
    const resposta = await preference.create({
      body: {
        items: [
          {
            id: pagamento.id,
            title: params.titulo,
            quantity: 1,
            unit_price: valorFinal,
            currency_id: "BRL",
          },
        ],
        external_reference: pagamento.id,
        payer: { email: params.email },
        back_urls: {
          success: `${urlBase()}/painel`,
          pending: `${urlBase()}/painel`,
          failure: `${urlBase()}/painel`,
        },
        notification_url: `${urlBase()}/api/webhooks/mercadopago`,
        payment_methods: { excluded_payment_types: excluirTiposPara(params.metodo) },
      },
    });
    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: { mercadoPagoPreferenceId: resposta.id },
    });
    initPoint = resposta.init_point!;
  } catch (erro) {
    // A chamada pro Mercado Pago falhou (ex: credenciais nao configuradas
    // ainda) — nao faz sentido deixar esse Pagamento pendurado sem
    // preference nenhuma, entao apaga e avisa com uma mensagem legivel.
    await prisma.pagamento.delete({ where: { id: pagamento.id } });
    console.error("Falha ao criar Preference no Mercado Pago:", erro);
    throw new Error(
      "Não foi possível iniciar o pagamento agora. Se você é o admin: confira se MP_ACCESS_TOKEN está configurado.",
    );
  }

  redirect(initPoint);
}

export async function iniciarPagamentoAssinatura(assinaturaId: string, metodo: MetodoPagamento) {
  const session = await exigirSessao();

  const assinatura = await prisma.assinatura.findFirst({
    where: { id: assinaturaId, usuarioId: session.user.id },
    include: { plano: true, usuario: true },
  });
  if (!assinatura) throw new Error("Assinatura não encontrada.");
  if (assinatura.status !== "PENDENTE" && assinatura.status !== "ATRASADA") {
    throw new Error("Essa assinatura não está aguardando pagamento.");
  }

  const valorOriginal = Number(assinatura.plano.preco);

  // Só CARTAO vira cobrança recorrente automática (PreApproval) — o
  // Mercado Pago não tem recorrência confiável pra Pix/débito, então esses
  // dois seguem o fluxo avulso ciclo a ciclo (decisão confirmada com o
  // Dennis/Victor na Fase 5).
  if (metodo !== "CARTAO") {
    await pagarComPreference({
      usuarioId: session.user.id,
      email: assinatura.usuario.email,
      titulo: `Assinatura — ${assinatura.plano.nome}`,
      metodo,
      valorOriginal,
      assinaturaId: assinatura.id,
    });
    return;
  }

  const pagamento = await prisma.pagamento.create({
    data: {
      usuarioId: session.user.id,
      assinaturaId: assinatura.id,
      valorOriginal,
      desconto: 0,
      valorFinal: valorOriginal,
      metodo: "CARTAO",
    },
  });

  let initPoint: string;
  try {
    const preApproval = new PreApproval(mercadoPagoConfig);
    const resposta = await preApproval.create({
      body: {
        reason: `Assinatura — ${assinatura.plano.nome}`,
        external_reference: pagamento.id,
        payer_email: assinatura.usuario.email,
        back_url: `${urlBase()}/painel`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: valorOriginal,
          currency_id: "BRL",
        },
      },
    });
    await prisma.$transaction([
      prisma.pagamento.update({
        where: { id: pagamento.id },
        data: { mercadoPagoPreferenceId: resposta.id },
      }),
      prisma.assinatura.update({
        where: { id: assinatura.id },
        data: { mercadoPagoPreapprovalId: resposta.id },
      }),
    ]);
    initPoint = resposta.init_point!;
  } catch (erro) {
    await prisma.pagamento.delete({ where: { id: pagamento.id } });
    console.error("Falha ao criar PreApproval no Mercado Pago:", erro);
    throw new Error(
      "Não foi possível iniciar a assinatura recorrente agora. Se você é o admin: confira se MP_ACCESS_TOKEN está configurado.",
    );
  }

  redirect(initPoint);
}

export async function iniciarPagamentoAgendamento(agendamentoId: string, metodo: MetodoPagamento) {
  const session = await exigirSessao();

  const agendamento = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, usuarioId: session.user.id },
    include: { horario: true, usuario: true, assinatura: { include: { plano: true } } },
  });
  if (!agendamento) throw new Error("Agendamento não encontrado.");
  if (!agendamento.avulso) throw new Error("Esse agendamento já está dentro do plano, não precisa pagar.");

  const precoAvulso = agendamento.assinatura.plano.precoAvulso;
  if (precoAvulso === null) {
    throw new Error("O admin ainda não configurou o preço da sessão avulsa para esse plano.");
  }

  // Sessão avulsa nunca é recorrente, mesmo pagando de cartão — é um
  // pagamento único desse horário específico.
  await pagarComPreference({
    usuarioId: session.user.id,
    email: agendamento.usuario.email,
    titulo: `Sessão avulsa — ${agendamento.assinatura.plano.nome}`,
    metodo,
    valorOriginal: Number(precoAvulso),
    agendamentoId: agendamento.id,
  });
}
