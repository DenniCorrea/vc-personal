"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const horarioSchema = z.object({
  produto: z.enum(["ALUNO", "MENTORIA"]),
  tipoAtendimento: z.enum(["VIDEO", "PRESENCIAL", "DISTANCIA", ""]).optional(),
  data: z.string().min(1),
  horaInicio: z.string().min(1),
  horaFim: z.string().min(1),
});

export async function criarHorario(formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = horarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  // Simplificacao assumida: um so fuso horario (o do Brasil, onde o Victor
  // atende). Sem isso viraria uma tela de configuracao de timezone que
  // ninguem pediu — se o app crescer pra atender gente em outro fuso, essa
  // e a hora de revisitar.
  const inicio = new Date(`${parsed.data.data}T${parsed.data.horaInicio}`);
  const fim = new Date(`${parsed.data.data}T${parsed.data.horaFim}`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
    throw new Error("Horário inválido — o fim precisa ser depois do início.");
  }

  await prisma.horario.create({
    data: {
      produto: parsed.data.produto,
      tipoAtendimento: parsed.data.tipoAtendimento || null,
      inicio,
      fim,
    },
  });
  revalidatePath("/painel/admin/horarios");
}

export async function desativarHorario(id: string) {
  await exigirPapel("ADMIN");
  await prisma.horario.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/painel/admin/horarios");
}

export async function marcarStatusAgendamento(id: string, status: "CONCLUIDO" | "FALTOU") {
  await exigirPapel("ADMIN");
  await prisma.agendamento.update({ where: { id }, data: { status } });
  revalidatePath("/painel/admin/horarios");
}
