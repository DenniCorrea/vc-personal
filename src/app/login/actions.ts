"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { estaBloqueado, LIMITES } from "@/lib/rate-limit";

export type EstadoLogin = {
  erro?: string;
};

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  // A trava de verdade esta no `authorize` (src/auth.ts) — la ela devolve
  // null, que viraria a mensagem generica "e-mail ou senha incorretos" e
  // deixaria a pessoa tentando pra sempre sem entender o que houve. Essa
  // checagem aqui existe so pra dar a mensagem certa a quem foi bloqueado.
  const email = String(formData.get("email") ?? "");
  if (email && (await estaBloqueado("login", email))) {
    return {
      erro: `Muitas tentativas de login. Aguarde ${LIMITES.login.janelaMinutos} minutos e tente de novo, ou use "Esqueci minha senha".`,
    };
  }

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
