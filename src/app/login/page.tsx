"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { entrar, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = {};

export default function PaginaLogin() {
  const [estado, formAction, pendente] = useActionState(entrar, estadoInicial);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/painel";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Victor Carvalho Personal
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Entrar</h1>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

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

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Senha
          <input
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        {estado.erro && <p className="text-sm text-warn">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-accent">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
