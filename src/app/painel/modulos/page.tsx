import Link from "next/link";
import { exigirPapel } from "@/lib/auth-guard";
import { trilhaDoUsuario } from "@/lib/trilha";

const ROTULO_PILAR: Record<string, string> = {
  POSICIONAMENTO: "Posicionamento",
  ABORDAGEM: "Abordagem",
  MAPEAMENTO: "Mapeamento",
  VENDAS: "Vendas",
  FIDELIZACAO: "Fidelização",
};

// Grade de modulos (handoff, tela 5c). Numero do modulo em serif grande e
// translucido sobre a capa, barra de progresso de 2px na base, e uma acao
// contextual que muda conforme o andamento (Comecar / Continuar / Rever).
export default async function PaginaModulos() {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  const { semPlano, modulos } = await trilhaDoUsuario(session.user.id);

  if (semPlano) {
    return (
      <main className="max-w-md pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Módulos</p>
        <h1 className="font-display mt-1 text-[28px] text-ink">Você ainda não tem acesso</h1>
        <p className="mt-2 text-[14px] text-ink-soft">Assine um plano de mentoria pra desbloquear a trilha.</p>
        <Link href="/painel/planos" className="mt-4 inline-block text-[13px] font-medium text-accent">
          Ver planos
        </Link>
      </main>
    );
  }

  const totalAulas = modulos.reduce((s, m) => s + m.aulas.length, 0);
  const totalConcluidas = modulos.reduce(
    (s, m) => s + m.aulas.filter((a) => a.meuProgresso?.concluida).length,
    0,
  );

  return (
    <main className="pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-[32px] text-ink md:text-[36px]">Módulos</h1>
        {totalAulas > 0 && (
          <p className="text-[13px] text-ink-soft">
            {totalConcluidas} de {totalAulas} aulas concluídas
          </p>
        )}
      </div>

      {modulos.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">
            Nenhuma aula publicada ainda. Assim que o Victor liberar o primeiro módulo, ele
            aparece aqui.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modulos.map((m, i) => {
            const concluidas = m.aulas.filter((a) => a.meuProgresso?.concluida).length;
            const pct = Math.round((concluidas / m.aulas.length) * 100);
            const emAndamento = concluidas > 0 && concluidas < m.aulas.length;
            // Onde a pessoa parou: primeira aula nao concluida; se todas
            // estao concluidas, volta pra primeira (modo revisao).
            const proxima = m.aulas.find((a) => !a.meuProgresso?.concluida) ?? m.aulas[0];

            return (
              <Link
                key={m.id}
                href={`/painel/aula/${proxima.id}`}
                className="flex flex-col overflow-hidden rounded-[4px] border transition-colors"
                style={{
                  borderColor: emAndamento ? "var(--color-accent-border)" : "var(--color-line)",
                  background: emAndamento
                    ? "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))"
                    : "var(--color-card)",
                }}
              >
                {/* Capa hachurada — placeholder ate ter arte de verdade
                    (o proprio handoff marca thumbnail como asset pendente). */}
                <div
                  className="relative flex h-[120px] items-center justify-center"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, #1E1913 0 8px, #16130F 8px 16px)",
                  }}
                >
                  <span
                    className="font-display text-[52px] leading-none"
                    style={{ color: "rgba(203,163,92,0.28)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: "rgba(232,227,218,0.12)" }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    {ROTULO_PILAR[m.pilar]}
                  </p>
                  <h2 className="font-display mt-1 text-[23px] leading-tight text-ink">{m.titulo}</h2>
                  {m.descricao && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{m.descricao}</p>
                  )}
                  <div className="mt-auto flex items-baseline justify-between pt-4">
                    <span className="text-[12px] text-ink-soft">
                      {concluidas} de {m.aulas.length} aulas
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                      {concluidas === 0 ? "Começar" : emAndamento ? "Continuar" : "Rever"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
