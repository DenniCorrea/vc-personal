import { exigirPapel } from "@/lib/auth-guard";
import { EmConstrucao } from "@/components/EmConstrucao";

export default async function PaginaComunidade() {
  await exigirPapel("PERSONAL_PARCEIRO");
  return (
    <EmConstrucao
      titulo="Comunidade"
      descricao="O feed fechado dos personal trainers mentorados — resultados, dúvidas comerciais e interação entre pares — chega numa próxima etapa."
    />
  );
}
