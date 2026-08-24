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

// "DD/MM" ou "DD/MM/AAAA" pra EXIBIR um campo @db.Date (Avaliacao.data,
// ExecucaoExercicio.data, etc.). ATENCAO: usa os componentes UTC, NAO os
// locais — diferente do paraInputDate acima. A diferenca importa: um
// @db.Date do Postgres nao tem hora nem fuso, e o driver do Prisma sempre
// devolve esse valor como meia-noite UTC. Se o processo Node estiver rodando
// num fuso atras de UTC (Brasil, UTC-3 — o caso do dev local), ler esse
// valor com getters LOCAIS mostra o dia ANTERIOR. `paraInputDate` funciona
// com getters locais porque so e usado em campos DateTime de verdade
// (publicadoEm), onde "hora local" faz sentido — aqui nao ha hora nenhuma
// pra converter, entao os getters UTC sao os certos.
export function formatarDataCurta(data: Date, comAno = false): string {
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  return comAno ? `${dia}/${mes}/${data.getUTCFullYear()}` : `${dia}/${mes}`;
}
