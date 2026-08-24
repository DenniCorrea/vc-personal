"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

async function garantirPlano(usuarioId: string) {
  return prisma.planoNutricional.upsert({
    where: { usuarioId },
    update: {},
    create: { usuarioId },
  });
}

// Sem o preprocess, um <input type="number"> vazio ("") vira 0 depois do
// z.coerce.number(), e ".positive()" rejeita 0 mesmo quando o campo so
// foi deixado em branco de proposito.
const numeroOpcional = () =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().positive().optional());

const refeicaoSchema = z.object({
  nome: z.string().trim().min(1),
  horario: z.string().trim().optional(),
  composicao: z.string().trim().min(1),
  kcal: numeroOpcional(),
});

export async function adicionarRefeicao(usuarioId: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = refeicaoSchema.parse(Object.fromEntries(formData));
  const plano = await garantirPlano(usuarioId);

  const ultima = await prisma.refeicao.findFirst({
    where: { planoNutricionalId: plano.id },
    orderBy: { ordem: "desc" },
  });

  await prisma.refeicao.create({
    data: {
      planoNutricionalId: plano.id,
      nome: parsed.nome,
      horario: parsed.horario || null,
      composicao: parsed.composicao,
      kcal: parsed.kcal ?? null,
      ordem: (ultima?.ordem ?? 0) + 1,
    },
  });

  revalidatePath(`/painel/admin/nutricao/${usuarioId}`);
}

export async function removerRefeicao(usuarioId: string, refeicaoId: string) {
  await exigirPapel("ADMIN");
  await prisma.refeicao.delete({ where: { id: refeicaoId } });
  revalidatePath(`/painel/admin/nutricao/${usuarioId}`);
}

const metasSchema = z.object({
  metaAguaLitros: numeroOpcional(),
  metaSonoHoras: numeroOpcional(),
  metaProteinaG: numeroOpcional(),
});

// As metas de agua/sono moram no Habito (mesma tabela que o app do aluno
// ja le em /painel/habitos) — nao duplicamos esse dado no PlanoNutricional,
// so a proteina (que nao tem outro lugar) fica la.
export async function definirMetasNutricionais(usuarioId: string, formData: FormData) {
  await exigirPapel("ADMIN");
  const parsed = metasSchema.parse(Object.fromEntries(formData));
  const plano = await garantirPlano(usuarioId);

  await Promise.all([
    parsed.metaAguaLitros
      ? prisma.habito.upsert({
          where: { usuarioId_tipo: { usuarioId, tipo: "AGUA" } },
          update: { metaValor: parsed.metaAguaLitros },
          create: { usuarioId, tipo: "AGUA", metaValor: parsed.metaAguaLitros },
        })
      : Promise.resolve(),
    parsed.metaSonoHoras
      ? prisma.habito.upsert({
          where: { usuarioId_tipo: { usuarioId, tipo: "SONO" } },
          update: { metaValor: parsed.metaSonoHoras },
          create: { usuarioId, tipo: "SONO", metaValor: parsed.metaSonoHoras },
        })
      : Promise.resolve(),
    prisma.planoNutricional.update({
      where: { id: plano.id },
      data: { metaProteinaG: parsed.metaProteinaG ?? plano.metaProteinaG },
    }),
  ]);

  revalidatePath(`/painel/admin/nutricao/${usuarioId}`);
}
