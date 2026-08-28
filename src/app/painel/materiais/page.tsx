import { exigirPapel } from "@/lib/auth-guard";
import { EmConstrucao } from "@/components/EmConstrucao";

export default async function PaginaMateriais() {
  await exigirPapel("PERSONAL_PARCEIRO");
  return (
    <EmConstrucao
      titulo="Materiais"
      descricao="Os PDFs anexados a cada aula ficam reunidos aqui, junto com o resto da trilha de conteúdo."
    />
  );
}
