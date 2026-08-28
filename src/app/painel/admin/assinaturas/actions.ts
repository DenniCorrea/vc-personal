"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { registrarLogAdmin } from "@/lib/log-admin";
import { dataHoraLocal } from "@/lib/data";

const cortesiaSchema = z.object({
  usuarioId: z.string().min(1),
  planoId: z.string().min(1),
  dataProximaRenovacao: z.string().min(1),
});

export async function concederCortesia(formData: FormData) {
  const session = await exigirPapel("ADMIN");
  const parsed = cortesiaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const plano = await prisma.plano.findUnique({ where: { id: parsed.data.planoId } });
  if (!plano) throw new Error("Plano não encontrado.");

  // Mesma regra de "uma assinatura por vez" que vale pra quem paga — cortesia
  // nao e excecao a essa regra de negocio, so pula a parte do pagamento.
  const jaTemAssinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: parsed.data.usuarioId, status: { in: ["PENDENTE", "ATIVA", "ATRASADA"] } },
  });
  if (jaTemAssinatura) {
    throw new Error("Essa pessoa já tem uma assinatura pendente, ativa ou atrasada.");
  }

  const assinatura = await prisma.assinatura.create({
    data: {
      usuarioId: parsed.data.usuarioId,
      planoId: parsed.data.planoId,
      status: "ATIVA",
      cortesia: true,
      concedidaPorId: session.user.id,
      dataProximaRenovacao: dataHoraLocal(parsed.data.dataProximaRenovacao, "00:00"),
    },
  });
  await registrarLogAdmin(session.user.id, "concedeu cortesia", "Assinatura", assinatura.id);

  revalidatePath("/painel/admin/assinaturas");
  redirect("/painel/admin/assinaturas");
}

export async function encerrarCortesia(assinaturaId: string) {
  const session = await exigirPapel("ADMIN");
  await prisma.assinatura.update({
    where: { id: assinaturaId, cortesia: true },
    data: { status: "CANCELADA" },
  });
  await registrarLogAdmin(session.user.id, "encerrou cortesia", "Assinatura", assinaturaId);
  revalidatePath("/painel/admin/assinaturas");
}
