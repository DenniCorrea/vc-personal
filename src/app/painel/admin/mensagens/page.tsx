import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { alternarAtivoMensagem } from "./actions";

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export default async function PaginaAdminMensagens() {
  await exigirPapel("ADMIN");

  const mensagens = await prisma.mensagemMentalidade.findMany({ orderBy: { publicadoEm: "desc" } });
  const agora = new Date();
  const atual = mensagens.find((m) => m.ativo && m.publicadoEm <= agora);
  const proximas = mensagens.filter((m) => m.ativo && m.publicadoEm > agora).sort((a, b) => a.publicadoEm.getTime() - b.publicadoEm.getTime());

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Mentalidade do dia</p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="font-display text-[30px] text-ink">Mensagem para todos os alunos</h1>
        <Link
          href="/painel/admin/mensagens/novo"
          className="rounded-[2px] bg-accent px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
        >
          Agendar publicação
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_320px] gap-6">
        <div
          className="rounded-[4px] border border-accent-border p-6"
          style={{ background: "linear-gradient(160deg, rgba(203,163,92,0.08), rgba(203,163,92,0.02))" }}
        >
          {atual ? (
            <>
              <p className="font-display text-[22px] italic leading-[1.4] text-ink">{atual.texto}</p>
              <p className="mt-6 text-[12px] text-ink-faint">
                Publicada em {formatoData.format(atual.publicadoEm)} · {atual.frequencia === "DIARIA" ? "Diária" : "Semanal"}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-ink-soft">Nenhuma mensagem ativa publicada ainda.</p>
          )}
        </div>

        <div className="rounded-[4px] border border-line bg-card-admin p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">Próximas</p>
          <div className="mt-3 flex flex-col gap-3">
            {proximas.map((m) => (
              <div key={m.id}>
                <p className="text-[12px] text-ink-faint">{formatoData.format(m.publicadoEm)}</p>
                <p className="text-[13px] text-ink">&ldquo;{m.texto}&rdquo;</p>
              </div>
            ))}
            {proximas.length === 0 && <p className="text-[12px] text-ink-faint">Nenhuma agendada.</p>}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">Todas</p>
        <ul className="mt-3 flex flex-col gap-2">
          {mensagens.map((mensagem) => {
            const agendada = mensagem.publicadoEm > agora;
            return (
              <li
                key={mensagem.id}
                className="flex items-center justify-between rounded-[4px] border border-line px-4 py-3"
              >
                <div>
                  <p className="text-[14px] text-ink">
                    {mensagem.texto}{" "}
                    {!mensagem.ativo && <span className="text-[12px] text-ink-faint">(inativa)</span>}
                  </p>
                  <p className="text-[12px] text-ink-soft">
                    {mensagem.frequencia === "DIARIA" ? "Diária" : "Semanal"} ·{" "}
                    {agendada ? "agendada pra" : "publicada em"} {formatoData.format(mensagem.publicadoEm)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/painel/admin/mensagens/${mensagem.id}`} className="text-[12px] font-medium text-accent">
                    Editar
                  </Link>
                  <form action={alternarAtivoMensagem.bind(null, mensagem.id, !mensagem.ativo)}>
                    <button type="submit" className="text-[12px] text-ink-soft hover:text-ink">
                      {mensagem.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
          {mensagens.length === 0 && <p className="text-[13px] text-ink-soft">Nenhuma mensagem ainda.</p>}
        </ul>
      </div>
    </main>
  );
}
