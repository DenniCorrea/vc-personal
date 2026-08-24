import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { concederCortesia, encerrarCortesia } from "./actions";

const ROTULO_STATUS: Record<string, string> = {
  PENDENTE: "Pendente de pagamento",
  ATIVA: "Ativa",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

export default async function PaginaAdminAssinaturas() {
  await exigirPapel("ADMIN");

  const [cortesias, usuarios, planos] = await Promise.all([
    prisma.assinatura.findMany({
      where: { cortesia: true, status: { not: "CANCELADA" } },
      include: { usuario: true, plano: true },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.usuario.findMany({
      where: { role: { in: ["ALUNO", "PERSONAL_PARCEIRO"] }, ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.plano.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
        Acesso cortesia (VIP / teste)
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Libera acesso sem cobrar — cliente VIP, período de teste, bonificação. Quando a data de
        renovação passar, o motor de alertas trata igual a uma assinatura vencida (você decide
        renovar a cortesia ou deixar vencer).
      </p>

      <form
        action={concederCortesia}
        className="mt-6 flex flex-col gap-3 rounded-lg border border-line bg-paper-raised p-4"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Pessoa
          <select
            name="usuarioId"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.role === "ALUNO" ? "aluno" : "mentorado"})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Plano
          <select
            name="planoId"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          >
            {planos.map((plano) => (
              <option key={plano.id} value={plano.id}>
                {plano.nome} ({plano.produto === "ALUNO" ? "aluno" : "mentoria"})
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-ink-soft">
            Escolha o plano do mesmo produto da pessoa (aluno → plano de aluno, mentorado → plano
            de mentoria).
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Válido até
          <input
            name="dataProximaRenovacao"
            type="date"
            required
            className="rounded-lg border border-line bg-paper px-3 py-2 text-base font-normal text-ink outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          className="mt-2 self-start rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink"
        >
          Conceder acesso
        </button>
      </form>

      <ul className="mt-8 flex flex-col gap-2">
        {cortesias.map((assinatura) => (
          <li
            key={assinatura.id}
            className="flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">
                {assinatura.usuario.nome} · {assinatura.plano.nome}
              </p>
              <p className="text-sm text-ink-soft">
                Cortesia · {ROTULO_STATUS[assinatura.status] ?? assinatura.status}
              </p>
            </div>
            <form action={encerrarCortesia.bind(null, assinatura.id)}>
              <button type="submit" className="text-sm text-ink-soft hover:text-ink">
                Encerrar
              </button>
            </form>
          </li>
        ))}
        {cortesias.length === 0 && <p className="text-sm text-ink-soft">Nenhuma cortesia ativa.</p>}
      </ul>

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
