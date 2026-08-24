"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";

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
  const registro = await prisma.tokenRecuperacaoSenha.findUnique({ where: { tokenHash } });

  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
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
