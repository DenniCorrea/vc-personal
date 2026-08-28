// Ciclo de sessoes 1-on-1 do plano de Mentoria (handoff, "3 de 5 sessoes").
//
// Diferente do limite semanal do ALUNO (que reseta toda segunda pra todo
// mundo, ver src/lib/agenda.ts), o ciclo da mentoria e MENSAL e por
// ASSINATURA — cada mentorado renova numa data diferente, entao o "mes"
// dele e [renovacao anterior, proxima renovacao), nao o mes do calendario.
//
// Isso e uma interpretacao razoavel, nao uma regra confirmada: o handoff
// lista explicitamente como decisao pendente #3 "regra de acumulo de
// sessoes nao utilizadas" — se sessoes de um ciclo que passou acumulam pro
// proximo, ou se zeram. Aqui elas ZERAM (o ciclo anterior simplesmente nao
// entra na janela) ate o Victor decidir o contrario.
export function inicioDoCicloAtual(dataProximaRenovacao: Date): Date {
  const inicio = new Date(dataProximaRenovacao);
  inicio.setMonth(inicio.getMonth() - 1);
  return inicio;
}
