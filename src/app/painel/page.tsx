import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sair } from "./actions";

const ROTULO_ROLE: Record<string, string> = {
  ALUNO: "Aluno",
  PERSONAL_PARCEIRO: "Personal Parceiro",
  ADMIN: "Administrador",
};

export default async function PaginaPainel() {
  // O proxy.ts (src/proxy.ts) ja bloqueia quem nao esta logado antes de
  // chegar aqui, mas essa checagem repete de proposito: e ela — nao o
  // proxy — que garante a segurança de verdade. Ver o comentario em
  // src/proxy.ts.
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        {ROTULO_ROLE[session.user.role] ?? session.user.role}
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        Bem-vindo, {session.user.name}
      </h1>
      <p className="mt-2 text-ink-soft">
        Esta é a base do painel — cada fase seguinte (agendamento, treino, hábitos...)
        vai adicionar o conteúdo real aqui, específico pro seu perfil.
      </p>

      <form action={sair} className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-line px-5 py-2.5 font-medium text-ink hover:border-accent"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
