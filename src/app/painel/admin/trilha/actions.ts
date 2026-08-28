"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { registrarLogAdmin } from "@/lib/log-admin";

// Campo numerico opcional: `z.coerce.number().optional()` NAO funciona
// aqui, porque campo vazio vira "" -> 0 antes do `.optional()` rodar
// (armadilha ja documentada no CLAUDE.md). O preprocess transforma vazio
// em undefined ANTES da coercao.
const numeroOpcional = () =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().positive().optional());

const moduloSchema = z.object({
  pilar: z.enum(["POSICIONAMENTO", "ABORDAGEM", "MAPEAMENTO", "VENDAS", "FIDELIZACAO"]),
  titulo: z.string().trim().min(2, "Título muito curto"),
  descricao: z.string().trim().optional(),
});

export async function salvarModulo(id: string, formData: FormData) {
  const session = await exigirPapel("ADMIN");
  const parsed = moduloSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const dados = {
    pilar: parsed.data.pilar,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
  };

  if (id === "novo") {
    // Ordem = ultima + 1. O mentorado ve os modulos nessa ordem, entao um
    // modulo novo entra no fim, nunca no meio da trilha de quem ja esta
    // estudando.
    const ultimo = await prisma.modulo.findFirst({ orderBy: { ordem: "desc" }, select: { ordem: true } });
    await prisma.modulo.create({ data: { ...dados, ordem: (ultimo?.ordem ?? 0) + 1 } });
  } else {
    await prisma.modulo.update({ where: { id }, data: dados });
  }

  await registrarLogAdmin(session.user.id, id === "novo" ? "criou módulo" : "editou módulo", "Modulo", id);
  revalidatePath("/painel/admin/trilha");
  redirect("/painel/admin/trilha");
}

export async function moverModulo(id: string, direcao: "cima" | "baixo") {
  await exigirPapel("ADMIN");
  const atual = await prisma.modulo.findUnique({ where: { id }, select: { id: true, ordem: true } });
  if (!atual) throw new Error("Módulo não encontrado.");

  // Troca de lugar com o vizinho — nao "ordem +/- 1" solto, que abriria
  // buracos e empataria duas ordens iguais depois de algumas mexidas.
  const vizinho = await prisma.modulo.findFirst({
    where: direcao === "cima" ? { ordem: { lt: atual.ordem } } : { ordem: { gt: atual.ordem } },
    orderBy: { ordem: direcao === "cima" ? "desc" : "asc" },
    select: { id: true, ordem: true },
  });
  if (!vizinho) return; // ja esta na ponta

  await prisma.$transaction([
    prisma.modulo.update({ where: { id: atual.id }, data: { ordem: vizinho.ordem } }),
    prisma.modulo.update({ where: { id: vizinho.id }, data: { ordem: atual.ordem } }),
  ]);
  revalidatePath("/painel/admin/trilha");
}

export async function alternarAtivoModulo(id: string, ativo: boolean) {
  await exigirPapel("ADMIN");
  await prisma.modulo.update({ where: { id }, data: { ativo } });
  revalidatePath("/painel/admin/trilha");
}

