import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import { VimeoPlayer } from "@/components/VimeoPlayer";

export default async function PaginaVideos() {
  const session = await exigirSessao();

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
      <main className="mx-auto max-w-md px-6 pt-13 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Vídeos</p>
        <h1 className="font-display mt-1 text-[26px] text-ink">Você ainda não tem acesso</h1>
        <p className="mt-2 text-[14px] text-ink-soft">Assine um plano pra desbloquear os vídeos.</p>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const videos = await prisma.video.findMany({
    where: { produto: assinatura.plano.produto, ativo: true },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 pt-13 pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Vídeos</p>
      <h1 className="font-display mt-1 text-[26px] text-ink">
        {assinatura.plano.produto === "ALUNO" ? "Exercícios" : "Conteúdo da mentoria"}
      </h1>

      <div className="mt-6 flex flex-col gap-6">
        {videos.map((video) => (
          <div key={video.id} className="rounded-[4px] border border-line bg-card p-4">
            <VimeoPlayer vimeoId={video.vimeoId} vimeoHash={video.vimeoHash} titulo={video.titulo} />
            <p className="mt-3 text-[14px] font-medium text-ink">{video.titulo}</p>
            {video.descricao && <p className="mt-1 text-[13px] text-ink-soft">{video.descricao}</p>}
          </div>
        ))}
        {videos.length === 0 && <p className="text-[13px] text-ink-soft">Nenhum vídeo disponível ainda.</p>}
      </div>

      <Link href="/painel" className="mt-10 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
