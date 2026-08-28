import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { paraInputDate, formatador } from "@/lib/data";
import { salvarBonus } from "../actions";
import { AtalhosDeJanela } from "./AtalhosDeJanela";

const formatoHora = formatador({ hour: "2-digit", minute: "2-digit" });

export default async function PaginaBonusAdmin({ params }: PageProps<"/painel/admin/bonus/[id]">) {
  await exigirPapel("ADMIN");
  const { id } = await params;

  const [bonus, videos] = await Promise.all([
    id === "novo" ? null : prisma.bonus.findUnique({ where: { id } }),
    prisma.video.findMany({ where: { produto: "MENTORIA", ativo: true }, orderBy: { criadoEm: "desc" } }),
  ]);
  if (id !== "novo" && !bonus) notFound();

  const hoje = new Date();
  const salvar = salvarBonus.bind(null, id);

  return (
    <main className="max-w-2xl">
      <Link href="/painel/admin/bonus" className="text-[13px] text-ink-soft hover:text-ink">
        ← Bônus
      </Link>
      <h1 className="font-display mt-2 text-[26px] text-ink lg:text-[32px]">
        {bonus ? "Editar bônus" : "Novo bônus"}
      </h1>

      <form action={salvar} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Título
          <input
            name="titulo"
            defaultValue={bonus?.titulo}
            required
            placeholder="ex: Masterclass — Fechando por WhatsApp"
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Descrição
          <textarea
            name="descricao"
            defaultValue={bonus?.descricao ?? ""}
            rows={3}
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          />
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          Vídeo
          <select
            name="videoId"
            defaultValue={bonus?.videoId ?? ""}
            className="rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
            style={{ background: "var(--color-input)" }}
          >
            <option value="">— Sem vídeo —</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.titulo}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="rounded-[4px] border border-accent-border p-4"
          style={{ background: "linear-gradient(150deg, rgba(203,163,92,0.08), rgba(203,163,92,0.02))" }}>
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Janela de disponibilidade
          </legend>

          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
              Libera em
              <div className="flex gap-2">
                <input
                  name="dataLibera"
                  type="date"
                  required
                  defaultValue={paraInputDate(bonus?.liberaEm ?? hoje)}
                  className="flex-1 rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
                <input
                  name="horaLibera"
                  type="time"
                  required
                  defaultValue={bonus ? formatoHora.format(bonus.liberaEm) : "09:00"}
                  className="w-[110px] rounded-[2px] border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
              Expira em
              <div className="flex gap-2">
                <input
                  name="dataExpira"
                  type="date"
                  required
                  defaultValue={paraInputDate(bonus?.expiraEm ?? hoje)}
                  className="flex-1 rounded-[2px] border border-accent-border px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
                <input
                  name="horaExpira"
                  type="time"
                  required
                  defaultValue={bonus ? formatoHora.format(bonus.expiraEm) : "23:59"}
                  className="w-[110px] rounded-[2px] border border-accent-border px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-accent"
                  style={{ background: "var(--color-input)" }}
                />
              </div>
            </label>
          </div>

          <AtalhosDeJanela />

          <p className="mt-3 text-[12px] text-ink-faint">
            O contador que o mentorado vê é calculado a partir desta janela, no servidor.
          </p>
        </fieldset>

        <fieldset className="rounded-[4px] border border-line bg-card p-4">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Opções
          </legend>
          <div className="mt-2 flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 text-[14px] text-ink">
              <input type="checkbox" name="destaque" defaultChecked={bonus?.destaque} />
              Marcar como destaque (aparece grande no topo)
            </label>
            <label className="flex items-center gap-2.5 text-[14px] text-ink-soft">
              <input type="checkbox" name="notificarPush" defaultChecked={bonus?.notificarPush} />
              Avisar por push e e-mail ao publicar
            </label>
            <label className="flex items-center gap-2.5 text-[14px] text-ink-soft">
              <input type="checkbox" name="lembrar3hAntes" defaultChecked={bonus?.lembrar3hAntes} />
              Lembrar 3h antes de expirar
            </label>
          </div>
          {/* Honestidade sobre o que ainda nao dispara: os dois avisos sao
              guardados mas nada os envia ainda — o motor de notificacao
              (Fase 10) so cobre alerta dentro do app. Melhor deixar o campo
              gravado e dizer isso do que fingir que ja avisa. */}
          <p className="mt-3 text-[12px] text-ink-faint">
            Os avisos ficam registrados, mas o envio por push/e-mail ainda não está ligado.
          </p>
        </fieldset>

        <button
          type="submit"
          className="self-start rounded-[2px] bg-accent px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent-ink hover:bg-accent-hover"
        >
          {bonus ? "Salvar bônus" : "Agendar publicação"}
        </button>
      </form>
    </main>
  );
}
