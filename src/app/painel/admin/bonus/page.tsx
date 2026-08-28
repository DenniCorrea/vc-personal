import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";
import { ContadorExpiracao } from "@/components/ContadorExpiracao";
import { excluirBonus } from "./actions";

const formatoJanela = formatador({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Gestao de bonus (handoff, tela 6c). A tabela usa minmax na coluna de
// titulo de proposito — o proprio handoff registra que sem isso ela
// colapsa e a tabela vaza do container.
export default async function PaginaAdminBonus() {
  await exigirPapel("ADMIN");

  const bonus = await prisma.bonus.findMany({
    orderBy: { expiraEm: "desc" },
    include: { video: { select: { titulo: true } } },
  });

  const agora = Date.now();

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
          <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Bônus e masterclasses</h1>
        </div>
        <Link
          href="/painel/admin/bonus/novo"
          className="rounded-[2px] bg-accent px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
        >
          Novo bônus
        </Link>
      </div>

      {bonus.length === 0 ? (
        <div className="mt-8 rounded-[4px] border border-line bg-card p-8">
          <h2 className="font-display text-[22px] text-ink">Nenhum bônus ainda</h2>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-ink-soft">
            Bônus são conteúdos com prazo. O mentorado vê um contador regressivo e o conteúdo
            some da biblioteca dele quando a janela fecha — é o que cria a urgência.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[4px] border border-line">
          <table className="w-full border-collapse text-left" style={{ minWidth: 720 }}>
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-4 py-3" style={{ minWidth: 200 }}>Bônus</th>
                <th className="px-4 py-3 w-[190px]">Janela</th>
                <th className="px-4 py-3 w-[120px]">Restante</th>
                <th className="px-4 py-3 w-[110px]">Estado</th>
                <th className="px-4 py-3 w-[120px]"></th>
              </tr>
            </thead>
            <tbody>
              {bonus.map((b) => {
                const expirado = b.expiraEm.getTime() <= agora;
                const aindaNaoAbriu = b.liberaEm.getTime() > agora;
                return (
                  <tr
                    key={b.id}
                    className="border-b border-line last:border-0"
                    style={{
                      opacity: expirado ? 0.5 : 1,
                      background: b.destaque && !expirado ? "var(--color-accent-wash)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-[15px] text-ink">
                        {b.titulo}
                        {b.destaque && !expirado && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                            destaque
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">
                        {b.video ? b.video.titulo : "sem vídeo"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12px] text-ink-soft">
                      {formatoJanela.format(b.liberaEm)}
                      <span className="mx-1">–</span>
                      {formatoJanela.format(b.expiraEm)}
                    </td>
                    <td className="px-4 py-3.5">
                      {expirado ? (
                        <span className="font-mono text-[12px] text-ink-faint">—</span>
                      ) : (
                        <ContadorExpiracao
                          expiraEmIso={b.expiraEm.toISOString()}
                          className="font-mono text-[12px]"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]">
                      {expirado ? (
                        <span className="text-ink-faint">Expirado</span>
                      ) : aindaNaoAbriu ? (
                        <span className="text-ink-soft">Agendado</span>
                      ) : (
                        <span className="text-accent">No ar</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/painel/admin/bonus/${b.id}`} className="text-[12px] font-medium text-accent">
                          Editar
                        </Link>
                        <form action={excluirBonus.bind(null, b.id)}>
                          <button type="submit" className="text-[12px] text-ink-soft hover:text-warn">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
        Só quem tem plano com bônus incluído enxerga estes conteúdos. Configure isso em{" "}
        <Link href="/painel/admin/planos" className="text-accent">
          Planos
        </Link>
        .
      </p>
    </main>
  );
}
