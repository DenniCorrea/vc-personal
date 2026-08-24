"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacaoSenha, type EstadoEsqueciSenha } from "./actions";

const estadoInicial: EstadoEsqueciSenha = {};

export function EsqueciSenhaForm() {
  const [estado, formAction, pendente] = useActionState(solicitarRecuperacaoSenha, estadoInicial);

  if (estado.enviado) {
    return (
      <>
        <p className="mt-2 text-ink-soft">
          Se esse e-mail estiver cadastrado, mandamos um link de recuperação pra ele — confira sua
          caixa de entrada (e o spam, por garantia).
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-accent">
          Voltar pro login
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="mt-2 text-ink-soft">
        Digite o e-mail da sua conta — mandamos um link pra você criar uma senha nova.
      </p>
      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={pendente}
          className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
        >
          {pendente ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-medium text-accent">
          Entrar
        </Link>
      </p>
    </>
  );
}
