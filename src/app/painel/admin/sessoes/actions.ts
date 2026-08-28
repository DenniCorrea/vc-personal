"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { registrarLogAdmin } from "@/lib/log-admin";
import { dataHoraLocal, formatador } from "@/lib/data";

const formatoQuando = formatador({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const sessaoSchema = z.object({
  usuarioId: z.string().min(1, "Escolha o mentorado"),
  data: z.string().min(1, "Informe a data"),
  hora: z.string().min(1, "Informe o horário"),
  duracaoMinutos: z.coerce.number().int().positive().max(480),
});

// Agendamento pelo MENTOR (regra definida pelo Victor em 28/08/2026).
//
// Inverte o fluxo antigo: antes o Victor abria horarios vagos e a pessoa
// escolhia um. Agora ele combina por fora e marca direto no nome do
// mentorado — a pessoa so e avisada. Isso casa com como a mentoria
// funciona de verdade: a sessao e negociada na conversa, nao num
// calendario de auto-atendimento.
//
// Continua usando Horario + Agendamento (em vez de um model novo) porque
// e o mesmo dado: um horario que existe e alguem ocupando ele. A diferenca
// e so QUEM cria — e assim o vinculo com Pagamento, que ja pendura em
// Agendamento, continua valendo se um dia houver sessao avulsa paga.
export type EstadoAgendamento = { erro?: string; sucesso?: boolean };

// Devolve estado em vez de lancar: erro de Server Action vira pagina de
// erro generica em producao, e "Conflito: voce ja tem sessao com Fulano as
// 14h" e justamente a informacao que resolve o problema pro Victor.
export async function agendarSessao(
  _anterior: EstadoAgendamento,
  formData: FormData,
): Promise<EstadoAgendamento> {
  const session = await exigirPapel("ADMIN");
  const parsed = sessaoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const inicio = dataHoraLocal(parsed.data.data, parsed.data.hora);
  const fim = new Date(inicio.getTime() + parsed.data.duracaoMinutos * 60_000);
  if (Number.isNaN(inicio.getTime())) return { erro: "Data ou horário inválido." };

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: parsed.data.usuarioId, status: "ATIVA" },
    select: { id: true, plano: { select: { produto: true } } },
  });
  if (!assinatura) return { erro: "Esse mentorado não tem assinatura ativa." };

  // Conflito de horario do proprio Victor: ele nao pode estar em duas
  // sessoes ao mesmo tempo. Checagem aqui e nao no banco porque envolve
  // sobreposicao de intervalo, que unique constraint nao expressa.
  const conflito = await prisma.agendamento.findFirst({
    where: {
      status: { not: "CANCELADO" },
      horario: { inicio: { lt: fim }, fim: { gt: inicio } },
    },
    include: { usuario: { select: { nome: true } }, horario: true },
  });
  if (conflito) {
    return {
      erro: `Conflito: você já tem sessão com ${conflito.usuario.nome} em ${formatoQuando.format(conflito.horario.inicio)}.`,
    };
  }

  const criado = await prisma.$transaction(async (tx) => {
    const horario = await tx.horario.create({
      data: { produto: assinatura.plano.produto, inicio, fim, ativo: true },
    });
    return tx.agendamento.create({
      data: {
        usuarioId: parsed.data.usuarioId,
        assinaturaId: assinatura.id,
        horarioId: horario.id,
        status: "AGENDADO",
      },
    });
  });

  // Aviso imediato — os lembretes de 24h e 30min ficam por conta do motor
  // de alertas (src/lib/alertas.ts). Este e o "marcamos sua sessao".
  await prisma.alerta.create({
    data: {
      usuarioId: parsed.data.usuarioId,
      tipo: "AGENDA",
      mensagem: `Sessão marcada para ${formatoQuando.format(inicio)}.`,
      chaveDedup: `sessao_marcada:${criado.id}`,
    },
  });

  await registrarLogAdmin(session.user.id, "agendou sessão", "Agendamento", criado.id);
  revalidatePath("/painel/admin/sessoes");
  revalidatePath("/painel/admin");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
  return { sucesso: true };
}

export async function cancelarSessao(agendamentoId: string) {
  const session = await exigirPapel("ADMIN");
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { horario: true },
  });
  if (!agendamento) throw new Error("Sessão não encontrada.");

  await prisma.agendamento.update({ where: { id: agendamentoId }, data: { status: "CANCELADO" } });

  await prisma.alerta.create({
    data: {
      usuarioId: agendamento.usuarioId,
      tipo: "AGENDA",
      mensagem: `A sessão de ${formatoQuando.format(agendamento.horario.inicio)} foi cancelada.`,
      chaveDedup: `sessao_cancelada:${agendamentoId}`,
    },
  });

  await registrarLogAdmin(session.user.id, "cancelou sessão", "Agendamento", agendamentoId);
  revalidatePath("/painel/admin/sessoes");
  revalidatePath("/painel/agenda");
  revalidatePath("/painel");
}

export async function concluirSessao(agendamentoId: string) {
  await exigirPapel("ADMIN");
  await prisma.agendamento.update({ where: { id: agendamentoId }, data: { status: "CONCLUIDO" } });
  revalidatePath("/painel/admin/sessoes");
  revalidatePath("/painel");
}
