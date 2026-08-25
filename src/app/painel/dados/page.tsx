import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth-guard";
import { solicitarExclusaoConta, enviarAvatar } from "./actions";
import { sair } from "../actions";
import { TrocarSenhaForm } from "./TrocarSenhaForm";

export default async function PaginaMeusDados() {
  const session = await exigirSessao();
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { nome: true, avatarUrl: true },
  });

  return (
    <main className="mx-auto max-w-md px-6 pt-cabecalho-aluno pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        Privacidade e segurança
      </p>
      <h1 className="font-display mt-1 text-[28px] text-ink">Seus dados</h1>

      <section className="mt-6 flex items-center gap-4 rounded-[4px] border border-line bg-card p-5">
        {usuario?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={usuario.avatarUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-accent object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent text-lg text-accent">
            {usuario?.nome.charAt(0).toUpperCase()}
          </div>
        )}
        <form action={enviarAvatar} className="flex flex-col gap-1.5">
          <input
            type="file"
            name="avatar"
            accept="image/*"
            required
            className="text-[12px] text-ink-soft file:mr-2 file:rounded-[2px] file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:uppercase file:text-accent-ink"
          />
          <button type="submit" className="self-start text-[12px] font-medium text-accent">
            Salvar foto
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Trocar senha</p>
        <TrocarSenhaForm />
      </section>

      <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">LGPD</p>
        <p className="mt-2 text-[13px] text-ink-soft">
          Você pode baixar tudo que guardamos sobre você, ou pedir a exclusão da sua conta.
        </p>
        <a
          href="/api/meus-dados"
          className="mt-3 inline-block rounded-[2px] border border-line px-4 py-2 text-[12px] font-medium text-ink hover:border-accent-border"
        >
          Baixar meus dados
        </a>
      </section>

      <section
        className="mt-4 rounded-[4px] border p-5"
        style={{ borderColor: "var(--color-warn)", background: "rgba(192,72,59,0.07)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-warn)" }}>
          Excluir minha conta
        </p>
        <p className="mt-2 text-[13px]" style={{ color: "var(--color-warn)" }}>
          Sua conta é desativada imediatamente e o Victor recebe um aviso pra apagar seus dados
          definitivamente, exceto o que a lei exigir manter (ex: registro de pagamento pra
          contabilidade). Essa ação desconecta você agora.
        </p>
        <form action={solicitarExclusaoConta} className="mt-3">
          <button
            type="submit"
            className="rounded-[2px] border px-4 py-2 text-[12px] font-medium"
            style={{ borderColor: "var(--color-warn)", color: "var(--color-warn)" }}
          >
            Solicitar exclusão da conta
          </button>
        </form>
      </section>

      {session.user.role !== "ADMIN" && (
        <section className="mt-4 rounded-[4px] border border-line bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Outros acessos</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/painel/agenda" className="text-[13px] font-medium text-accent">
              Agenda
            </Link>
            <Link href="/painel/videos" className="text-[13px] font-medium text-accent">
              Vídeos
            </Link>
            <Link href="/painel/alertas" className="text-[13px] font-medium text-accent">
              Alertas
            </Link>
            <Link href="/painel/habitos" className="text-[13px] font-medium text-accent">
              Água, sono e mentalidade
            </Link>
          </div>
        </section>
      )}

      <form action={sair} className="mt-6">
        <button
          type="submit"
          className="rounded-[2px] border border-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:border-accent-border"
        >
          Sair
        </button>
      </form>

      <Link href="/painel" className="mt-6 inline-block text-[13px] text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
