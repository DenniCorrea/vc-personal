import { NextResponse } from "next/server";
import { auth } from "@/auth";

// No Next.js 16 o antigo "middleware.ts" virou "proxy.ts" (mesmo
// funcionamento, so o nome mudou). Isso roda ANTES da pagina renderizar,
// e serve pra redirecionar quem nao esta logado antes de gastar tempo
// carregando a pagina protegida.
//
// Isso e so a primeira camada, por UX (evita o flash da pagina protegida).
// A checagem que realmente importa pra seguranca fica dentro de cada
// Server Component/Server Action protegida (ex: src/app/painel/page.tsx),
// porque um matcher mal configurado aqui nao pode virar brecha de acesso.
export default auth((req) => {
  const logado = !!req.auth;
  const protegida = req.nextUrl.pathname.startsWith("/painel");

  if (protegida && !logado) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/painel/:path*"],
};
