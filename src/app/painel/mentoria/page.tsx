import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
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

  if (!assinatura) {
    return (
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
          Mentoria
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
          Você ainda não tem acesso
        </h1>
        <p className="mt-2 text-ink-soft">Assine a mentoria pra desbloquear o conteúdo.</p>
        <Link href="/painel/planos" className="mt-4 inline-block text-sm font-medium text-accent">
          Ver planos
        </Link>
      </main>
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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Mentoria
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Conteúdo</h1>

      <div className="mt-8 flex flex-col gap-10">
        {PILARES.map((pilar) => {
          const doPilar = conteudos.filter((c) => c.pilar === pilar.valor);
          if (doPilar.length === 0) return null;
          return (
            <section key={pilar.valor}>
              <h2 className="font-display text-xl font-semibold text-ink">{pilar.rotulo}</h2>
              <div className="mt-4 flex flex-col gap-6">
                {doPilar.map((conteudo) => (
                  <div key={conteudo.id} className="rounded-lg border border-line bg-paper-raised p-4">
                    <p className="font-medium text-ink">
                      {conteudo.titulo}{" "}
                      {conteudo.tipo === "SEMANAL" && (
                        <span className="text-xs font-normal text-accent">novo</span>
                      )}
                    </p>
                    {conteudo.descricao && <p className="mt-1 text-sm text-ink-soft">{conteudo.descricao}</p>}
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
          <p className="text-sm text-ink-soft">Nenhum conteúdo publicado ainda.</p>
        )}
      </div>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
