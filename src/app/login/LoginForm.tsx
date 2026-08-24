"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { entrar, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = {};

export function LoginForm() {
  const [estado, formAction, pendente] = useActionState(entrar, estadoInicial);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/painel";

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <label className="flex flex-col gap-2 text-[15px] text-ink">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-0 border-b border-line bg-transparent px-0 py-2.5 text-ink outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2 text-[15px] text-ink">
        Senha
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="border-0 border-b border-line bg-transparent px-0 py-2.5 text-ink outline-none focus:border-accent"
        />
      </label>

      {estado.erro && <p className="text-xs text-warn">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="mt-3 rounded-[2px] bg-accent px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {pendente ? "Entrando..." : "Entrar"}
      </button>

      <div className="mt-2 flex items-center justify-between text-[13px] text-ink-soft">
        <Link href="/esqueci-senha" className="hover:text-ink">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="hover:text-ink">
          Primeiro acesso? Cadastre-se
        </Link>
      </div>
    </form>
  );
}
