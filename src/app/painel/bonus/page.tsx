import { exigirPapel } from "@/lib/auth-guard";
import { EmConstrucao } from "@/components/EmConstrucao";

export default async function PaginaBonus() {
  await exigirPapel("PERSONAL_PARCEIRO");
  return (
    <EmConstrucao
      titulo="Bônus"
      descricao="As masterclasses com janela de disponibilidade limitada chegam numa próxima etapa."
    />
  );
}
