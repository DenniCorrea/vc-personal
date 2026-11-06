"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";
import { estaBloqueado, registrarFalha } from "@/lib/rate-limit";

const redefinirSchema = z
  .object({
    token: z.string().min(1),
    novaSenha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres"),
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarNovaSenha"],
  });

export type EstadoRedefinirSenha = {
  erro?: string;
};

export async function redefinirSenha(
  _estadoAnterior: EstadoRedefinirSenha,
  formData: FormData,
): Promise<EstadoRedefinirSenha> {
  const parsed = redefinirSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");

  // O token tem 256 bits de entropia e e guardado so como hash, com prazo e
  // uso unico — adivinhar e inviavel, e o limite abaixo nao esta aqui por
  // causa disso. Esta porque esta era a unica acao publica do app sem
  // limite nenhum, e endpoint publico sem teto e convite pra marteladas:
  // cada chamada custa uma consulta ao banco, e a conta e nossa.
  //
  // A chave e o proprio hash do token, nao o e-mail: aqui nao se sabe de
  // quem e a conta antes de resolver o token, e quem martela manda token
  // invalido. Assim, quem esta tentando adivinhar queima a propria cota sem
  // conseguir trancar a recuperacao de senha de ninguem.
  if (await estaBloqueado("recuperacaoSenha", tokenHash)) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e peça um novo link." };
  }

  const registro = await prisma.tokenRecuperacaoSenha.findUnique({ where: { tokenHash } });

  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
    await registrarFalha("recuperacaoSenha", tokenHash);
    return { erro: "Esse link de recuperação é inválido ou já expirou. Peça um novo." };
  }

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuarioId },
      data: { senhaHash: await hashSenha(parsed.data.novaSenha) },
    }),
    prisma.tokenRecuperacaoSenha.update({
      where: { id: registro.id },
      data: { usadoEm: new Date() },
    }),
  ]);

  redirect("/login");
}
