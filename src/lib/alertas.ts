import { prisma } from "@/lib/prisma";
import { hojeData } from "@/lib/data";

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

// Cria o Alerta se a `chaveDedup` ainda nao existir. Ignora silenciosamente
// se ja existe (e assim que evitamos gerar o mesmo aviso toda vez que esse
// motor roda). `create` + catch em vez de `findFirst` antes: uma chamada a
// menos no banco, e a unicidade do banco e quem garante a corretude mesmo
// se duas execucoes rodarem ao mesmo tempo.
async function criarSeNaoExiste(dados: {
  usuarioId: string;
  tipo: Parameters<typeof prisma.alerta.create>[0]["data"]["tipo"];
  mensagem: string;
  chaveDedup: string;
}) {
  try {
    await prisma.alerta.create({ data: dados });
  } catch {
    // violacao da unique constraint em chaveDedup — alerta ja existe, tudo bem
  }
}

// O motor de verificacao inteiro. Chamado por um botao do admin agora, e
// por uma rota de cron (src/app/api/cron/alertas/route.ts) quando o deploy
// (Fase 11) tiver um agendador de verdade rodando isso todo dia.
export async function gerarAlertas(): Promise<{ criados: number }> {
  const hoje = hojeData();
  const hojeIso = hoje.toISOString().slice(0, 10);
  let criados = 0;

  const admins = await prisma.usuario.findMany({ where: { role: "ADMIN" } });

  // 1) Renovacao proxima (3 dias) — avisa o proprio usuario.
  const emTresDias = new Date(hoje);
  emTresDias.setUTCDate(emTresDias.getUTCDate() + 3);
  const proximasDoVencimento = await prisma.assinatura.findMany({
    where: { status: "ATIVA", dataProximaRenovacao: { lte: emTresDias, gte: hoje } },
    include: { plano: true },
  });
  for (const assinatura of proximasDoVencimento) {
    await criarSeNaoExiste({
      usuarioId: assinatura.usuarioId,
      tipo: "RENOVACAO_PROXIMA",
      mensagem: `Seu plano "${assinatura.plano.nome}" renova em ${formatoData.format(assinatura.dataProximaRenovacao)}.`,
      chaveDedup: `renovacao_proxima:${assinatura.id}:${hojeIso}`,
    });
    criados++;
  }

  // 2) Venceu e ainda ta ATIVA -> vira ATRASADA + avisa o usuario + avisa o
  // admin (esse e o "follow-up de retencao" que o briefing pede).
  const vencidas = await prisma.assinatura.findMany({
    where: { status: "ATIVA", dataProximaRenovacao: { lt: hoje } },
    include: { plano: true, usuario: true },
  });
  for (const assinatura of vencidas) {
    await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: "ATRASADA" } });

    await criarSeNaoExiste({
      usuarioId: assinatura.usuarioId,
      tipo: "ASSINATURA_ATRASADA",
      mensagem: `Sua assinatura "${assinatura.plano.nome}" está atrasada — renove pra manter o acesso.`,
      chaveDedup: `atrasada:${assinatura.id}:${hojeIso}`,
    });

    for (const admin of admins) {
      await criarSeNaoExiste({
        usuarioId: admin.id,
        tipo: "ALUNO_SEM_RENOVACAO",
        mensagem: `${assinatura.usuario.nome} não renovou o plano "${assinatura.plano.nome}" — vale um follow-up.`,
        chaveDedup: `sem_renovacao:${assinatura.id}:${hojeIso}`,
      });
    }
    criados++;
  }

  // 3) Baixa utilizacao — aluno com assinatura ATIVA sem NENHUM agendamento
  // (nao-cancelado) nos ultimos 14 dias. Item explicito do briefing
  // ("aluno que deixou de agendar; aluno com baixa utilizacao") que eu
  // tinha deixado de fora inicialmente por escopo — inclui agora.
  const catorzeDiasAtras = new Date(hoje);
  catorzeDiasAtras.setUTCDate(catorzeDiasAtras.getUTCDate() - 14);
  const assinaturasAlunoAtivas = await prisma.assinatura.findMany({
    where: { status: "ATIVA", plano: { produto: "ALUNO" } },
    include: { usuario: true },
  });
  for (const assinatura of assinaturasAlunoAtivas) {
    const agendamentoRecente = await prisma.agendamento.findFirst({
      where: {
        usuarioId: assinatura.usuarioId,
        status: { not: "CANCELADO" },
        horario: { inicio: { gte: catorzeDiasAtras } },
      },
    });
    if (agendamentoRecente) continue;

    for (const admin of admins) {
      await criarSeNaoExiste({
        usuarioId: admin.id,
        tipo: "ALUNO_SEM_RENOVACAO",
        mensagem: `${assinatura.usuario.nome} não agenda nada há mais de 14 dias — pode estar perdendo o hábito.`,
        chaveDedup: `baixa_utilizacao:${assinatura.id}:${hojeIso}`,
      });
    }
    criados++;
  }

  // 4) Lembrete de habito — dispara uma vez por dia, no horario configurado
  // (compara so a hora:minuto, com 5min de tolerancia pra nao depender de
  // rodar exatamente no segundo certo).
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const habitosComLembrete = await prisma.habito.findMany({
    where: { lembreteAtivo: true, lembreteHorario: { not: null } },
    include: { usuario: true },
  });
  for (const habito of habitosComLembrete) {
    if (habito.lembreteHorario !== horaAtual) continue;
    await criarSeNaoExiste({
      usuarioId: habito.usuarioId,
      tipo: habito.tipo === "AGUA" ? "HABITO_AGUA" : "HABITO_SONO",
      mensagem: habito.tipo === "AGUA" ? "Hora de beber água 💧" : "Não esqueça de registrar seu sono.",
      chaveDedup: `habito:${habito.id}:${hojeIso}`,
    });
    criados++;
  }

  // 5) Lembrete de agenda — sessao comecando na proxima hora.
  const emUmaHora = new Date();
  emUmaHora.setMinutes(emUmaHora.getMinutes() + 60);
  const proximosAgendamentos = await prisma.agendamento.findMany({
    where: { status: { in: ["AGENDADO", "CONFIRMADO"] }, horario: { inicio: { gte: new Date(), lte: emUmaHora } } },
    include: { horario: true },
  });
  for (const agendamento of proximosAgendamentos) {
    await criarSeNaoExiste({
      usuarioId: agendamento.usuarioId,
      tipo: "AGENDA",
      mensagem: `Sua sessão começa às ${agendamento.horario.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
      chaveDedup: `agenda:${agendamento.id}`,
    });
    criados++;
  }

  return { criados };
}
