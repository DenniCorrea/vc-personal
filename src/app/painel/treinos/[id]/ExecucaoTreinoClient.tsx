"use client";

import { useState } from "react";
import Link from "next/link";
import { formatarDataCurta } from "@/lib/data";
import { VideoBottomSheet, type VideoSheetInfo } from "@/components/VideoBottomSheet";
import { registrarSerie } from "../actions";

type ExercicioComHistorico = {
  prescricao: {
    id: string;
    exercicioId: string;
    series: number | null;
    repeticoes: string | null;
    descanso: string | null;
    exercicio: {
      nome: string;
      grupoMuscularPrincipal: string | null;
      gruposMuscularesSecundarios: string[];
      cuidados: string | null;
      imagemAnatomica: string | null;
      video: { vimeoId: string; vimeoHash: string | null } | null;
    };
  };
  seriesAnteriores: { numeroSerie: number; carga: number | null; repeticoes: number | null }[];
  seriesHoje: { numeroSerie: number; carga: number | null; repeticoes: number | null }[];
  dataUltimaExecucao: Date | null;
};

export function ExecucaoTreinoClient({
  treinoId,
  treinoNome,
  exercicios,
}: {
  treinoId: string;
  treinoNome: string;
  exercicios: ExercicioComHistorico[];
}) {
  const [videoAberto, setVideoAberto] = useState<VideoSheetInfo | null>(null);

  return (
    <main className="px-6 pt-cabecalho-aluno pb-10">
      <div className="flex items-center gap-3">
        <Link href="/painel/treinos" className="text-ink-soft hover:text-ink" aria-label="Voltar">
          ←
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
          {treinoNome.toUpperCase()}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-10">
        {exercicios.map(({ prescricao, seriesAnteriores, seriesHoje, dataUltimaExecucao }, indice) => {
          const video = prescricao.exercicio.video;
          const abrirVideo = () =>
            video &&
            setVideoAberto({
              vimeoId: video.vimeoId,
              vimeoHash: video.vimeoHash,
              titulo: prescricao.exercicio.nome,
              legenda: [
                prescricao.repeticoes && `${prescricao.repeticoes} reps`,
                prescricao.exercicio.grupoMuscularPrincipal,
              ]
                .filter(Boolean)
                .join(" · "),
            });

          return (
            <section key={prescricao.id}>
              <p className="text-[12px] text-ink-subtle">
                Exercício {indice + 1} de {exercicios.length}
              </p>
              <h2 className="font-display mt-1 text-[26px] leading-tight text-ink">{prescricao.exercicio.nome}</h2>
              <p className="mt-1 text-[13px] text-ink-soft">
                {[
                  prescricao.series && `${prescricao.series} séries`,
                  prescricao.repeticoes && `${prescricao.repeticoes} reps`,
                  prescricao.descanso && `descanso ${prescricao.descanso}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {video && (
                <button
                  type="button"
                  onClick={abrirVideo}
                  className="mt-3 inline-flex items-center gap-2 rounded-[2px] border border-accent-border bg-accent-wash px-3 py-2 text-[12px] font-medium text-accent"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Assistir execução
                </button>
              )}

              {(prescricao.exercicio.grupoMuscularPrincipal || prescricao.exercicio.cuidados) && (
                <div className="mt-4 flex gap-4 rounded-[4px] border border-line bg-card p-4">
                  {prescricao.exercicio.imagemAnatomica && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={prescricao.exercicio.imagemAnatomica}
                      alt=""
                      className="h-[118px] w-[80px] shrink-0 rounded-[2px] object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Músculos</p>
                    {prescricao.exercicio.grupoMuscularPrincipal && (
                      <p className="mt-1 text-[13px]" style={{ color: "var(--color-warn)" }}>
                        {prescricao.exercicio.grupoMuscularPrincipal}{" "}
                        <span className="text-ink-faint">(principal)</span>
                      </p>
                    )}
                    {prescricao.exercicio.gruposMuscularesSecundarios.length > 0 && (
                      <p className="text-[13px] text-ink-soft">
                        {prescricao.exercicio.gruposMuscularesSecundarios.join(", ")}
                      </p>
                    )}
                    {prescricao.exercicio.cuidados && (
                      <p className="mt-2 text-[12px] text-ink-soft">{prescricao.exercicio.cuidados}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-[4px] border border-accent-border p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Registrar hoje</p>
                  {dataUltimaExecucao && (
                    <p className="text-[12px] text-ink-faint">Último: {formatarDataCurta(dataUltimaExecucao)}</p>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-[24px_1fr_1fr_52px_40px] items-center gap-x-2 text-[10px] uppercase tracking-wide text-ink-subtle">
                  <span>Sér</span>
                  <span>Carga</span>
                  <span>Reps</span>
                  <span>Antes</span>
                  <span />
                </div>

                <div className="mt-1 flex flex-col divide-y divide-line">
                  {Array.from({
                    length: Math.max(prescricao.series ?? 1, seriesAnteriores.length, seriesHoje.length, 1),
                  }).map((_, i) => {
                    const numeroSerie = i + 1;
                    const registroHoje = seriesHoje.find((s) => s.numeroSerie === numeroSerie);
                    const registroAntes = seriesAnteriores.find((s) => s.numeroSerie === numeroSerie);
                    return (
                      <form
                        key={numeroSerie}
                        action={registrarSerie.bind(null, treinoId)}
                        className="grid grid-cols-[24px_1fr_1fr_52px_40px] items-center gap-x-2 py-2"
                      >
                        <input type="hidden" name="exercicioId" value={prescricao.exercicioId} />
                        <input type="hidden" name="numeroSerie" value={numeroSerie} />
                        <span className="text-[15px] text-ink">{numeroSerie}</span>
                        <input
                          name="carga"
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          enterKeyHint="next"
                          autoComplete="off"
                          defaultValue={registroHoje?.carga ?? undefined}
                          className="min-w-0 rounded-[2px] border px-2 py-2.5 text-[16px] font-semibold text-ink outline-none"
                          style={{ background: "var(--color-input)", borderColor: "rgba(237,233,227,0.14)" }}
                        />
                        <input
                          name="repeticoes"
                          type="number"
                          inputMode="numeric"
                          enterKeyHint="done"
                          autoComplete="off"
                          defaultValue={registroHoje?.repeticoes ?? undefined}
                          className="min-w-0 rounded-[2px] border px-2 py-2.5 text-[16px] font-semibold text-ink outline-none"
                          style={{ background: "var(--color-input)", borderColor: "rgba(237,233,227,0.14)" }}
                        />
                        <span className="truncate text-right font-mono text-[11px] text-ink-faint">
                          {registroAntes ? `${registroAntes.carga ?? "—"}×${registroAntes.repeticoes ?? "—"}` : "—"}
                        </span>
                        <button
                          type="submit"
                          aria-label={`Salvar série ${numeroSerie}`}
                          className="flex h-11 w-11 items-center justify-center justify-self-end rounded-[2px] text-accent hover:bg-accent-wash"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <VideoBottomSheet video={videoAberto} onFechar={() => setVideoAberto(null)} />
    </main>
  );
}
