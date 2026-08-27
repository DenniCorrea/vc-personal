"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import { estaBloqueado, registrarFalha } from "@/lib/rate-limit";

export type EstadoEsqueciSenha = {
  enviado?: boolean;
};

// Sempre retorna "enviado", exista ou nao o e-mail no banco — nao da pra um
// visitante descobrir quais e-mails estao cadastrados so testando esse
// formulario (enumeracao de usuarios e um risco de seguranca real).
export async function solicitarRecuperacaoSenha(
  _estadoAnterior: EstadoEsqueciSenha,
  formData: FormData,
): Promise<EstadoEsqueciSenha> {
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (!email.success) return { enviado: true };

  // Sem esse limite, dava pra usar o formulario como maquina de spam:
  // enviar o mesmo e-mail de recuperacao centenas de vezes pra caixa de
  // entrada de um aluno (e queimar nossa cota do Resend junto). Continua
  // respondendo "enviado" mesmo bloqueado, pra nao revelar nada.
  if (await estaBloqueado("recuperacaoSenha", email.data)) return { enviado: true };
  await registrarFalha("recuperacaoSenha", email.data);

  const usuario = await prisma.usuario.findUnique({ where: { email: email.data, ativo: true } });
  if (usuario) {
    const tokenBruto = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(tokenBruto).digest("hex");
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 1);

    await prisma.tokenRecuperacaoSenha.create({
      data: { usuarioId: usuario.id, tokenHash, expiraEm },
    });

    await enviarEmailRecuperacaoSenha(usuario.email, usuario.nome, tokenBruto);
  }

  return { enviado: true };
}
