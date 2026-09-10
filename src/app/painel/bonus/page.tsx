import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { motivoDoBloqueio } from "@/lib/acesso";
import { SemAcesso } from "@/components/SemAcesso";
import { VimeoPlayer } from "@/components/VimeoPlayer";
import { ContadorExpiracao, corDaUrgencia } from "@/components/ContadorExpiracao";

const HACHURA = "repeating-linear-gradient(135deg, #1E1913 0 8px, #16130F 8px 16px)";

// Bonus e masterclasses (handoff, tela 5d). A regra que da sentido a tela:
// conteudo com prazo, que SOME da biblioteca quando a janela fecha.
export default async function PaginaBonus() {
  const session = await exigirPapel("PERSONAL_PARCEIRO");

  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId: session.user.id, status: "ATIVA" },
    include: { plano: { select: { nome: true, incluiBonus: true } } },
  });

  // Dois bloqueios diferentes, e a diferenca importa: quem NAO tem
  // assinatura vigente precisa saber por que (nunca assinou / pagamento
  // pendente / venceu); quem tem, mas num plano sem bonus, precisa e de um
  // convite pra upgrade. Misturar os dois era o que fazia o vencido ler
  // "assine um plano" como se nunca tivesse sido cliente.
  if (!assinatura) {
    return (
      <SemAcesso
        situacao={await motivoDoBloqueio(session.user.id)}
        area="Bônus"
        oQueDesbloqueia="as masterclasses"
      />
    );
  }

  if (!assinatura.plano.incluiBonus) {
    return (
      <main className="max-w-lg pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Bônus</p>
        <h1 className="font-display mt-1 text-[28px] text-ink">Seu plano não inclui os bônus</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          O plano {assinatura.plano.nome} não dá acesso às masterclasses. Fazer upgrade libera
          todas, inclusive as que já estão no ar.
        </p>
        <Link
          href="/painel/planos"
          className="mt-4 inline-block rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
        >
          Fazer upgrade
        </Link>
      </main>
    );
  }

  const agora = new Date();

  // So o que ja liberou e ainda nao expirou — o filtro e na query, entao
  // bonus fora da janela nem chega ao HTML.
  const disponiveis = await prisma.bonus.findMany({
    where: { liberaEm: { lte: agora }, expiraEm: { gt: agora } },
    orderBy: [{ destaque: "desc" }, { expiraEm: "asc" }],
    include: { video: { select: { vimeoId: true, vimeoHash: true } } },
  });

  const destaque = disponiveis.find((b) => b.destaque) ?? null;
  const demais = disponiveis.filter((b) => b.id !== destaque?.id);

  return (
    <main className="pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Bônus</p>
      <h1 className="font-display mt-1 text-[32px] text-ink md:text-[36px]">Masterclasses</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-soft">
        Conteúdos liberados por tempo limitado. Assista antes do prazo — depois de expirar,
        saem da sua biblioteca.
      </p>

      {disponiveis.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">Nenhum bônus disponível agora.</p>
        </div>
      ) : (
        <>
          {destaque && (
            <section
              className="mt-6 grid gap-0 overflow-hidden rounded-[4px] border border-accent-border lg:grid-cols-[420px_1fr]"
              style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))" }}
            >
              <div className="aspect-video lg:aspect-auto">
                {destaque.video ? (
                  <VimeoPlayer
                    vimeoId={destaque.video.vimeoId}
                    vimeoHash={destaque.video.vimeoHash}
                    titulo={destaque.titulo}
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: HACHURA }} />
                )}
              </div>
              <div className="flex flex-col justify-center p-6 lg:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Destaque</p>
                <h2 className="font-display mt-1.5 text-[26px] leading-tight text-ink md:text-[30px]">
                  {destaque.titulo}
                </h2>
                {destaque.descricao && (
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{destaque.descricao}</p>
                )}
                <span
                  className="mt-4 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5"
                  style={{ borderColor: "var(--color-accent-border)", background: "rgba(7,6,5,0.5)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-[12px] text-ink-soft">Disponível por mais</span>
                  <ContadorExpiracao
                    expiraEmIso={destaque.expiraEm.toISOString()}
                    className="font-mono text-[12px] text-accent"
                  />
                </span>
              </div>
            </section>
          )}

          {demais.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {demais.map((b) => (
                <article key={b.id} className="overflow-hidden rounded-[4px] border border-line bg-card">
                  <div className="relative aspect-video">
                    {b.video ? (
                      <VimeoPlayer vimeoId={b.video.vimeoId} vimeoHash={b.video.vimeoHash} titulo={b.titulo} />
                    ) : (
                      <div className="h-full w-full" style={{ background: HACHURA }} />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-[20px] leading-tight text-ink">{b.titulo}</h3>
                    {b.descricao && (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{b.descricao}</p>
                    )}
                    <span className="mt-3 flex items-center gap-1.5 whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: corDaUrgencia(b.expiraEm) }} />
                      <span className="text-[12px] text-ink-soft">Expira em</span>
                      <ContadorExpiracao
                        expiraEmIso={b.expiraEm.toISOString()}
                        className="font-mono text-[12px]"
                      />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
