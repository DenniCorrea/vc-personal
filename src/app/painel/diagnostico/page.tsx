import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { responderDiagnostico } from "./actions";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Diagnostico do mentorado. Na primeira vez e o onboarding (a plataforma
// deixa de ser uma tela vazia no dia 1); depois vira "atualizar meus
// numeros", que e o que transforma a mentoria em resultado mensuravel.
export default async function PaginaDiagnostico() {
  const session = await exigirPapel("PERSONAL_PARCEIRO");
  const d = await prisma.diagnostico.findUnique({ where: { usuarioId: session.user.id } });

  const primeiraVez = !d;
  const evoluiu =
    d?.ticketAtual != null && Number(d.ticketAtual) !== Number(d.ticketInicial);
  const variacao = evoluiu
    ? Math.round(((Number(d!.ticketAtual) - Number(d!.ticketInicial)) / Number(d!.ticketInicial)) * 100)
    : null;

  return (
    <main className="max-w-2xl pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        {primeiraVez ? "Antes de começar" : "Seus números"}
      </p>
      <h1 className="font-display mt-1 text-[30px] leading-tight text-ink md:text-[34px]">
        {primeiraVez ? "Onde você está hoje" : "Atualize onde você está"}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        {primeiraVez
          ? "Três perguntas. É o ponto de partida — daqui a alguns meses, é contra isso que a gente compara o seu resultado."
          : "Mantenha atualizado. A comparação com o seu ponto de partida é o que mostra o que a mentoria mudou."}
      </p>

      {evoluiu && d && (
        <section
          className="mt-6 rounded-[4px] border border-accent-border p-5"
          style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.11), rgba(203,163,92,0.02))" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Sua evolução</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span className="text-[18px] text-ink-soft">
              {formatoMoeda.format(Number(d.ticketInicial))}
            </span>
            <span className="text-ink-faint">→</span>
            <span className="text-[26px] font-semibold text-accent">
              {formatoMoeda.format(Number(d.ticketAtual))}
            </span>
            {variacao !== null && variacao !== 0 && (
              <span className="text-[15px] font-medium text-accent">
                {variacao > 0 ? "+" : ""}
                {variacao}%
              </span>
            )}
          </div>
          {d.alunosAtual != null && (
            <p className="mt-1.5 text-[13px] text-ink-soft">
              {d.alunosInicial} → {d.alunosAtual} alunos
            </p>
          )}
        </section>
      )}

      <form action={responderDiagnostico} className="mt-6 flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
            Quanto você cobra por mês, por aluno? (R$)
            <input
              name="ticket"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={d?.ticketAtual != null ? String(d.ticketAtual) : ""}
              placeholder="ex: 480"
              className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            />
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
            Quantos alunos ativos você tem hoje?
            <input
              name="alunos"
              type="number"
              min={0}
              required
              defaultValue={d?.alunosAtual != null ? String(d.alunosAtual) : ""}
              placeholder="ex: 12"
              className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
              style={{ background: "var(--color-input)" }}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Qual o seu maior gargalo hoje?
          <textarea
            name="maiorGargalo"
            rows={4}
            required
            defaultValue={d?.maiorGargalo ?? ""}
            placeholder="ex: consigo alunos, mas não consigo aumentar o preço sem perder gente."
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
          <span className="text-[12px] font-normal text-ink-soft">
            O Victor lê isso antes da sua primeira sessão.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-[2px] bg-accent px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-ink hover:bg-accent-hover"
          >
            {primeiraVez ? "Começar a mentoria" : "Atualizar meus números"}
          </button>
          {!primeiraVez && (
            <Link href="/painel" className="text-[13px] text-ink-soft hover:text-ink">
              Voltar
            </Link>
          )}
        </div>
      </form>
    </main>
  );
}
