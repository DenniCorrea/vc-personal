"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { registrarLogAdmin } from "@/lib/log-admin";
import { dataHoraLocal } from "@/lib/data";

const bonusSchema = z
  .object({
    titulo: z.string().trim().min(2, "Título muito curto"),
    descricao: z.string().trim().optional(),
    videoId: z.string().optional(),
    dataLibera: z.string().min(1, "Informe a data de liberação"),
    horaLibera: z.string().min(1),
    dataExpira: z.string().min(1, "Informe a data de expiração"),
    horaExpira: z.string().min(1),
    destaque: z.literal("on").optional(),
    notificarPush: z.literal("on").optional(),
    lembrar3hAntes: z.literal("on").optional(),
  })
  .refine(
    (d) => dataHoraLocal(d.dataExpira, d.horaExpira) > dataHoraLocal(d.dataLibera, d.horaLibera),
    { message: "A expiração precisa ser depois da liberação", path: ["dataExpira"] },
  );

export async function salvarBonus(id: string, formData: FormData) {
  const session = await exigirPapel("ADMIN");
  const parsed = bonusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    videoId: parsed.data.videoId || null,
    // Janela montada com fuso explicito — o contador que o mentorado ve sai
    // daqui, entao 3h de erro apareceriam como "expira as 21h" quando o
    // Victor quis 18h. Ver src/lib/data.ts.
    liberaEm: dataHoraLocal(parsed.data.dataLibera, parsed.data.horaLibera),
    expiraEm: dataHoraLocal(parsed.data.dataExpira, parsed.data.horaExpira),
    destaque: parsed.data.destaque === "on",
    notificarPush: parsed.data.notificarPush === "on",
    lembrar3hAntes: parsed.data.lembrar3hAntes === "on",
  };

  if (id === "novo") {
    await prisma.bonus.create({ data: dados });
  } else {
    await prisma.bonus.update({ where: { id }, data: dados });
  }

  await registrarLogAdmin(session.user.id, id === "novo" ? "criou bônus" : "editou bônus", "Bonus", id);
  revalidatePath("/painel/admin/bonus");
  revalidatePath("/painel/bonus");
  redirect("/painel/admin/bonus");
}

export async function excluirBonus(id: string) {
  const session = await exigirPapel("ADMIN");
  await prisma.bonus.delete({ where: { id } });
  await registrarLogAdmin(session.user.id, "excluiu bônus", "Bonus", id);
  revalidatePath("/painel/admin/bonus");
  revalidatePath("/painel/bonus");
}
