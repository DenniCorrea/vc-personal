import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";
import { moverModulo, alternarAtivoModulo, moverAula, excluirAula } from "./actions";

const formatoData = formatador({ day: "2-digit", month: "2-digit" });

const ROTULO_PILAR: Record<string, string> = {
  POSICIONAMENTO: "Posicionamento",
  ABORDAGEM: "Abordagem",
  MAPEAMENTO: "Mapeamento",
  VENDAS: "Vendas",
  FIDELIZACAO: "Fidelização",
};

const ROTULO_STATUS: Record<string, { texto: string; cor: string }> = {
  PUBLICADA: { texto: "Publicada", cor: "var(--color-accent)" },
  AGENDADA: { texto: "Agendada", cor: "var(--color-ink-soft)" },
  RASCUNHO: { texto: "Rascunho", cor: "var(--color-ink-faint)" },
};

// Gestao da trilha (handoff_mentoria_b2b_metodo_lider, tela 6b).
// Reordenacao por SETAS e nao por arraste: arraste exige biblioteca de
// drag-and-drop e nao funciona bem no celular (o proprio RESPONSIVE.md diz
// pra esconder arraste abaixo de 768px). Setas funcionam igual nos dois e
// resolvem o mesmo problema — a ordem aqui e a ordem que o mentorado ve.
export default async function PaginaTrilha({ searchParams }: PageProps<"/painel/admin/trilha">) {
  await exigirPapel("ADMIN");
  const { modulo: moduloSelecionadoId } = await searchParams;

  const modulos = await prisma.modulo.findMany({
    orderBy: { ordem: "asc" },
    include: { _count: { select: { aulas: true } } },
  });

  const selecionadoId = typeof moduloSelecionadoId === "string" ? moduloSelecionadoId : modulos[0]?.id;

  const aulas = selecionadoId
    ? await prisma.aula.findMany({
        where: { moduloId: selecionadoId },
        orderBy: { ordem: "asc" },
        include: { video: { select: { titulo: true } }, planosVisiveis: { select: { nome: true } } },
      })
    : [];

  const selecionado = modulos.find((m) => m.id === selecionadoId);

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
          <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Trilha de conteúdo</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/painel/admin/trilha/modulo/novo"
            className="rounded-[2px] border border-line px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-accent-border"
          >
            Novo módulo
          </Link>
          {modulos.length > 0 && (
            <Link
              href={`/painel/admin/trilha/aula/novo?modulo=${selecionadoId}`}
              className="rounded-[2px] bg-accent px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
            >
              Nova aula
            </Link>
          )}
        </div>
      </div>

      {modulos.length === 0 ? (
        <div className="mt-8 rounded-[4px] border border-line bg-card p-8">
          <h2 className="font-display text-[22px] text-ink">Nenhum módulo ainda</h2>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-ink-soft">
            Um módulo agrupa as aulas de um pilar (Posicionamento, Vendas...). Crie o
            primeiro para começar a montar a trilha que o mentorado vai ver.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Modulos */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">Módulos</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {modulos.map((m, i) => {
                const ativo = m.id === selecionadoId;
                return (
                  <div
                    key={m.id}
                    className="rounded-[3px] border p-3"
                    style={{
                      background: ativo ? "var(--color-accent-wash)" : "var(--color-card)",
                      borderColor: ativo ? "var(--color-accent-border)" : "var(--color-line)",
                      borderLeftWidth: ativo ? 2 : 1,
                      borderLeftColor: ativo ? "var(--color-accent)" : "var(--color-line)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/painel/admin/trilha?modulo=${m.id}`} className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                          {ROTULO_PILAR[m.pilar]}
                        </p>
                        <p className="mt-0.5 truncate text-[14px] font-medium text-ink">{m.titulo}</p>
                        <p className="mt-0.5 text-[12px] text-ink-soft">
                          {m._count.aulas} {m._count.aulas === 1 ? "aula" : "aulas"}
                          {!m.ativo && " · oculto"}
                        </p>
                      </Link>
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <form action={moverModulo.bind(null, m.id, "cima")}>
                          <BotaoSeta direcao="cima" desabilitado={i === 0} />
                        </form>
                        <form action={moverModulo.bind(null, m.id, "baixo")}>
                          <BotaoSeta direcao="baixo" desabilitado={i === modulos.length - 1} />
                        </form>
                      </div>
                    </div>
                    {ativo && (
                      <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2.5">
                        <Link
                          href={`/painel/admin/trilha/modulo/${m.id}`}
                          className="text-[12px] font-medium text-accent"
                        >
                          Editar
                        </Link>
                        <form action={alternarAtivoModulo.bind(null, m.id, !m.ativo)}>
                          <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                            {m.ativo ? "Ocultar" : "Mostrar"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
              A ordem aqui é a ordem que o mentorado vê.
            </p>
          </div>

          {/* Aulas do modulo selecionado */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              Aulas {selecionado && `· ${selecionado.titulo}`}
            </p>

            {aulas.length === 0 ? (
              <div className="mt-3 rounded-[4px] border border-line bg-card p-6">
                <p className="text-[13px] text-ink-soft">
                  Esse módulo ainda não tem aula. Use &quot;Nova aula&quot; acima.
                </p>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-[4px] border border-line">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      <th className="px-3 py-3 w-[70px]">Ordem</th>
                      <th className="px-3 py-3">Aula</th>
                      <th className="px-3 py-3 w-[130px]">Acesso</th>
                      <th className="px-3 py-3 w-[110px]">Estado</th>
                      <th className="px-3 py-3 w-[120px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulas.map((a, i) => (
                      <tr key={a.id} className="border-b border-line last:border-0 hover:bg-accent-wash">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <form action={moverAula.bind(null, a.id, "cima")}>
                              <BotaoSeta direcao="cima" desabilitado={i === 0} />
                            </form>
                            <form action={moverAula.bind(null, a.id, "baixo")}>
                              <BotaoSeta direcao="baixo" desabilitado={i === aulas.length - 1} />
                            </form>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[14px] text-ink">{a.titulo}</p>
                          <p className="mt-0.5 text-[12px] text-ink-soft">
                            {a.video ? a.video.titulo : "sem vídeo"}
                            {a.planosVisiveis.length > 0
                              ? ` · ${a.planosVisiveis.map((p) => p.nome).join(", ")}`
                              : " · nenhum plano marcado"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-[13px] text-ink-soft">
                          {a.prazoAcessoDias ? `${a.prazoAcessoDias} dias` : "sem prazo"}
                          {a.publicadoEm && (
                            <span className="block text-[11px] text-ink-faint">
                              desde {formatoData.format(a.publicadoEm)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[13px]" style={{ color: ROTULO_STATUS[a.status].cor }}>
                          {ROTULO_STATUS[a.status].texto}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/painel/admin/trilha/aula/${a.id}`}
                              className="text-[12px] font-medium text-accent"
                            >
                              Editar
                            </Link>
                            <form action={excluirAula.bind(null, a.id)}>
                              <button type="submit" className="text-[12px] text-ink-soft hover:text-warn">
                                Excluir
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Dependencia honesta: o handoff pede upload de video direto
                aqui (arrastar MP4 ate 4GB). Isso exige credencial de API do
                Vimeo, que depende de resolver de quem e a conta — enquanto
                isso, o caminho e o que ja funciona. */}
            <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
              O vídeo é cadastrado antes em{" "}
              <Link href="/painel/admin/videos" className="text-accent">
                Vídeos
              </Link>{" "}
              (upload no Vimeo, cola o ID aqui). Upload direto pelo painel depende de
              definir a titularidade da conta do Vimeo.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function BotaoSeta({ direcao, desabilitado }: { direcao: "cima" | "baixo"; desabilitado: boolean }) {
  return (
    <button
      type="submit"
      disabled={desabilitado}
      aria-label={direcao === "cima" ? "Mover para cima" : "Mover para baixo"}
      className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-line text-ink-soft hover:border-accent-border hover:text-ink disabled:opacity-30"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        {direcao === "cima" ? <path d="M5 15l7-7 7 7" /> : <path d="M19 9l-7 7-7-7" />}
      </svg>
    </button>
  );
}
