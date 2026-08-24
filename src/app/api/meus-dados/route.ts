import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Exportacao de dados pessoais (LGPD, art. 18) — a pessoa baixa tudo que
// guardamos sobre ela em JSON. Deliberadamente NAO inclui `senhaHash` nem
// `cpfHash` (hash nao e "o dado", mas nao ha motivo pra expor nem o hash) —
// so o que a propria pessoa reconheceria como "meus dados".
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
    },
  });
}
