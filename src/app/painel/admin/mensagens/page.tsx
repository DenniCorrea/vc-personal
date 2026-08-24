import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoMensagem } from "./actions";

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function PaginaAdminMensagens() {
  await exigirPapel("ADMIN");

  const mensagens = await prisma.mensagemMentalidade.findMany({ orderBy: { publicadoEm: "desc" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Mensagens de mentalidade</h1>
      <p className="mt-2 text-sm text-ink-soft">
        A mais recente cuja data já passou é a que aparece pra todo mundo — mesma lógica de
        agendamento do conteúdo da mentoria.
      </p>

      <Link
        href="/painel/admin/mensagens/novo"
        className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        + Nova mensagem
      </Link>

      <ul className="mt-6 flex flex-col gap-2">
        {mensagens.map((mensagem) => {
          const agendada = mensagem.publicadoEm > new Date();
          return (
            <li
              key={mensagem.id}
              className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
            >
              <div>
                <p className="text-ink">
                  {mensagem.texto}{" "}
                  {!mensagem.ativo && <span className="text-xs text-ink-soft">(inativa)</span>}
                </p>
                <p className="text-sm text-ink-soft">
                  {mensagem.frequencia === "DIARIA" ? "Diária" : "Semanal"} ·{" "}
                  {agendada ? "agendada pra" : "publicada em"} {formatoData.format(mensagem.publicadoEm)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/painel/admin/mensagens/${mensagem.id}`} className="text-sm font-medium text-accent">
                  Editar
                </Link>
                <form action={alternarAtivoMensagem.bind(null, mensagem.id, !mensagem.ativo)}>
                  <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                    {mensagem.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
              </div>
            </li>
          );
        })}
        {mensagens.length === 0 && <p className="text-sm text-ink-soft">Nenhuma mensagem ainda.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
