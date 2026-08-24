import { NextRequest, NextResponse } from "next/server";
import { gerarAlertas } from "@/lib/alertas";

// Rota feita pra ser chamada por um agendador externo (Render Cron Job,
// por exemplo), nao por gente navegando — por isso a checagem de senha em
// vez de checar sessao de usuario logado.
export async function GET(request: NextRequest) {
  const chave = request.nextUrl.searchParams.get("chave");
  if (chave !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const resultado = await gerarAlertas();
  return NextResponse.json(resultado);
}
