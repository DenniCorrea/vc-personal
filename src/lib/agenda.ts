// O ciclo semanal do limite do plano reseta toda segunda-feira (decisão
// confirmada com o Victor — igual pra todo mundo, não é por data de
// assinatura individual).
export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  const diaSemana = d.getDay(); // 0 = domingo, 1 = segunda, ... 6 = sabado
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + deslocamento);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fimDaSemana(data: Date): Date {
  const inicio = inicioDaSemana(data);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 7);
  return fim;
}
