// Placeholder honesto pras rotas da Mentoria B2B ja linkadas na navegacao
// mas cuja tela ainda nao foi construida (handoff_mentoria_b2b_metodo_lider
// tem 14 telas ao todo — construindo em ordem de prioridade combinada com
// o Dennis: casca + login + dashboard primeiro). Existe pra ninguem cair
// num 404 ao clicar num item do menu que ja esta no ar.
export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <main className="flex min-h-[50vh] flex-col items-start justify-center pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Em construção</p>
      <h1 className="font-display mt-1 text-[28px] text-ink">{titulo}</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">{descricao}</p>
    </main>
  );
}
