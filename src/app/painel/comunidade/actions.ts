"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel, exigirSessao } from "@/lib/auth-guard";

// Numero opcional (ticket antes/depois). Mesma armadilha ja documentada:
// campo vazio vira "" -> 0 antes do `.optional()` rodar.
const numeroOpcional = () =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().nonnegative().optional(),
  );

const postSchema = z
  .object({
    tipo: z.enum(["RESULTADO", "DUVIDA", "GERAL"]),
    texto: z.string().trim().min(3, "Escreva um pouco mais").max(4000),
    ticketAntes: numeroOpcional(),
    ticketDepois: numeroOpcional(),
  })
  // Ticket so faz sentido em post de RESULTADO, e so com os dois valores —
  // "de R$ 480 para..." sem o depois nao comunica nada.
  .refine((d) => d.tipo !== "RESULTADO" || (d.ticketAntes == null) === (d.ticketDepois == null), {
    message: "Informe o ticket antes E depois, ou deixe os dois em branco",
    path: ["ticketDepois"],
  });

// So quem tem assinatura ATIVA participa. A comunidade e um beneficio do
// plano — sem isso alguem com assinatura cancelada continuaria postando.
async function exigirAssinaturaAtiva(usuarioId: string) {
  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId, status: "ATIVA" },
    select: { id: true },
  });
  if (!assinatura) throw new Error("Sua assinatura precisa estar ativa para participar da comunidade.");
}

export async function publicarPost(formData: FormData) {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  await exigirAssinaturaAtiva(session.user.id);

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const ehResultado = parsed.data.tipo === "RESULTADO";
  await prisma.post.create({
    data: {
      autorId: session.user.id,
      tipo: parsed.data.tipo,
      texto: parsed.data.texto,
      ticketAntes: ehResultado ? (parsed.data.ticketAntes ?? null) : null,
      ticketDepois: ehResultado ? (parsed.data.ticketDepois ?? null) : null,
    },
  });

  revalidatePath("/painel/comunidade");
}

const comentarioSchema = z.object({
  texto: z.string().trim().min(1).max(2000),
  paiId: z.string().optional(),
});

// ADMIN tambem comenta — a resposta dele aparece com selo "MENTOR" no feed
// (handoff 5e), entao a action serve os dois papeis.
export async function comentar(postId: string, formData: FormData) {
  const session = await exigirSessao();
  if (session.user.role === "ALUNO") throw new Error("Sem acesso.");
  if (session.user.role === "PERSONAL_PARCEIRO") await exigirAssinaturaAtiva(session.user.id);

  const parsed = comentarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { oculto: true } });
  if (!post || post.oculto) throw new Error("Post não encontrado.");

  await prisma.comentario.create({
    data: {
      postId,
      autorId: session.user.id,
      texto: parsed.data.texto,
      paiId: parsed.data.paiId || null,
    },
  });

  revalidatePath("/painel/comunidade");
  revalidatePath("/painel/admin/comunidade");
}

export async function alternarCurtida(postId: string) {
  const session = await exigirSessao();
  if (session.user.role === "ALUNO") throw new Error("Sem acesso.");

  // Unique (postId, usuarioId) impede curtida duplicada no banco — aqui so
  // decidimos se e curtir ou descurtir.
  const existente = await prisma.curtida.findUnique({
    where: { postId_usuarioId: { postId, usuarioId: session.user.id } },
    select: { id: true },
  });

  if (existente) {
    await prisma.curtida.delete({ where: { id: existente.id } });
  } else {
    await prisma.curtida.create({ data: { postId, usuarioId: session.user.id } });
  }

  revalidatePath("/painel/comunidade");
}

// --- Moderacao (so o Victor, handoff 6e) ---

export async function alternarDestaquePost(postId: string, destacado: boolean) {
  await exigirPapel("ADMIN");
  await prisma.post.update({ where: { id: postId }, data: { destacado } });
  revalidatePath("/painel/comunidade");
  revalidatePath("/painel/admin/comunidade");
}

// Ocultar NAO apaga: o registro fica, so sai do feed. Preserva historico e
// permite desfazer — apagar de vez seria irreversivel numa acao de 1 clique.
export async function alternarOcultarPost(postId: string, oculto: boolean) {
  await exigirPapel("ADMIN");
  await prisma.post.update({ where: { id: postId }, data: { oculto } });
  revalidatePath("/painel/comunidade");
  revalidatePath("/painel/admin/comunidade");
}
