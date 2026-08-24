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

const geracaoSchema = z.object({
  produto: z.enum(["ALUNO", "MENTORIA"]),
  tipoAtendimento: z.enum(["VIDEO", "PRESENCIAL", "DISTANCIA", ""]).optional(),
  diasDaSemana: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]).map(Number))
    .refine((dias) => dias.length > 0 && dias.every((d) => Number.isInteger(d) && d >= 0 && d <= 6), {
      message: "Selecione ao menos um dia da semana válido",
    }),
  horaInicio: z.string().min(1),
  horaFim: z.string().min(1),
  dataInicio: z.string().min(1),
  semanas: z.coerce.number().int().min(1).max(12),
});

// "Duplicar semana" generico: em vez de o admin criar horario um por um toda
// semana, ele descreve o padrao (quais dias, que horario) uma vez e a gente
// gera todas as ocorrencias pro numero de semanas pedido de uma vez.
export async function gerarHorariosRecorrentes(formData: FormData) {
  await exigirPapel("ADMIN");
  const bruto = { ...Object.fromEntries(formData), diasDaSemana: formData.getAll("diasDaSemana") };
  const parsed = geracaoSchema.safeParse(bruto);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const diasSet = new Set(parsed.data.diasDaSemana);
  const inicioBase = new Date(`${parsed.data.dataInicio}T00:00`);

  const novos: { produto: "ALUNO" | "MENTORIA"; tipoAtendimento: "VIDEO" | "PRESENCIAL" | "DISTANCIA" | null; inicio: Date; fim: Date }[] = [];
  for (let dia = 0; dia < parsed.data.semanas * 7; dia++) {
    const data = new Date(inicioBase);
    data.setDate(data.getDate() + dia);
    if (!diasSet.has(data.getDay())) continue;

    const dataIso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
    novos.push({
      produto: parsed.data.produto,
      tipoAtendimento: (parsed.data.tipoAtendimento || null) as "VIDEO" | "PRESENCIAL" | "DISTANCIA" | null,
      inicio: new Date(`${dataIso}T${parsed.data.horaInicio}`),
      fim: new Date(`${dataIso}T${parsed.data.horaFim}`),
    });
  }

  if (novos.length === 0) throw new Error("Nenhum horário gerado — confira os dias da semana escolhidos.");

  await prisma.horario.createMany({ data: novos });
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
