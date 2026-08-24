import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
        Victor Carvalho Personal
      </p>
      <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
        Treino e consultoria, no seu ritmo.
      </h1>
      <p className="max-w-sm text-ink-soft">
        Área do aluno e do personal-parceiro do Victor Carvalho.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-lg border border-line px-5 py-2.5 font-medium text-ink hover:border-accent"
        >
          Cadastre-se
        </Link>
      </div>
    </main>
  );
}
