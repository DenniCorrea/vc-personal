import { sair } from "./actions";

// Tela que o ALUNO ve enquanto ALUNO_PAUSADO estiver ligado
// (src/lib/feature-flags.ts). Nao e uma pagina de erro: a conta continua
// existindo, o login continua funcionando, so a area de treino esta fora
// do ar por decisao de produto — a mensagem precisa deixar isso claro.
export function AlunoPausado({ nome }: { nome: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Victor Carvalho Personal
      </p>
      <h1 className="font-display mt-1 text-2xl font-semibold text-ink">
        Olá, {nome.split(" ")[0]}
      </h1>
      <p className="text-ink-soft">
        A área de treino está temporariamente fora do ar enquanto fazemos uma
        atualização. Volte em breve — sua conta e seus dados continuam
        guardados normalmente.
      </p>
      <form action={sair} className="mt-2">
        <button
          type="submit"
          className="rounded-lg border border-line px-5 py-2.5 font-medium text-ink hover:border-accent-border"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
