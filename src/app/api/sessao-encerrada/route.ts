import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";

// Encerra a sessao de quem tem cookie valido mas conta desativada.
//
// Por que uma rota separada em vez de chamar `signOut()` direto no
// `exigirSessao()`: apagar o cookie e MODIFICAR a resposta, e o Next.js so
// permite isso em Server Action ou Route Handler — nunca em Server
// Component (que e de onde `exigirSessao` roda na maioria das paginas).
// Tentar assim devolve HTTP 500. Um Route Handler pode, entao o guard
// redireciona pra ca e quem limpa o cookie e essa rota.
export async function GET(request: NextRequest) {
  // `redirect: false` faz o Auth.js so limpar o cookie e devolver, em vez de
  // tentar redirecionar sozinho — o redirect quem faz e a linha de baixo,
  // pra garantir que a resposta que apaga o cookie e a MESMA que redireciona.
  await signOut({ redirect: false });

  return NextResponse.redirect(new URL("/login?motivo=conta-inativa", request.nextUrl.origin));
}
