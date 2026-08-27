import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Exportacao de dados pessoais (LGPD, art. 18) — a pessoa baixa tudo que
// guardamos sobre ela em JSON. Deliberadamente NAO inclui `senhaHash` nem
// `cpfHash` (hash nao e "o dado", mas nao ha motivo pra expor nem o hash) —
// so o que a propria pessoa reconheceria como "meus dados".
//
// IMPORTANTE pra manutencao: toda vez que um model novo passar a guardar
// algo ligado a uma pessoa, ele precisa entrar nesse include. Uma
// exportacao incompleta nao cumpre o art. 18 — foi exatamente o que
// aconteceu com os models da Fase 12, que ficaram de fora ate a auditoria
// de seguranca de 27/08/2026.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      assinaturas: { include: { plano: true } },
      agendamentos: { include: { horario: true } },
      pagamentos: true,
      habitos: { include: { registros: true } },
      treinos: { include: { exercicios: { include: { exercicio: true } } } },
      alertas: true,

      // --- Metodo Lider (Fase 12) ---
      // Anamnese, avaliacoes e fotos de progresso sao dado de SAUDE, que a
      // LGPD trata como dado pessoal SENSIVEL (art. 5, II). Justamente por
      // isso nao podiam continuar fora da exportacao.
      anamnese: true,
      avaliacoes: { orderBy: { data: "asc" } },
      execucoes: { orderBy: { data: "asc" } },
      fotosProgresso: { orderBy: { criadoEm: "asc" } },
      planoNutricional: { include: { refeicoes: { include: { checkins: true } } } },
      // So a thread da propria pessoa (`mensagens`). `mensagensEscritas`
      // ficaria igual pra um aluno, mas pro admin traria a conversa de
      // todo mundo — nao e "os dados dele".
      mensagens: { orderBy: { criadoEm: "asc" } },
    },
  });
  if (!usuario) {
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  }

  const dadosExportaveis = { ...usuario, senhaHash: undefined, cpfHash: undefined };

  return new NextResponse(JSON.stringify(dadosExportaveis, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=meus-dados.json",
      // Um JSON com dado de saude nao pode ficar em cache de CDN nem do
      // navegador esperando a proxima pessoa que usar aquele aparelho.
      "Cache-Control": "no-store, private",
    },
  });
}
