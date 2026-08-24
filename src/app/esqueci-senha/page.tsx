import { EsqueciSenhaForm } from "./EsqueciSenhaForm";

export default function PaginaEsqueciSenha() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Victor Carvalho Personal
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Esqueci minha senha</h1>
      <EsqueciSenhaForm />
    </main>
  );
}
