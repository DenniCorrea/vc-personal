import "server-only";

import { prisma } from "@/lib/prisma";
import { lerSilenciamento } from "@/lib/moderacao";

// Separado de ./moderacao.ts porque toca o banco, e aquele arquivo e
// importado por client component. O `server-only` no topo faz o build
// falhar cedo e com mensagem clara se alguem importar isso do cliente,
// em vez de quebrar no empacotamento.

// Chamada antes de publicar ou comentar. Devolve a mensagem de recusa quando
// a pessoa esta silenciada, ou null quando pode falar. Fica no servidor
// porque esconder o formulario no cliente nao impede ninguem de mandar o
// POST na mao.
export async function bloqueioPorSilenciamento(usuarioId: string): Promise<string | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { comunidadeSilenciadaAte: true, comunidadeMotivoSilencio: true },
  });
  if (!usuario) return "Usuário não encontrado.";

  const estado = lerSilenciamento(usuario);
  if (!estado.silenciado) return null;

  const ate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(estado.ate);

  return estado.motivo
    ? `Sua participação na comunidade está suspensa até ${ate}. Motivo: ${estado.motivo}`
    : `Sua participação na comunidade está suspensa até ${ate}.`;
}
