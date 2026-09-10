import { prisma } from "@/lib/prisma";

// Por que a assinatura NAO libera o conteudo. Ate 10/09/2026 as telas so
// perguntavam "tem assinatura ATIVA?" e, no `else`, diziam a mesma coisa pra
// todo mundo: "Você ainda não tem acesso. Assine um plano." Quem tinha
// assinado e cujo plano venceu lia isso como se nunca tivesse sido cliente —
// sem saber que venceu, quando venceu, nem que bastava renovar.
//
// Os tres casos pedem textos e botoes diferentes, entao viram um tipo so,
// calculado num lugar so.
export type SituacaoAcesso =
  | { liberado: true; planoId: string; planoNome: string }
  | { liberado: false; motivo: "SEM_ASSINATURA" }
  | { liberado: false; motivo: "PAGAMENTO_PENDENTE"; planoNome: string }
  | { liberado: false; motivo: "VENCIDO"; planoNome: string; venceuEm: Date };

// Atalho pras telas que JA consultaram a assinatura ATIVA e cairam no `else`:
// elas so precisam do motivo, e o tipo sai estreitado pro <SemAcesso>. O
// fallback nunca deveria acontecer (a tela so chega aqui sem assinatura
// ATIVA), e "SEM_ASSINATURA" e a mensagem mais conservadora das tres.
export async function motivoDoBloqueio(
  usuarioId: string,
): Promise<Extract<SituacaoAcesso, { liberado: false }>> {
  const situacao = await situacaoDeAcesso(usuarioId);
  return situacao.liberado ? { liberado: false, motivo: "SEM_ASSINATURA" } : situacao;
}

export async function situacaoDeAcesso(usuarioId: string): Promise<SituacaoAcesso> {
  // Pega a assinatura vigente qualquer que seja o status — e justamente o
  // status que diz qual mensagem mostrar. Filtrar por ATIVA aqui devolveria
  // "nao tem nada" pra quem tem uma assinatura atrasada, que e o bug.
  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId, status: { in: ["ATIVA", "PENDENTE", "ATRASADA"] } },
    include: { plano: { select: { id: true, nome: true } } },
    orderBy: { criadoEm: "desc" },
  });

  if (!assinatura) return { liberado: false, motivo: "SEM_ASSINATURA" };

  if (assinatura.status === "ATIVA") {
    return { liberado: true, planoId: assinatura.plano.id, planoNome: assinatura.plano.nome };
  }

  if (assinatura.status === "PENDENTE") {
    return { liberado: false, motivo: "PAGAMENTO_PENDENTE", planoNome: assinatura.plano.nome };
  }

  return {
    liberado: false,
    motivo: "VENCIDO",
    planoNome: assinatura.plano.nome,
    venceuEm: assinatura.dataProximaRenovacao,
  };
}
