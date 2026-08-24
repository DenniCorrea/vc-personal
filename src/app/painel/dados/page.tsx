import Link from "next/link";
import { exigirSessao } from "@/lib/auth-guard";
import { solicitarExclusaoConta } from "./actions";

export default async function PaginaMeusDados() {
  await exigirSessao();

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Privacidade
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Seus dados</h1>
      <p className="mt-2 text-ink-soft">
        Conforme a LGPD, você pode baixar tudo que guardamos sobre você, ou pedir a exclusão da
        sua conta.
      </p>

      <a
        href="/api/meus-dados"
        className="mt-6 inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent"
      >
        Baixar meus dados
      </a>

      <div className="mt-8 rounded-lg border border-line bg-paper-raised p-4">
        <p className="text-sm font-medium text-ink">Excluir minha conta</p>
        <p className="mt-1 text-sm text-ink-soft">
          Sua conta é desativada imediatamente e o Victor recebe um aviso pra apagar seus dados
          definitivamente, exceto o que a lei exigir manter (ex: registro de pagamento pra
          contabilidade). Essa ação desconecta você agora.
        </p>
        <form action={solicitarExclusaoConta} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-warn px-4 py-2 text-sm font-medium text-warn hover:bg-warn hover:text-accent-ink"
          >
            Solicitar exclusão da conta
          </button>
        </form>
      </div>

      <Link href="/painel" className="mt-8 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
