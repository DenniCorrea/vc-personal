"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type EstadoLogin = {
  erro?: string;
};

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirectTo: (formData.get("callbackUrl") as string) || "/painel",
    });
    return {};
  } catch (erro) {
    // O proprio `signIn`, quando da certo, dispara um redirect por baixo dos
    // panos (que o Next implementa lancando um erro especial) — por isso so
    // tratamos como "erro de login" quando for de fato um AuthError; qualquer
    // outra coisa (como esse redirect) precisa continuar subindo.
    if (erro instanceof AuthError) {
      return { erro: "E-mail ou senha incorretos" };
    }
    throw erro;
  }
}
