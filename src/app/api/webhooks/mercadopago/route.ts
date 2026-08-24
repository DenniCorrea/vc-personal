import { NextRequest, NextResponse } from "next/server";
import { Payment, WebhookSignatureValidator } from "mercadopago";
import { mercadoPagoConfig } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

// O Mercado Pago chama essa rota sempre que um pagamento muda de status.
// Regra de ouro (explicada no chat, vale repetir aqui): NUNCA confiamos no
// corpo/query dessa notificacao pra liberar algo — so usamos ela como um
// "psiu, vai lá conferir". Duas camadas de verificação antes de mudar
// qualquer coisa no banco:
//   1. A assinatura HMAC do header `x-signature` prova que quem chamou essa
//      URL foi realmente o Mercado Pago (não alguém forjando a requisição).
//   2. Mesmo com a assinatura válida, buscamos o pagamento de volta na API
//      deles (`Payment.get`) em vez de usar os dados que vieram na notificação
//      — o status "de verdade" é sempre o que a API responde nesse momento.
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const topico = url.searchParams.get("type") ?? url.searchParams.get("topic");

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret: process.env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: 300,
    });
  } catch {
    // Não devolvemos detalhe nenhum — só "não autorizado". Detalhar o motivo
    // pra quem está tentando forjar a assinatura só ajudaria a tentar de novo.
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  if (topico === "payment" && dataId) {
    const paymentClient = new Payment(mercadoPagoConfig);
    const pagamentoMp = await paymentClient.get({ id: dataId });

    // `external_reference` é o Pagamento.id que nós mesmos mandamos quando
    // criamos a Preference/PreApproval — é assim que ligamos a notificação
    // de volta na nossa linha do banco.
    const pagamentoId = pagamentoMp.external_reference;
    if (pagamentoId) {
      await confirmarPagamento(pagamentoId, pagamentoMp.status, pagamentoMp.id ? String(pagamentoMp.id) : null);
    }
  }

  // Mercado Pago espera 200 rápido — qualquer coisa fora isso, ele re-tenta
  // a notificação depois.
  return NextResponse.json({ recebido: true });
}

async function confirmarPagamento(
  pagamentoId: string,
  statusMp: string | undefined,
  mercadoPagoPaymentId: string | null,
) {
  const pagamento = await prisma.pagamento.findUnique({ where: { id: pagamentoId } });
  if (!pagamento) return; // notificação de um pagamento que não é nosso (ou de teste) — ignora

  const status = statusMp === "approved" ? "APROVADO" : statusMp === "rejected" ? "RECUSADO" : "PENDENTE";

  await prisma.pagamento.update({
    where: { id: pagamentoId },
    data: { status, mercadoPagoPaymentId },
  });

  if (status !== "APROVADO") return;

  if (pagamento.assinaturaId) {
    const emUmMes = new Date();
    emUmMes.setMonth(emUmMes.getMonth() + 1);
    await prisma.assinatura.update({
      where: { id: pagamento.assinaturaId },
      data: { status: "ATIVA", dataProximaRenovacao: emUmMes },
    });
  }
  // Pagamento de agendamento avulso não muda o status do Agendamento — ele
  // já existe como AGENDADO desde a Fase 4; o pagamento só confirma que
  // aquela sessão extra foi paga.
}
