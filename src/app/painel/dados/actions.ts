"use server";

import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import { signOut } from "@/auth";

// "Exclusao" aqui NAO e um DELETE de verdade — e o mesmo soft-delete
// (`ativo = false`) que ja usamos no resto do app, mais um alerta pro admin.
// Apagar de verdade tem que passar por uma pessoa (o Victor), porque a
// LGPD tambem permite reter dado quando ha obrigacao legal (nota fiscal,
// contabilidade) — nao da pra deletar tudo automaticamente so por um clique.
export async function solicitarExclusaoConta() {
  const session = await exigirSessao();

  await prisma.usuario.update({
    where: { id: session.user.id },
    data: { ativo: false },
  });

  const admins = await prisma.usuario.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await prisma.alerta.create({
      data: {
        usuarioId: admin.id,
        tipo: "SOLICITACAO_EXCLUSAO",
        mensagem: `${session.user.name} pediu a exclusão da conta (LGPD) — revisar e apagar os dados quando não houver mais obrigação de retê-los.`,
        chaveDedup: `exclusao:${session.user.id}`,
      },
    });
  }

  // Desativar no banco nao derruba a sessao JWT já emitida — sem isso a
  // pessoa continuaria "logada" (embora sem conseguir logar de novo) ate o
  // cookie expirar sozinho.
  await signOut({ redirectTo: "/" });
}
