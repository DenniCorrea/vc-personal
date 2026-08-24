// So a data (sem hora) de "hoje", no fuso local do servidor (Brasil).
// Construida com Date.UTC a partir dos componentes locais pra bater
// certinho com um campo @db.Date do Postgres (que nao guarda fuso horario) —
// sem isso, perto da meia-noite o registro podia cair no dia errado.
export function hojeData(): Date {
  const agora = new Date();
  return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
}

// "AAAA-MM-DD" pra preencher um <input type="date">, usando os componentes
// LOCAIS da data (nao toISOString, que e UTC) — combina com como as actions
// de admin fazem `new Date(\`${valor}T00:00\`)` (interpretado como horario
// local). Misturar os dois fazia um conteudo "publicado hoje" aparecer como
// "agendado pro futuro" perto da virada do dia em UTC (mesma pegadinha da
// Fase 4).
export function paraInputDate(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
