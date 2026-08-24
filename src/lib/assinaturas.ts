import { PreApproval } from "mercadopago";
import { mercadoPagoConfig } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import type { AssinaturaModel } from "@/generated/prisma/models";

// Centraliza o "desligar uma assinatura" — usado tanto quando a pessoa
// cancela quanto quando troca de plano (troca = cancela a atual + cria uma
// nova). Se for cartao com cobranca recorrente (PreApproval), cancela ela
// no Mercado Pago tambem — sem isso, a pessoa continuaria sendo cobrada
// todo mes mesmo com o acesso já cortado no nosso lado.
export async function cancelarAssinatura(assinatura: AssinaturaModel): Promise<void> {
  if (assinatura.mercadoPagoPreapprovalId) {
    try {
      const preApproval = new PreApproval(mercadoPagoConfig);
      await preApproval.update({
        id: assinatura.mercadoPagoPreapprovalId,
        body: { status: "cancelled" },
      });
    } catch (erro) {
      // Nao trava o cancelamento local por causa disso — mas registra, porque
      // significa que a cobranca recorrente pode continuar rodando do lado
      // do Mercado Pago e alguem (o admin) precisa resolver manualmente.
      console.error(
        `Falha ao cancelar PreApproval ${assinatura.mercadoPagoPreapprovalId} no Mercado Pago:`,
        erro,
      );
    }
  }

  await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: { status: "CANCELADA", renovacaoAutomatica: false },
  });
}
