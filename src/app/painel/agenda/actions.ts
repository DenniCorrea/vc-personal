"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { inicioDaSemana, fimDaSemana } from "@/lib/agenda";

export async function reservarHorario(horarioId: string, comoAvulso: boolean) {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
    include: { plano: true },
  });
  if (!assinatura) throw new Error("Você precisa de uma assinatura ativa pra agendar.");

  const horario = await prisma.horario.findUnique({ where: { id: horarioId } });
  if (!horario || !horario.ativo) throw new Error("Horário indisponível.");
  if (horario.produto !== assinatura.plano.produto) {
    throw new Error("Esse horário não é do seu produto.");
  }

  // Confere na hora, dentro da mesma checagem, se ninguem pegou esse
  // horario entre a pessoa abrir a tela e clicar em reservar.
  const ocupado = await prisma.agendamento.findFirst({
    where: { horarioId, status: { not: "CANCELADO" } },
  });
  if (ocupado) throw new Error("Esse horário acabou de ser reservado por outra pessoa.");

  const inicioSemana = inicioDaSemana(new Date());
  const fimSemana = fimDaSemana(new Date());
  const usoSemana = await prisma.agendamento.count({
    where: {
      assinaturaId: assinatura.id,
      avulso: false,
      status: { not: "CANCELADO" },
      horario: { inicio: { gte: inicioSemana, lt: fimSemana } },
    },
  });

  const limite = assinatura.plano.limiteAgendamentos ?? 0;
  const excedeuLimite = usoSemana >= limite;
  if (excedeuLimite && !comoAvulso) {
    throw new Error("Limite semanal do plano atingido. Marque a opção de agendamento avulso.");
  }

  await prisma.agendamento.create({
    data: {
      usuarioId: session.user.id,
      assinaturaId: assinatura.id,
      horarioId,
      avulso: excedeuLimite,
    },
  });

  revalidatePath("/painel/agenda");
}

export async function cancelarAgendamento(agendamentoId: string) {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");
  const agendamento = await prisma.agendamento.findUnique({ where: { id: agendamentoId } });
  if (!agendamento || agendamento.usuarioId !== session.user.id) {
    throw new Error("Agendamento não encontrado.");
  }
  await prisma.agendamento.update({ where: { id: agendamentoId }, data: { status: "CANCELADO" } });
  revalidatePath("/painel/agenda");
}
