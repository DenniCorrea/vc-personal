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
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Privacidade e segurança
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Seus dados</h1>

      {session.user.role !== "ADMIN" && (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/painel/agenda" className="text-sm font-medium text-accent">
            Agenda
          </Link>
          <Link href="/painel/videos" className="text-sm font-medium text-accent">
            Vídeos
          </Link>
          <Link href="/painel/alertas" className="text-sm font-medium text-accent">
            Alertas
          </Link>
          <Link href="/painel/habitos" className="text-sm font-medium text-accent">
            Água, sono e mentalidade
          </Link>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4 rounded-lg border border-line bg-paper-raised p-4">
        {usuario?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={usuario.avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full border border-accent object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent text-lg text-accent">
            {usuario?.nome.charAt(0).toUpperCase()}
          </div>
        )}
        <form action={enviarAvatar} className="flex flex-col gap-1">
          <input
            type="file"
            name="avatar"
            accept="image/*"
            required
            className="text-xs text-ink-soft file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent-ink"
          />
          <button type="submit" className="self-start text-xs font-medium text-accent">
            Salvar foto
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-paper-raised p-4">
        <p className="text-sm font-medium text-ink">Trocar senha</p>
        <TrocarSenhaForm />
      </div>

      <p className="mt-8 text-ink-soft">
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

      <form action={sair} className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-accent"
        >
          Sair
        </button>
      </form>

      <Link href="/painel" className="mt-6 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}
