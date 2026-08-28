"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";

const diagnosticoSchema = z.object({
  ticket: z.coerce.number().nonnegative("Informe um valor válido"),
  alunos: z.coerce.number().int().nonnegative("Informe um número válido"),
  maiorGargalo: z.string().trim().min(5, "Conte um pouco mais").max(1000),
});

export async function responderDiagnostico(formData: FormData) {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  const parsed = diagnosticoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const existente = await prisma.diagnostico.findUnique({
    where: { usuarioId: session.user.id },
    select: { id: true },
  });

  if (existente) {
    // Ja respondeu antes: isto e uma ATUALIZACAO. O snapshot inicial
    // (`ticketInicial`/`alunosInicial`) fica congelado de proposito — e ele
    // que da sentido a comparacao depois. Sobrescrever apagaria o "antes".
    await prisma.diagnostico.update({
      where: { usuarioId: session.user.id },
      data: {
        ticketAtual: parsed.data.ticket,
        alunosAtual: parsed.data.alunos,
        maiorGargalo: parsed.data.maiorGargalo,
      },
    });
  } else {
    await prisma.diagnostico.create({
      data: {
        usuarioId: session.user.id,
        ticketInicial: parsed.data.ticket,
        alunosInicial: parsed.data.alunos,
        // Na primeira resposta, "atual" e igual ao inicial — assim a tela
        // de evolucao ja tem os dois lados sem tratar null.
        ticketAtual: parsed.data.ticket,
        alunosAtual: parsed.data.alunos,
        maiorGargalo: parsed.data.maiorGargalo,
      },
    });
  }

  revalidatePath("/painel");
  revalidatePath("/painel/diagnostico");
  redirect("/painel");
}
