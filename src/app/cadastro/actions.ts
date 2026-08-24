"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";

// `role` aceita so ALUNO ou PERSONAL_PARCEIRO aqui de proposito — ADMIN
// nunca e uma opcao no formulario publico. Mesmo que alguem manipule o
// HTML e mande "ADMIN" no POST, o zod rejeita, porque so esses 2 valores
// estao no enum abaixo.
const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, "Nome muito curto"),
    email: z.string().trim().email("E-mail invalido"),
    senha: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
    confirmarSenha: z.string(),
    role: z.enum(["ALUNO", "PERSONAL_PARCEIRO"]),
    aceiteLgpd: z.literal("on", {
      message: "E preciso aceitar o tratamento de dados pra continuar",
    }),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas nao coincidem",
    path: ["confirmarSenha"],
  });

export type EstadoCadastro = {
  erro?: string;
  sucesso?: boolean;
};

export async function cadastrar(
  _estadoAnterior: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const parsed = cadastroSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }
  const { nome, email, senha, role } = parsed.data;

  const jaExiste = await prisma.usuario.findUnique({ where: { email } });
  if (jaExiste) {
    return { erro: "Ja existe uma conta com esse e-mail" };
  }

  await prisma.usuario.create({
    data: {
      nome,
      email,
      role,
      senhaHash: await hashSenha(senha),
      consentimentoLgpdEm: new Date(),
    },
  });

  return { sucesso: true };
}
