import { exigirPapel } from "@/lib/auth-guard";
import { EmConstrucao } from "@/components/EmConstrucao";

export default async function PaginaModulos() {
  await exigirPapel("PERSONAL_PARCEIRO");
  return (
    <EmConstrucao
      titulo="Módulos"
      descricao="A trilha de conteúdo (módulos, aulas e o player de vídeo) é a próxima etapa da plataforma de mentoria. Volta em breve."
    />
  );
}
