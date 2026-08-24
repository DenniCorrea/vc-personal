-- CreateEnum
CREATE TYPE "Pilar" AS ENUM ('POSICIONAMENTO', 'ABORDAGEM', 'MAPEAMENTO', 'VENDAS', 'FIDELIZACAO');

-- CreateEnum
CREATE TYPE "TipoConteudo" AS ENUM ('PADRAO', 'SEMANAL');

-- CreateTable
CREATE TABLE "conteudos_consultoria" (
    "id" TEXT NOT NULL,
    "pilar" "Pilar" NOT NULL,
    "tipo" "TipoConteudo" NOT NULL DEFAULT 'PADRAO',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "videoId" TEXT,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conteudos_consultoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conteudos_consultoria" ADD CONSTRAINT "conteudos_consultoria_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

