import Link from "next/link";
import { formatador } from "@/lib/data";
import type { SituacaoAcesso } from "@/lib/acesso";

const formatoData = formatador({ day: "2-digit", month: "long", year: "numeric" });

// A tela de bloqueio, uma so pra todas as areas. Cada motivo tem titulo,
// explicacao e botao proprios — o ponto do componente e que quem venceu nunca
// mais leia "assine um plano" como se nunca tivesse assinado.
//
// `area` e so o rotulo do topo ("Módulos", "Comunidade") e o que muda na
// frase; o resto e igual, de proposito: o motivo do bloqueio e o mesmo
// independente da porta em que a pessoa bateu.
export function SemAcesso({
  situacao,
  area,
  oQueDesbloqueia,
}: {
  situacao: Extract<SituacaoAcesso, { liberado: false }>;
  area: string;
  oQueDesbloqueia: string;
}) {
  const conteudo = {
    SEM_ASSINATURA: {
      titulo: "Você ainda não tem acesso",
      corpo: `Assine um plano de mentoria pra desbloquear ${oQueDesbloqueia}.`,
      rotuloBotao: "Ver planos",
      alerta: false,
    },
    PAGAMENTO_PENDENTE: {
      titulo: "Falta concluir o pagamento",
      corpo:
        situacao.motivo === "PAGAMENTO_PENDENTE"
          ? `Seu plano ${situacao.planoNome} está reservado, mas o pagamento ainda não foi confirmado. Assim que ele cair, ${oQueDesbloqueia} libera automaticamente.`
          : "",
      rotuloBotao: "Concluir pagamento",
      alerta: false,
    },
    VENCIDO: {
      titulo: "Seu plano venceu",
      corpo:
        situacao.motivo === "VENCIDO"
          ? `O plano ${situacao.planoNome} venceu em ${formatoData.format(situacao.venceuEm)}. Renove pra voltar a acessar ${oQueDesbloqueia} — seu progresso continua salvo, nada foi perdido.`
          : "",
      rotuloBotao: "Renovar plano",
      alerta: true,
    },
  }[situacao.motivo];

  return (
    <main className="max-w-lg pb-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{area}</p>
      <h1 className="font-display mt-1 text-[28px] leading-tight text-ink">{conteudo.titulo}</h1>
      <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{conteudo.corpo}</p>

      <Link
        href="/painel/planos"
        className="mt-5 inline-block rounded-[2px] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em]"
        style={{
          background: conteudo.alerta ? "var(--color-accent)" : "transparent",
          color: conteudo.alerta ? "var(--color-accent-ink)" : "var(--color-ink)",
          border: conteudo.alerta ? "none" : "1px solid var(--color-line)",
        }}
      >
        {conteudo.rotuloBotao}
      </Link>
    </main>
  );
}
