"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastrar, type EstadoCadastro } from "./actions";

const estadoInicial: EstadoCadastro = {};

export default function PaginaCadastro() {
  const [estado, formAction, pendente] = useActionState(cadastrar, estadoInicial);

  if (estado.sucesso) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">Conta criada</h1>
        <p className="text-ink-soft">
          Agora e so entrar com o e-mail e a senha que voce cadastrou.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink"
        >
          Ir para o login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        VC Personal
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Criar conta</h1>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <Campo label="Nome" name="nome" type="text" autoComplete="name" required />
        <Campo label="E-mail" name="email" type="email" autoComplete="email" required />
        <Campo
          label="Senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Campo
          label="Confirmar senha"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">Eu sou</legend>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="radio" name="role" value="ALUNO" defaultChecked required />
            Aluno — quero treinar com o Victor
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="radio" name="role" value="PERSONAL_PARCEIRO" />
            Personal trainer — quero a mentoria
          </label>
        </fieldset>

        <label className="flex items-start gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="aceiteLgpd" required className="mt-1" />
          <span>
            Autorizo o uso dos meus dados pessoais para criação e gestão da minha conta,
            conforme a LGPD.
          </span>
        </label>

        {estado.erro && <p className="text-sm text-warn">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
        >
          {pendente ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-accent">
          Entrar
        </Link>
      </p>
    </main>
  );
}

function Campo(props: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  const { label, name, ...inputProps } = props;
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink">
      {label}
      <input
        name={name}
        {...inputProps}
        className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
      />
    </label>
  );
}
