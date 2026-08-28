import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoData = formatador({ day: "2-digit", month: "2-digit" });

const ROTULO_METODO: Record<string, string> = { CARTAO: "Cartão recorrente", DEBITO: "Débito", PIX: "Pix" };

// Planos e receita (handoff, tela 6f — metade de receita; a agenda fica em
// /painel/admin/horarios, que ja existia e cobre o mesmo trabalho).
export default async function PaginaReceita() {
  await exigirPapel("ADMIN");

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [assinaturas, pagamentosDoMes, falhas, planos] = await Promise.all([
    prisma.assinatura.findMany({
      where: { status: "ATIVA", plano: { produto: "MENTORIA" } },
      include: { plano: { select: { nome: true, preco: true } } },
    }),
    prisma.pagamento.findMany({
      where: { status: "APROVADO", criadoEm: { gte: inicioDoMes } },
      select: { metodo: true, valorFinal: true },
    }),
    prisma.pagamento.findMany({
      where: { status: "RECUSADO" },
      orderBy: { criadoEm: "desc" },
      take: 10,
      include: { usuario: { select: { id: true, nome: true } } },
    }),
    prisma.plano.findMany({
      where: { produto: "MENTORIA", ativo: true },
      orderBy: { preco: "asc" },
      select: { id: true, nome: true, preco: true },
    }),
  ]);

  const mrr = assinaturas.reduce((s, a) => s + Number(a.plano.preco), 0);

  // Assinaturas por plano — quantas e quanto cada um traz.
  const porPlano = planos.map((p) => {
    const doPlano = assinaturas.filter((a) => a.plano.nome === p.nome);
    return { nome: p.nome, quantidade: doPlano.length, total: doPlano.length * Number(p.preco) };
  });
  const maiorTotal = Math.max(1, ...porPlano.map((p) => p.total));

  // Mix de metodo de pagamento no mes.
  const totalMes = pagamentosDoMes.reduce((s, p) => s + Number(p.valorFinal), 0);
  const porMetodo = (["PIX", "CARTAO", "DEBITO"] as const).map((m) => {
    const soma = pagamentosDoMes
      .filter((p) => p.metodo === m)
      .reduce((s, p) => s + Number(p.valorFinal), 0);
    return { metodo: m, soma, pct: totalMes > 0 ? Math.round((soma / totalMes) * 100) : 0 };
  });

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Planos e receita</h1>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <section
            className="rounded-[4px] border border-accent-border p-6"
            style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Receita recorrente
            </p>
            <p
              className="mt-2 text-[34px] font-semibold leading-none text-accent"
              style={{ letterSpacing: "-0.02em" }}
            >
              {formatoMoeda.format(mrr)}
            </p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {assinaturas.length} assinatura{assinaturas.length === 1 ? "" : "s"} ativa
              {assinaturas.length === 1 ? "" : "s"} · previsto por mês
            </p>
          </section>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Por plano
          </p>
          <div className="mt-3 flex flex-col gap-4">
            {porPlano.map((p) => (
              <div key={p.nome}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[14px] text-ink">
                    {p.nome} <span className="text-ink-soft">· {p.quantidade}</span>
                  </p>
                  <p className="text-[13px] font-medium text-accent">{formatoMoeda.format(p.total)}</p>
                </div>
                <div className="mt-1.5 h-[3px] w-full rounded-full" style={{ background: "rgba(232,227,218,0.12)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(p.total / maiorTotal) * 100}%`, background: "var(--color-accent)" }}
                  />
                </div>
              </div>
            ))}
            {porPlano.every((p) => p.quantidade === 0) && (
              <p className="text-[13px] text-ink-soft">Nenhuma assinatura ativa ainda.</p>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[4px] border border-line bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Como pagam este mês
            </p>
            {totalMes === 0 ? (
              <p className="mt-3 text-[13px] text-ink-soft">Nenhum pagamento aprovado neste mês.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2.5">
                {porMetodo.map((m) => (
                  <div key={m.metodo} className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-soft">
                      {ROTULO_METODO[m.metodo]}
                      {m.metodo === "PIX" && <span className="ml-1.5 text-accent">6% off</span>}
                    </span>
                    <span className="text-ink">{m.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="rounded-[4px] border p-5"
            style={{
              borderColor: falhas.length > 0 ? "var(--color-warn)" : "var(--color-line)",
              background: falhas.length > 0 ? "var(--color-warn-wash)" : "var(--color-card)",
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: falhas.length > 0 ? "var(--color-warn)" : "var(--color-ink-subtle)" }}
            >
              Falhas a resolver: {falhas.length}
            </p>
            {falhas.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-soft">Nenhuma cobrança recusada.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {falhas.map((f) => (
                  <Link
                    key={f.id}
                    href={`/painel/admin/conversas/${f.usuario.id}`}
                    className="flex items-baseline justify-between text-[13px] hover:text-ink"
                  >
                    <span className="text-ink">{f.usuario.nome}</span>
                    <span className="text-ink-soft">
                      {formatoMoeda.format(Number(f.valorFinal))} · {formatoData.format(f.criadoEm)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Link
            href="/painel/admin/planos"
            className="rounded-[2px] border border-line px-4 py-2.5 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-accent-border"
          >
            Editar planos
          </Link>
        </aside>
      </div>

      {/* Honestidade: upgrades/cancelamentos do mes e o "+8% vs. julho" do
          handoff exigem historico de mudanca de plano, que o schema nao
          guarda (a Assinatura so tem o plano ATUAL). Dizer isso e melhor
          do que mostrar um numero inventado. */}
      <p className="mt-8 text-[12px] leading-relaxed text-ink-faint">
        Comparativo com o mês anterior e histórico de upgrades ainda não aparecem: seriam
        precisos registros de mudança de plano, que hoje não são guardados.
      </p>
    </main>
  );
}