const aulaSchema = z.object({
  moduloId: z.string().min(1),
  titulo: z.string().trim().min(2, "Título muito curto"),
  descricao: z.string().trim().optional(),
  videoId: z.string().optional(),
  materialUrl: z.string().trim().url("Link do material inválido").optional().or(z.literal("")),
  prazoAcessoDias: numeroOpcional(),
  status: z.enum(["RASCUNHO", "AGENDADA", "PUBLICADA"]),
  planosVisiveis: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function salvarAula(id: string, formData: FormData) {
  const session = await exigirPapel("ADMIN");
  const bruto = { ...Object.fromEntries(formData), planosVisiveis: formData.getAll("planosVisiveis") };
  const parsed = aulaSchema.safeParse(bruto);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  const planos = (Array.isArray(parsed.data.planosVisiveis)
    ? parsed.data.planosVisiveis
    : parsed.data.planosVisiveis
      ? [parsed.data.planosVisiveis]
      : []
  ).filter(Boolean);

  const dados = {
    moduloId: parsed.data.moduloId,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao || null,
    videoId: parsed.data.videoId || null,
    materialUrl: parsed.data.materialUrl || null,
    prazoAcessoDias: parsed.data.prazoAcessoDias ?? null,
    status: parsed.data.status,
    // `publicadoEm` e a partir de quando o prazo de acesso conta. So marca
    // na hora em que a aula VIRA publicada — reeditar uma aula ja no ar nao
    // reinicia o relogio de quem esta assistindo.
    ...(parsed.data.status === "PUBLICADA" ? {} : { publicadoEm: null }),
  };

  const vinculoPlanos = planos.map((planoId) => ({ id: planoId }));

  if (id === "novo") {
    const ultima = await prisma.aula.findFirst({
      where: { moduloId: parsed.data.moduloId },
      orderBy: { ordem: "desc" },
      select: { ordem: true },
    });
    await prisma.aula.create({
      data: {
        ...dados,
        ordem: (ultima?.ordem ?? 0) + 1,
        // No create e `connect` (a aula ainda nao tem vinculo nenhum);
        // no update e `set`, que substitui a lista inteira de uma vez.
        planosVisiveis: { connect: vinculoPlanos },
        ...(parsed.data.status === "PUBLICADA" ? { publicadoEm: new Date() } : {}),
      },
    });
  } else {
    const antes = await prisma.aula.findUnique({ where: { id }, select: { publicadoEm: true } });
    await prisma.aula.update({
      where: { id },
      data: {
        ...dados,
        planosVisiveis: { set: vinculoPlanos },
        // So carimba a data se ainda nao tinha uma — preserva o relogio do
        // prazo de acesso quando o admin so corrige um titulo.
        ...(parsed.data.status === "PUBLICADA" && !antes?.publicadoEm ? { publicadoEm: new Date() } : {}),
      },
    });
  }

  await registrarLogAdmin(session.user.id, id === "novo" ? "criou aula" : "editou aula", "Aula", id);
  revalidatePath("/painel/admin/trilha");
  redirect(`/painel/admin/trilha?modulo=${parsed.data.moduloId}`);
}

export async function moverAula(id: string, direcao: "cima" | "baixo") {
  await exigirPapel("ADMIN");
  const atual = await prisma.aula.findUnique({ where: { id }, select: { id: true, ordem: true, moduloId: true } });
  if (!atual) throw new Error("Aula não encontrada.");

  const vizinha = await prisma.aula.findFirst({
    where: {
      moduloId: atual.moduloId,
      ordem: direcao === "cima" ? { lt: atual.ordem } : { gt: atual.ordem },
    },
    orderBy: { ordem: direcao === "cima" ? "desc" : "asc" },
    select: { id: true, ordem: true },
  });
  if (!vizinha) return;

  // Duas trocas numa transacao com unique (moduloId, ordem) colidiriam no
  // meio do caminho — por isso a ordem da atual vai pra um valor negativo
  // temporario antes da troca de verdade.
  await prisma.$transaction([
    prisma.aula.update({ where: { id: atual.id }, data: { ordem: -1 } }),
    prisma.aula.update({ where: { id: vizinha.id }, data: { ordem: atual.ordem } }),
    prisma.aula.update({ where: { id: atual.id }, data: { ordem: vizinha.ordem } }),
  ]);
  revalidatePath("/painel/admin/trilha");
}

export async function excluirAula(id: string) {
  const session = await exigirPapel("ADMIN");
  // Progresso e mensagens ancoradas apontam pra aula. Apagar a aula
  // deixaria essas linhas orfas, entao limpamos o vinculo antes — a
  // mensagem do mentorado continua na conversa dele, so perde a ancora.
  await prisma.$transaction([
    prisma.progresso.deleteMany({ where: { aulaId: id } }),
    prisma.mensagem.updateMany({ where: { aulaId: id }, data: { aulaId: null, timestampSegundos: null } }),
    prisma.aula.delete({ where: { id } }),
  ]);
  await registrarLogAdmin(session.user.id, "excluiu aula", "Aula", id);
  revalidatePath("/painel/admin/trilha");
}
