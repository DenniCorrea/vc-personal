-- Moderacao da comunidade (10/09/2026).
--
-- SEGURA COM DADO DENTRO: e 100% aditiva. Nenhuma coluna removida ou
-- renomeada, nenhum DELETE. As duas colunas novas em `usuarios` sao
-- nullable; `comentarios.oculto` entra com DEFAULT false, entao todo
-- comentario existente continua visivel exatamente como estava.
-- O banco e compartilhado com producao (ver CLAUDE.md) — por isso a
-- conferencia esta escrita aqui em vez de so no terminal.

-- CreateEnum
CREATE TYPE "MotivoDenuncia" AS ENUM ('SPAM', 'OFENSA', 'CONTEUDO_IMPROPRIO', 'FORA_DO_TEMA', 'OUTRO');

-- AlterTable
ALTER TABLE "comentarios" ADD COLUMN     "oculto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "comunidadeMotivoSilencio" TEXT,
ADD COLUMN     "comunidadeSilenciadaAte" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "comentarioId" TEXT,
    "denuncianteId" TEXT NOT NULL,
    "motivo" "MotivoDenuncia" NOT NULL,
    "detalhe" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),
    "moderadorId" TEXT,
    "acaoTomada" TEXT,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "denuncias_resolvidoEm_idx" ON "denuncias"("resolvidoEm");

-- CreateIndex
CREATE UNIQUE INDEX "denuncias_denuncianteId_postId_comentarioId_key" ON "denuncias"("denuncianteId", "postId", "comentarioId");

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "comentarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_denuncianteId_fkey" FOREIGN KEY ("denuncianteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_moderadorId_fkey" FOREIGN KEY ("moderadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
