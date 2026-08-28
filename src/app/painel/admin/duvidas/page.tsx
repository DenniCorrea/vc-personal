import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth-guard";
import { formatador } from "@/lib/data";
import { enviarMensagemAdmin } from "../conversas/actions";

const formatoQuando = formatador({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function minutoDoVideo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  return `${m}:${String(segundos % 60).padStart(2, "0")}`;
}

// Quanto tempo a pergunta esta esperando, em texto curto.
function esperando(desde: Date): { texto: string; horas: number } {
  const horas = Math.floor((Date.now() - desde.getTime()) / 3_600_000);
  if (horas < 1) return { texto: "agora há pouco", horas };
  if (horas < 24) return { texto: `${horas}h`, horas };
  return { texto: `${Math.floor(horas / 24)}d`, horas };
}

// Fila de duvidas (handoff, tela 6d). Diferente de /painel/admin/conversas
// (que e a caixa de entrada por pessoa), aqui a unidade e a PERGUNTA
// ancorada numa aula, ordenada por quem espera ha mais tempo — e a tela de
// triagem, nao de conversa.
export default async function PaginaDuvidas({ searchParams }: PageProps<"/painel/admin/duvidas">) {
  await exigirPapel("ADMIN");
  const { filtro } = await searchParams;
  const mostrarRespondidas = filtro === "respondidas";

  // Duvidas = mensagens do mentorado ancoradas numa aula.
  const duvidas = await prisma.mensagem.findMany({
    where: { aulaId: { not: null }, autorId: { not: undefined } },
    orderBy: { criadoEm: "asc" },
    include: {
      usuario: { select: { id: true, nome: true } },
      aula: { select: { id: true, titulo: true, modulo: { select: { titulo: true } } } },
    },
  });

  // So as escritas pelo proprio dono da thread (o mentorado) — resposta do
  // Victor ancorada nao e uma duvida nova.
  const doMentorado = duvidas.filter((d) => d.autorId === d.usuarioId);

  // Respondida = existe mensagem do Victor DEPOIS dela naquela thread.
  const idsUsuarios = [...new Set(doMentorado.map((d) => d.usuarioId))];
  const respostasDoVictor = await prisma.mensagem.findMany({
    where: { usuarioId: { in: idsUsuarios }, autorId: { notIn: idsUsuarios } },
    select: { usuarioId: true, criadoEm: true },
  });

  const comEstado = doMentorado.map((d) => ({
    ...d,
    respondida: respostasDoVictor.some(
      (r) => r.usuarioId === d.usuarioId && r.criadoEm.getTime() > d.criadoEm.getTime(),
    ),
  }));

  const abertas = comEstado.filter((d) => !d.respondida);
  const respondidas = comEstado.filter((d) => d.respondida).reverse();
  const lista = mostrarRespondidas ? respondidas : abertas;

  return (
    <main>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Mentoria</p>
      <h1 className="font-display mt-1 text-[26px] text-ink lg:text-[34px]">Dúvidas das aulas</h1>

      <div className="mt-5 flex gap-2">
        <Link
          href="/painel/admin/duvidas"
          className="min-h-10 rounded-[2px] border px-4 py-2 text-[12px] font-medium"
          style={{
            borderColor: !mostrarRespondidas ? "var(--color-accent)" : "var(--color-line)",
            color: !mostrarRespondidas ? "var(--color-accent)" : "var(--color-ink-soft)",
            background: !mostrarRespondidas ? "var(--color-accent-wash)" : "transparent",
          }}
        >
          Abertas {abertas.length}
        </Link>
        <Link
          href="/painel/admin/duvidas?filtro=respondidas"
          className="min-h-10 rounded-[2px] border px-4 py-2 text-[12px] font-medium"
          style={{
            borderColor: mostrarRespondidas ? "var(--color-accent)" : "var(--color-line)",
            color: mostrarRespondidas ? "var(--color-accent)" : "var(--color-ink-soft)",
            background: mostrarRespondidas ? "var(--color-accent-wash)" : "transparent",
          }}
        >
          Respondidas {respondidas.length}
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-line bg-card p-6">
          <p className="text-[13px] text-ink-soft">
            {mostrarRespondidas ? "Nenhuma dúvida respondida ainda." : "Nenhuma dúvida aberta. Tudo em dia."}
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {lista.map((d) => {
            const espera = esperando(d.criadoEm);
            // 48h e o prazo mais folgado entre os planos — passou disso,
            // estourou pra qualquer nivel.
            const atrasada = !d.respondida && espera.horas >= 48;
            return (
              <article
                key={d.id}
                className="rounded-[4px] border p-5"
                style={{
                  borderColor: atrasada ? "var(--color-warn)" : "var(--color-line)",
                  background: atrasada ? "var(--color-warn-wash)" : "var(--color-card)",
                }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px] font-medium text-ink">{d.usuario.nome}</p>
                  <p className="text-[12px]" style={{ color: atrasada ? "var(--color-warn)" : "var(--color-ink-soft)" }}>
                    esperando há {espera.texto}
                    {atrasada && " · fora do prazo"}
                  </p>
                </div>

                {d.aula && (
                  <Link
                    href={`/painel/admin/trilha/aula/${d.aula.id}`}
                    className="mt-2 inline-block rounded-[3px] border border-line px-3 py-2 hover:border-accent-border"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">Ancorada em</p>
                    <p className="mt-0.5 text-[12.5px] text-ink">
                      {d.aula.modulo.titulo} · {d.aula.titulo}
                    </p>
                    {d.timestampSegundos !== null && (
                      <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        minuto {minutoDoVideo(d.timestampSegundos)}
                      </p>
                    )}
                  </Link>
                )}

                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">{d.texto}</p>
                <p className="mt-1 text-[11px] text-ink-faint">{formatoQuando.format(d.criadoEm)}</p>

                {!d.respondida && (
                  <form action={enviarMensagemAdmin.bind(null, d.usuarioId)} className="mt-4 flex gap-2">
                    <input
                      name="texto"
                      required
                      placeholder="Responder..."
                      className="min-w-0 flex-1 rounded-[2px] border border-line px-3 py-2 text-[13.5px] text-ink outline-none focus:border-accent"
                      style={{ background: "var(--color-input)" }}
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-[2px] bg-accent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink hover:bg-accent-hover"
                    >
                      Responder
                    </button>
                  </form>
                )}

                <Link
                  href={`/painel/admin/conversas/${d.usuario.id}`}
                  className="mt-3 inline-block text-[12px] font-medium text-accent"
                >
                  Ver conversa completa →
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {/* Limite declarado: o SLA por plano (48h/24h/mesmo dia) esta no
          handoff mas nao ha campo pra isso no Plano. Uso 48h como corte —
          o prazo mais folgado — pra nao inventar uma regra de negocio. */}
      <p className="mt-5 text-[12px] leading-relaxed text-ink-faint">
        Marcamos como fora do prazo depois de 48h. O prazo por plano (48h / 24h / mesmo dia)
        ainda não está configurável.
      </p>
    </main>
  );
}
