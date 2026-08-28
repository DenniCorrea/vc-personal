import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoConteudo } from "./actions";
import { formatador } from "@/lib/data";

const ROTULO_PILAR: Record<string, string> = {
  POSICIONAMENTO: "Posicionamento",
  ABORDAGEM: "Abordagem",
  MAPEAMENTO: "Mapeamento",
  VENDAS: "Vendas",
  FIDELIZACAO: "Fidelização",
};

const formatoData = formatador({ day: "2-digit", month: "2-digit", year: "numeric" });

export default async function PaginaAdminConteudoMentoria() {
  await exigirPapel("ADMIN");

  const conteudos = await prisma.conteudoConsultoria.findMany({
    orderBy: [{ pilar: "asc" }, { publicadoEm: "desc" }],
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Conteúdo da mentoria</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Conteúdo com data de publicação no futuro fica escondido do mentorado até chegar o dia —
        dá pra agendar o vídeo da semana com antecedência.
      </p>

      <Link
        href="/painel/admin/conteudo-mentoria/novo"
        className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        + Novo conteúdo
      </Link>

      <ul className="mt-6 flex flex-col gap-2">
        {conteudos.map((conteudo) => {
          const agendado = conteudo.publicadoEm > new Date();
          return (
            <li
              key={conteudo.id}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">
                  {conteudo.titulo}{" "}
                  {!conteudo.ativo && <span className="text-xs font-normal text-ink-soft">(inativo)</span>}
                </p>
                <p className="text-sm text-ink-soft">
                  {ROTULO_PILAR[conteudo.pilar]} · {conteudo.tipo === "SEMANAL" ? "Semanal" : "Padrão"} ·{" "}
                  {agendado
                    ? `agendado pra ${formatoData.format(conteudo.publicadoEm)}`
                    : `publicado em ${formatoData.format(conteudo.publicadoEm)}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/painel/admin/conteudo-mentoria/${conteudo.id}`}
                  className="text-sm font-medium text-accent"
                >
                  Editar
                </Link>
                <form action={alternarAtivoConteudo.bind(null, conteudo.id, !conteudo.ativo)}>
                  <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                    {conteudo.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
              </div>
            </li>
          );
        })}
        {conteudos.length === 0 && <p className="text-sm text-ink-soft">Nenhum conteúdo cadastrado ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
