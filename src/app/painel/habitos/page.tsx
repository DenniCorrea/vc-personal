import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { hojeData } from "@/lib/data";
import { definirMeta, incrementarHabito, definirValorHabito } from "./actions";

export default async function PaginaHabitos() {
  const session = await exigirPapel("ALUNO", "PERSONAL_PARCEIRO");

  const seteDiasAtras = new Date(hojeData());
  seteDiasAtras.setUTCDate(seteDiasAtras.getUTCDate() - 6);

  const [mensagem, habitoAgua, habitoSono] = await Promise.all([
    prisma.mensagemMentalidade.findFirst({
      where: { ativo: true, publicadoEm: { lte: new Date() } },
      orderBy: { publicadoEm: "desc" },
    }),
    prisma.habito.findUnique({
      where: { usuarioId_tipo: { usuarioId: session.user.id, tipo: "AGUA" } },
      include: { registros: { where: { data: { gte: seteDiasAtras } }, orderBy: { data: "asc" } } },
    }),
    prisma.habito.findUnique({
      where: { usuarioId_tipo: { usuarioId: session.user.id, tipo: "SONO" } },
      include: { registros: { where: { data: { gte: seteDiasAtras } }, orderBy: { data: "asc" } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-accent">
        Hábitos
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Água, sono e mentalidade</h1>

      {mensagem && (
        <div className="mt-6 rounded-lg border border-line bg-paper-raised px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Mensagem de hoje
          </p>
          <p className="mt-1 text-ink">{mensagem.texto}</p>
        </div>
      )}

      <CartaoHabito
        titulo="Água"
        unidade="ml"
        tipo="AGUA"
        habito={habitoAgua}
        acoesRapidas={[250, 500]}
      />

      <CartaoHabito titulo="Sono" unidade="horas" tipo="SONO" habito={habitoSono} />

      <Link href="/painel" className="mt-10 inline-block text-sm text-ink-soft hover:text-ink">
        ← Voltar pro painel
      </Link>
    </main>
  );
}

type HabitoComRegistros = {
  id: string;
  metaValor: number;
  lembreteHorario: string | null;
  lembreteAtivo: boolean;
  registros: { data: Date; valor: number }[];
} | null;

function CartaoHabito({
  titulo,
  unidade,
  tipo,
  habito,
  acoesRapidas,
}: {
  titulo: string;
  unidade: string;
  tipo: "AGUA" | "SONO";
  habito: HabitoComRegistros;
  acoesRapidas?: number[];
}) {
  const hojeIso = hojeData().toISOString().slice(0, 10);
  const registroHoje = habito?.registros.find((r) => r.data.toISOString().slice(0, 10) === hojeIso);
  const valorHoje = registroHoje?.valor ?? 0;
  const meta = habito?.metaValor ?? 0;
  const percentual = meta > 0 ? Math.min(100, Math.round((valorHoje / meta) * 100)) : 0;

  return (
    <section className="mt-8 rounded-lg border border-line bg-paper-raised p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">{titulo}</h2>
        {habito && (
          <p className="text-sm text-ink-soft">
            {valorHoje} / {meta} {unidade} hoje
          </p>
        )}
      </div>

      {habito && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent" style={{ width: `${percentual}%` }} />
        </div>
      )}

      {!habito ? (
        <p className="mt-2 text-sm text-ink-soft">Você ainda não definiu uma meta.</p>
      ) : acoesRapidas ? (
        <div className="mt-4 flex gap-2">
          {acoesRapidas.map((delta) => (
            <form key={delta} action={incrementarHabito.bind(null, tipo, delta)}>
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-accent"
              >
                +{delta}
                {unidade}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <form action={definirValorHabito.bind(null, tipo)} className="mt-4 flex gap-2">
          <input
            name="valor"
            type="number"
            step="0.5"
            min="0"
            defaultValue={valorHoje || undefined}
            placeholder={`Quantas ${unidade} essa noite?`}
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            Registrar
          </button>
        </form>
      )}

      {habito && habito.registros.length > 1 && (
        <div className="mt-4 flex items-end gap-1">
          {habito.registros.map((registro) => {
            const alturaPct = meta > 0 ? Math.min(100, Math.round((registro.valor / meta) * 100)) : 0;
            return (
              <div key={registro.data.toISOString()} className="flex-1">
                <div
                  className="rounded-t bg-accent/60"
                  style={{ height: `${Math.max(4, alturaPct)}px` }}
                />
              </div>
            );
          })}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-accent">
          {habito ? "Editar meta e lembrete" : "Definir meta"}
        </summary>
        <form action={definirMeta.bind(null, tipo)} className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Meta diária ({unidade})
            <input
              name="metaValor"
              type="number"
              step="0.5"
              min="0"
              defaultValue={habito?.metaValor}
              required
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Horário do lembrete
            <input
              name="lembreteHorario"
              type="time"
              defaultValue={habito?.lembreteHorario ?? ""}
              className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="lembreteAtivo"
              defaultChecked={habito?.lembreteAtivo ?? true}
            />
            Receber lembrete
          </label>
          <button
            type="submit"
            className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
          >
            Salvar meta
          </button>
        </form>
      </details>
    </section>
  );
}
