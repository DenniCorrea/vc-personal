import Link from "next/link";
import { exigirPapel } from "@/lib/auth-guard";
import { trilhaDoUsuario } from "@/lib/trilha";

// Materiais (handoff: item da sidebar do mentorado). Nao e um repositorio
// separado — e a lista dos PDFs anexados as aulas que a pessoa JA pode ver,
// reunidos num lugar so. Reusa `trilhaDoUsuario`, entao a mesma regra de
// plano e prazo vale aqui: material de aula expirada some junto.
export default async function PaginaMateriais() {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  const { semPlano, modulos } = await trilhaDoUsuario(session.user.id);

  const materiais = modulos.flatMap((m) =>
    m.aulas
      .filter((a) => a.materialUrl)
      .map((a) => ({ moduloTitulo: m.titulo, aulaId: a.id, aulaTitulo: a.titulo, url: a.materialUrl! })),
  );

  return (
    <main className="pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[32px] text-ink md:text-[36px]">Materiais</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-soft">
        Todo material de apoio das aulas que você tem acesso, reunido aqui.
      </p>

      {semPlano ? (
        <div className="mt-6 max-w-md">
          <p className="text-[14px] text-ink-soft">Assine um plano de mentoria pra acessar os materiais.</p>
          <Link href="/painel/planos" className="mt-3 inline-block text-[13px] font-medium text-accent">
            Ver planos
          </Link>
        </div>
      ) : materiais.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">Nenhum material disponível ainda.</p>
        </div>
      ) : (
        <div className="mt-6 flex max-w-2xl flex-col gap-2">
          {materiais.map((m) => (
            <div
              key={m.aulaId}
              className="flex flex-wrap items-center gap-4 rounded-[4px] border border-line bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                  {m.moduloTitulo}
                </p>
                <p className="mt-0.5 text-[14px] text-ink">{m.aulaTitulo}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href={`/painel/aula/${m.aulaId}`} className="text-[12px] text-ink-soft hover:text-ink">
                  Ver aula
                </Link>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[2px] border border-accent-border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent"
                >
                  Abrir
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
