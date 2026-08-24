import { prisma } from "@/lib/prisma";

// So chamado a partir de acoes que ja passaram por exigirPapel("ADMIN") —
// nao repete a checagem aqui, pra nao duplicar a mesma validacao 2x.
export function registrarLogAdmin(
  adminId: string,
  acao: string,
  entidade: string,
  entidadeId?: string,
) {
  return prisma.logAdmin.create({
    data: { adminId, acao, entidade, entidadeId },
  });
}
