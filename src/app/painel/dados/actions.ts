"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import { hashSenha, verificarSenha } from "@/lib/senha";
import { enviarImagem } from "@/lib/cloudinary";
import { signOut } from "@/auth";

export async function enviarAvatar(formData: FormData) {
  const session = await exigirSessao();

  const arquivo = formData.get("avatar");
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new Error("Selecione uma imagem.");

  const url = await enviarImagem(arquivo, "avatares");
  await prisma.usuario.update({ where: { id: session.user.id }, data: { avatarUrl: url } });

  revalidatePath("/painel/dados");
  revalidatePath("/painel");
}

const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1),
    novaSenha: z.string().min(8, "A nova senha precisa de pelo menos 8 caracteres"),
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarNovaSenha"],
  });

export type EstadoTrocarSenha = {
  erro?: string;
  sucesso?: boolean;
};

export async function trocarSenha(
  _estadoAnterior: EstadoTrocarSenha,
  formData: FormData,
): Promise<EstadoTrocarSenha> {
  const session = await exigirSessao();
  const parsed = trocarSenhaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: session.user.id } });
  const senhaCorreta = await verificarSenha(parsed.data.senhaAtual, usuario.senhaHash);
  if (!senhaCorreta) {
    return { erro: "Senha atual incorreta" };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: await hashSenha(parsed.data.novaSenha) },
  });

  return { sucesso: true };
}

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
