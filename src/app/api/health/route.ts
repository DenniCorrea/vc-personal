import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint de saude do app — combinado la na Fase 12 e pendente desde
// entao. Serve pra duas coisas:
//
//   1. Um monitor externo (UptimeRobot, Better Stack, ou um Cron Job da
//      propria Render) bater aqui de minuto em minuto e avisar por e-mail
//      se o app cair — hoje so descobrimos que caiu quando um aluno
//      reclama.
//   2. Manter o servico acordado no plano free da Render, que hiberna
//      depois de 15min sem trafego (a primeira visita depois disso leva
//      ~50s pra responder, o que parece "o app travou" pro aluno).
//
// Checa o BANCO de proposito, nao so "o processo esta vivo": o app pode
// estar de pe e mesmo assim inutil se a Neon estiver fora do ar, e um
// monitor que so olha o processo nunca perceberia isso.
export const dynamic = "force-dynamic";

export async function GET() {
  const comecou = Date.now();

  try {
    // Query mais barata possivel que ainda prova que a conexao funciona.
    await prisma.usuario.count();

    return NextResponse.json(
      {
        status: "ok",
        banco: "ok",
        latenciaBancoMs: Date.now() - comecou,
        em: new Date().toISOString(),
      },
      // `no-store` pra nenhum cache (Render, CDN, navegador) devolver um
      // "ok" velho enquanto o app ja esta fora do ar.
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    console.error("Health check falhou:", erro);
    // 503 e o codigo que monitores entendem como "servico indisponivel" —
    // com 200 o alerta nunca dispararia. Sem detalhe do erro na resposta:
    // essa rota e publica de proposito (o monitor nao faz login), entao ela
    // nao pode virar uma janela pra estrutura interna do sistema.
    return NextResponse.json(
      { status: "erro", banco: "indisponivel", em: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
