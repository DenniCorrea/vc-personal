import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { motivoDoBloqueio } from "@/lib/acesso";
import { SemAcesso } from "@/components/SemAcesso";
import { VimeoPlayer } from "@/components/VimeoPlayer";
import type { Pilar } from "@/generated/prisma/enums";

const PILARES: { valor: Pilar; rotulo: string }[] = [
  { valor: "POSICIONAMENTO", rotulo: "Posicionamento" },
  { valor: "ABORDAGEM", rotulo: "Abordagem" },
  { valor: "MAPEAMENTO", rotulo: "Mapeamento" },
  { valor: "VENDAS", rotulo: "Vendas" },
  { valor: "FIDELIZACAO", rotulo: "Fidelização" },
];

export default async function PaginaMentoria() {
  const session = await exigirPapel("PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
  });

  // Sem <main> com padding/max-width proprios: desde 28/08/2026 esta tela
  // roda dentro da casca do mentorado (sidebar no desktop, bottom nav no
  // mobile), que ja aplica o gutter e a largura maxima. Manter os antigos
  // duplicava o espacamento.
  if (!assinatura) {
    return (
      <SemAcesso
        situacao={await motivoDoBloqueio(session.user.id)}
        area="Mentoria"
        oQueDesbloqueia="o conteúdo da mentoria"
      />
    );
  }

  // So mostra o que ja passou da data de publicacao — e essa comparacao
  // (nao um campo "publicado: true/false") que faz o video da semana
  // "destravar" sozinho no dia certo.
  const conteudos = await prisma.conteudoConsultoria.findMany({
    where: { ativo: true, publicadoEm: { lte: new Date() } },
    include: { video: true },
    orderBy: { publicadoEm: "desc" },
  });

  return (
    <main className="max-w-3xl pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[32px] text-ink md:text-[36px]">Módulos</h1>

      <div className="mt-8 flex flex-col gap-10">
        {PILARES.map((pilar) => {
          const doPilar = conteudos.filter((c) => c.pilar === pilar.valor);
          if (doPilar.length === 0) return null;
          return (
            <section key={pilar.valor}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Pilar</p>
              <h2 className="font-display mt-1 text-[23px] text-ink">{pilar.rotulo}</h2>
              <div className="mt-4 flex flex-col gap-6">
                {doPilar.map((conteudo) => (
                  <div key={conteudo.id} className="rounded-[4px] border border-line bg-card p-5">
                    <p className="text-[15px] font-medium text-ink">
                      {conteudo.titulo}{" "}
                      {conteudo.tipo === "SEMANAL" && (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">novo</span>
                      )}
                    </p>
                    {conteudo.descricao && <p className="mt-1 text-[13px] text-ink-soft">{conteudo.descricao}</p>}
                    {conteudo.video && (
                      <div className="mt-3">
                        <VimeoPlayer
                          vimeoId={conteudo.video.vimeoId}
                          vimeoHash={conteudo.video.vimeoHash}
                          titulo={conteudo.titulo}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {conteudos.length === 0 && (
          <p className="text-[13px] text-ink-soft">Nenhum conteúdo publicado ainda.</p>
        )}
      </div>
    </main>
  );
}
