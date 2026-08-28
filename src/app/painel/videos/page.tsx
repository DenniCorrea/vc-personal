import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao, bloquearAlunoPausado } from "@/lib/auth-guard";
import { VideosClient } from "./VideosClient";

export default async function PaginaVideos() {
  const session = await exigirSessao();
  bloquearAlunoPausado(session.user.role);

  // A protecao de verdade e essa consulta: so busca (e so existe no HTML
  // depois) video cujo `produto` bate com uma assinatura ATIVA da pessoa.
  // Sem assinatura ativa no produto certo, a lista vem vazia — nao existe
  // "video escondido no front" que da pra achar inspecionando a pagina.
  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
    include: { plano: true },
  });

  if (!assinatura) {
    return (
      <main className="mx-auto max-w-md px-6 pt-cabecalho-aluno pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Vídeos</p>
        <h1 className="font-display mt-1 text-[26px] text-ink">Você ainda não tem acesso</h1>
        <p className="mt-2 text-[14px] text-ink-soft">Assine um plano pra desbloquear os vídeos.</p>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const eDeAluno = assinatura.plano.produto === "ALUNO";

  const [videos, treinoHoje] = await Promise.all([
    prisma.video.findMany({
      where: { produto: assinatura.plano.produto, ativo: true },
      orderBy: { criadoEm: "desc" },
    }),
    eDeAluno
      ? prisma.treino.findFirst({
          where: { usuarioId: session.user.id, ativo: true },
          include: {
            exercicios: {
              include: { exercicio: { include: { video: true } } },
              orderBy: { ordem: "asc" },
            },
          },
          orderBy: { criadoEm: "asc" },
        })
      : Promise.resolve(null),
  ]);

  const doTreinoDeHoje =
    treinoHoje?.exercicios
      .filter((p) => p.exercicio.video)
      .map((p) => ({
        id: p.exercicio.video!.id,
        vimeoId: p.exercicio.video!.vimeoId,
        vimeoHash: p.exercicio.video!.vimeoHash,
        titulo: p.exercicio.nome,
        descricao: null,
      })) ?? [];

  const catalogo = videos.map((v) => ({
    id: v.id,
    vimeoId: v.vimeoId,
    vimeoHash: v.vimeoHash,
    titulo: v.titulo,
    descricao: v.descricao,
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 pt-cabecalho-aluno pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Biblioteca</p>
      <h1 className="font-display mt-1 text-[26px] text-ink">Vídeos</h1>

      <VideosClient doTreinoDeHoje={doTreinoDeHoje} catalogo={catalogo} eDeAluno={eDeAluno} />

      <Link href="/painel" className="mt-10 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
