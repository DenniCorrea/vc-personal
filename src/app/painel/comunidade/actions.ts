"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel, exigirSessao } from "@/lib/auth-guard";
import { registrarLogAdmin } from "@/lib/log-admin";
import { bloqueioPorSilenciamento } from "@/lib/moderacao-servidor";

export type EstadoDenuncia = { erro?: string; enviada?: boolean };

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

  // Checagem no SERVIDOR: esconder o formulario no cliente nao impede
  // ninguem de mandar o POST na mao.
  const bloqueio = await bloqueioPorSilenciamento(session.user.id);
  if (bloqueio) throw new Error(bloqueio);

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
  if (session.user.role === "PERSONAL_PARCEIRO") {
    await exigirAssinaturaAtiva(session.user.id);
    const bloqueio = await bloqueioPorSilenciamento(session.user.id);
    if (bloqueio) throw new Error(bloqueio);
  }

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

// --- Denuncia: como o Victor fica sabendo ---

const denunciaSchema = z.object({
  motivo: z.enum(["SPAM", "OFENSA", "CONTEUDO_IMPROPRIO", "FORA_DO_TEMA", "OUTRO"]),
  detalhe: z.string().trim().max(500).optional(),
});

// Quem esta no feed ve antes de qualquer moderador. Sem esse botao, "ter
// alguem olhando" dependeria do Victor ler tudo todo dia — o que na pratica
// significa que ninguem esta olhando.
export async function denunciar(
  alvo: { postId: string } | { comentarioId: string },
  _estadoAnterior: EstadoDenuncia,
  formData: FormData,
): Promise<EstadoDenuncia> {
  const session = await exigirPapel("PERSONAL_PARCEIRO", "ADMIN");

  const parsed = denunciaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: "Escolha um motivo." };

  const postId = "postId" in alvo ? alvo.postId : null;
  const comentarioId = "comentarioId" in alvo ? alvo.comentarioId : null;

  // Confere que o alvo existe antes de gravar — id vindo do formulario e
  // palpite de qualquer um.
  const existe = postId
    ? await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
    : await prisma.comentario.findUnique({ where: { id: comentarioId! }, select: { id: true } });
  if (!existe) return { erro: "Conteúdo não encontrado." };

  try {
    await prisma.denuncia.create({
      data: {
        postId,
        comentarioId,
        denuncianteId: session.user.id,
        motivo: parsed.data.motivo,
        detalhe: parsed.data.detalhe || null,
      },
    });
  } catch {
    // Unique (denunciante, post, comentario): clicar duas vezes nao vira
    // duas linhas na fila. Do ponto de vista de quem clicou, deu certo.
    return { enviada: true };
  }

  revalidatePath("/painel/admin/comunidade");
  return { enviada: true };
}

// --- Moderacao de comentario (so o Victor) ---

// Mesma regra do post: ocultar NAO apaga. Se a remocao for contestada, da
// pra reler exatamente o que foi dito.
export async function alternarOcultarComentario(comentarioId: string, oculto: boolean) {
  await exigirPapel("ADMIN");
  await prisma.comentario.update({ where: { id: comentarioId }, data: { oculto } });
  revalidatePath("/painel/comunidade");
  revalidatePath("/painel/admin/comunidade");
}

// --- Punicao proporcional ---

export async function silenciarMentorado(usuarioId: string, formData: FormData) {
  const session = await exigirPapel("ADMIN");

  const dias = Number(formData.get("dias"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!Number.isFinite(dias) || dias < 1 || dias > 365) return;

  const ate = new Date();
  ate.setDate(ate.getDate() + dias);

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { comunidadeSilenciadaAte: ate, comunidadeMotivoSilencio: motivo || null },
  });

  // A pessoa precisa SABER que foi silenciada e por que — punicao silenciosa
  // vira "o app quebrou" na cabeca de quem tenta postar.
  await prisma.alerta.create({
    data: {
      usuarioId,
      tipo: "MODERACAO",
      // `chaveDedup` e @unique. Aqui ela nao serve pra deduplicar (cada
      // suspensao e um evento novo e precisa avisar de novo) — leva o
      // instante so pra nao colidir com a suspensao anterior da mesma pessoa.
      chaveDedup: `silenciado:${usuarioId}:${Date.now()}`,
      mensagem: motivo
        ? `Sua participação na comunidade foi suspensa por ${dias} dia(s). Motivo: ${motivo}`
        : `Sua participação na comunidade foi suspensa por ${dias} dia(s).`,
    },
  });

  await registrarLogAdmin(session.user.id, `silenciou na comunidade (${dias}d)`, "Usuario", usuarioId);
  revalidatePath("/painel/admin/comunidade");
  revalidatePath("/painel/comunidade");
}

export async function liberarMentorado(usuarioId: string) {
  const session = await exigirPapel("ADMIN");
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { comunidadeSilenciadaAte: null, comunidadeMotivoSilencio: null },
  });
  await prisma.alerta.create({
    data: {
      usuarioId,
      tipo: "MODERACAO",
      chaveDedup: `liberado:${usuarioId}:${Date.now()}`,
      mensagem: "Sua participação na comunidade foi liberada. Bem-vindo de volta.",
    },
  });
  await registrarLogAdmin(session.user.id, "liberou na comunidade", "Usuario", usuarioId);
  revalidatePath("/painel/admin/comunidade");
  revalidatePath("/painel/comunidade");
}

export async function resolverDenuncia(denunciaId: string, acaoTomada: string) {
  const session = await exigirPapel("ADMIN");
  await prisma.denuncia.update({
    where: { id: denunciaId },
    data: { resolvidoEm: new Date(), moderadorId: session.user.id, acaoTomada },
  });
  revalidatePath("/painel/admin/comunidade");
}
