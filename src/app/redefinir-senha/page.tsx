import { Suspense } from "react";
import { RedefinirSenhaForm } from "./RedefinirSenhaForm";

// Mesma razao do /login: RedefinirSenhaForm usa useSearchParams (pra ler o
// token da URL) e isso exige um limite de Suspense, senao o build de
// producao quebra na pre-renderizacao estatica.
export default function PaginaRedefinirSenha() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Victor Carvalho Personal
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Nova senha</h1>
      <Suspense>
        <RedefinirSenhaForm />
      </Suspense>
    </main>
  );
}
