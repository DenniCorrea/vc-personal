import Link from "next/link";
import { prisma } from "@/lib/prisma";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Catalogo PUBLICO de planos (handoff, tela 5g). Rota fora de /painel de
// proposito: e a pagina que o visitante ve antes de existir conta — o
// proxy.ts so protege /painel, entao esta fica aberta.
//
// Quem ja tem conta assina por /painel/planos, que conhece a assinatura
// atual e trata upgrade/troca. Aqui o CTA leva pro cadastro.
export default async function PaginaPlanosPublica() {
  const planos = await prisma.plano.findMany({
    where: { produto: "MENTORIA", ativo: true },
    orderBy: { preco: "asc" },
  });

  // O do meio e o destacado ("mais contratado" no handoff). Com 3 planos
  // isso e o indice 1; com outra quantidade, cai no do meio mesmo assim.
  const indiceDestaque = Math.floor(planos.length / 2);

  return (
    <div className="min-h-dvh" style={{ background: "var(--color-hero)" }}>
      <main className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          Mentoria para personal trainers
        </p>
        <h1
          className="font-display mt-3 leading-[1.05] tracking-[-0.02em] text-ink"
          style={{ fontSize: "clamp(34px, 5vw, 52px)" }}
        >
          Escolha o nível de
          <br />
          <span className="italic text-accent">acompanhamento.</span>
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          Todos incluem a trilha completa de conteúdo e a comunidade fechada. O que muda é
          quanto de mim você tem por mês.
        </p>

        {planos.length === 0 ? (
          <p className="mt-10 text-[14px] text-ink-soft">Nenhum plano disponível no momento.</p>
        ) : (
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {planos.map((plano, i) => {
              const destaque = i === indiceDestaque;
              const preco = Number(plano.preco);
              // Mesma regra de 6% do Pix ja usada no app (src/lib/mercadopago.ts).
              const noPix = preco * 0.94;

              return (
                <section
                  key={plano.id}
                  // Destacado vem PRIMEIRO no mobile (`order-first`) e volta
                  // pra posicao natural — o meio — no desktop
                  // (`lg:order-none`). Fazer isso por style inline aplicava a
                  // reordenacao nas DUAS larguras, e o card destacado
                  // aparecia em primeiro tambem no desktop, fora do lugar
                  // que o handoff pede (defeito pego na auditoria).
                  className={`relative flex flex-col rounded-[6px] border p-7 ${destaque ? "order-first lg:order-none" : ""}`}
                  style={{
                    borderColor: destaque ? "rgba(203,163,92,0.55)" : "var(--color-line)",
                    background: destaque
                      ? "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))"
                      : "var(--color-card)",
                  }}
                >
                  {destaque && (
                    <span className="absolute -top-2.5 left-7 rounded-[2px] bg-accent px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-accent-ink">
                      Mais contratado
                    </span>
                  )}

                  <h2 className="font-display text-[26px] text-ink">{plano.nome}</h2>
                  {plano.descricao && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{plano.descricao}</p>
                  )}

                  <p className="mt-5 text-[32px] font-semibold leading-none text-ink" style={{ letterSpacing: "-0.02em" }}>
                    {formatoMoeda.format(preco)}
                    <span className="text-[15px] font-normal text-ink-soft">/mês</span>
                  </p>
                  <p className="mt-1.5 text-[13px] text-accent">
                    {formatoMoeda.format(noPix)} no Pix · 6% de desconto
                  </p>

                  {/* Divisao de responsabilidade: sessoes e bonus sao
                      DERIVADOS dos campos do plano (limiteAgendamentos,
                      incluiBonus) — sao a verdade do sistema. `beneficios`
                      e texto livre pro Victor escrever o que o sistema nao
                      sabe. Ter as duas coisas dizendo a mesma coisa duplicou
                      "1 sessao por mes" na tela (defeito visto em producao). */}
                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {plano.limiteAgendamentos != null && (
                      <ItemPlano incluido>
                        {plano.limiteAgendamentos >= 999
                          ? "Sessões 1-on-1 ilimitadas"
                          : `${plano.limiteAgendamentos} ${plano.limiteAgendamentos === 1 ? "sessão" : "sessões"} 1-on-1 por mês`}
                      </ItemPlano>
                    )}
                    {plano.beneficios.map((b) => (
                      <ItemPlano key={b} incluido>
                        {b}
                      </ItemPlano>
                    ))}
                    {/* Item nao incluido: esmaecido, NUNCA riscado (handoff) */}
                    <ItemPlano incluido={plano.incluiBonus}>
                      {plano.incluiBonus ? "Acesso a todas as masterclasses bônus" : "Masterclasses bônus"}
                    </ItemPlano>
                  </ul>

                  <Link
                    href="/cadastro"
                    className="mt-7 rounded-[2px] px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.14em]"
                    style={
                      destaque
                        ? { background: "var(--color-accent)", color: "var(--color-accent-ink)" }
                        : { border: "1px solid var(--color-line)", color: "var(--color-ink)" }
                    }
                  >
                    Assinar
                  </Link>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-10 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
          Sem fidelidade. Cancele ou troque de nível quando quiser — o upgrade é proporcional
          ao mês em curso.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-5 text-[13px]">
          <Link href="/login" className="text-accent hover:text-accent-hover">
            Já sou mentorado — entrar
          </Link>
        </div>
      </main>
    </div>
  );
}

function ItemPlano({ incluido, children }: { incluido: boolean; children: React.ReactNode }) {
  return (
    <li
      className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
      style={{ color: incluido ? "var(--color-ink-soft)" : "var(--color-ink-faint)" }}
    >
      <span
        className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
        style={{ background: incluido ? "var(--color-accent)" : "var(--color-ink-faint)" }}
      />
      {children}
    </li>
  );
}
