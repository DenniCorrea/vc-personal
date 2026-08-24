"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirPapel, exigirSessao } from "@/lib/auth-guard";
import { gerarAlertas } from "@/lib/alertas";

export async function marcarComoLido(id: string) {
  const session = await exigirSessao();
  await prisma.alerta.updateMany({
    where: { id, usuarioId: session.user.id },
    data: { lido: true },
  });
  revalidatePath("/painel/alertas");
  revalidatePath("/painel");
}

export async function marcarTodosComoLidos() {
  const session = await exigirSessao();
  await prisma.alerta.updateMany({
    where: { usuarioId: session.user.id, lido: false },
    data: { lido: true },
  });
  revalidatePath("/painel/alertas");
  revalidatePath("/painel");
}

export async function verificarAlertasAgora() {
  await exigirPapel("ADMIN");
  await gerarAlertas();
  revalidatePath("/painel/alertas");
  revalidatePath("/painel");
}
