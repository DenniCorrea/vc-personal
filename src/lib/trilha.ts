import { prisma } from "@/lib/prisma";

// Regra de acesso a uma aula, num lugar so. Tres condicoes somadas:
//
// 1. A aula esta PUBLICADA (rascunho e so do Victor).
// 2. O plano ativo do mentorado esta na lista "quem ve" da aula. Sem plano
//    ativo, ou plano fora da lista, a aula nem e buscada — nao existe
//    "aula escondida no HTML" pra achar inspecionando a pagina.
// 3. O prazo de acesso nao venceu. `prazoAcessoDias` null = sem prazo.
//
// O calculo do prazo acontece AQUI, no servidor, nunca no cliente — o
// handoff pede isso explicitamente, e faz sentido: relogio de navegador e
// coisa que o proprio usuario muda.
export function expiraEm(aula: { publicadoEm: Date | null; prazoAcessoDias: number | null }): Date | null {
  if (!aula.prazoAcessoDias || !aula.publicadoEm) return null;
  const fim = new Date(aula.publicadoEm);
  fim.setDate(fim.getDate() + aula.prazoAcessoDias);
  return fim;
}

export function diasRestantes(aula: { publicadoEm: Date | null; prazoAcessoDias: number | null }): number | null {
  const fim = expiraEm(aula);
  if (!fim) return null;
  return Math.ceil((fim.getTime() - Date.now()) / 86_400_000);
}

// Busca a trilha inteira ja filtrada pelo que ESTE usuario pode ver, com o
// progresso dele embutido. Usado tanto pela grade de modulos quanto pelo
// player — ter uma fonte so evita as duas telas discordarem sobre o que
// esta liberado.
export async function trilhaDoUsuario(usuarioId: string) {
  const assinatura = await prisma.assinatura.findFirst({
    where: { usuarioId, status: "ATIVA" },
    select: { planoId: true },
  });
  if (!assinatura) return { semPlano: true as const, modulos: [] };

  const modulos = await prisma.modulo.findMany({
    where: {
      ativo: true,
      aulas: { some: { status: "PUBLICADA", planosVisiveis: { some: { id: assinatura.planoId } } } },
    },
    orderBy: { ordem: "asc" },
    include: {
      aulas: {
        where: { status: "PUBLICADA", planosVisiveis: { some: { id: assinatura.planoId } } },
        orderBy: { ordem: "asc" },
        include: {
          video: { select: { vimeoId: true, vimeoHash: true } },
          progresso: { where: { usuarioId }, select: { posicaoSegundos: true, concluida: true } },
        },
      },
    },
  });

  const agora = Date.now();
  const comAcesso = modulos.map((m) => ({
    ...m,
    aulas: m.aulas
      .map((a) => ({
        ...a,
        restam: diasRestantes(a),
        meuProgresso: a.progresso[0] ?? null,
      }))
      // Aula com prazo vencido sai da biblioteca (handoff: "depois de
      // expirar, saem da sua biblioteca").
      .filter((a) => {
        const fim = expiraEm(a);
        return fim === null || fim.getTime() > agora;
      }),
  }));

  return { semPlano: false as const, modulos: comAcesso.filter((m) => m.aulas.length > 0) };
}
