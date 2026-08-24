import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

// `useSearchParams` (usado dentro de LoginForm, pra ler o callbackUrl) exige
// um limite de Suspense em volta — sem isso o Next.js falha ao tentar
// pre-renderizar essa pagina em build de producao (funciona normal em `next
// dev`, so quebra no `next build`, que e exatamente onde isso apareceu).
export default function PaginaLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
