-- CreateEnum
CREATE TYPE "StatusPublicacao" AS ENUM ('RASCUNHO', 'AGENDADA', 'PUBLICADA');

-- CreateEnum
CREATE TYPE "TipoPost" AS ENUM ('RESULTADO', 'DUVIDA', 'GERAL');

-- AlterTable
ALTER TABLE "mensagens" ADD COLUMN     "aulaId" TEXT,
ADD COLUMN     "tarefa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timestampSegundos" INTEGER;

-- AlterTable
ALTER TABLE "planos" ADD COLUMN     "incluiBonus" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "modulos" (
    "id" TEXT NOT NULL,
    "pilar" "Pilar" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aulas" (
    "id" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "videoId" TEXT,
    "materialUrl" TEXT,
    "ordem" INTEGER NOT NULL,
    "prazoAcessoDias" INTEGER,
    "status" "StatusPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "publicadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresso_aulas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "posicaoSegundos" INTEGER NOT NULL DEFAULT 0,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progresso_aulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "videoId" TEXT,
    "liberaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "notificarPush" BOOLEAN NOT NULL DEFAULT false,
    "lembrar3hAntes" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "TipoPost" NOT NULL DEFAULT 'GERAL',
    "texto" TEXT NOT NULL,
    "ticketAntes" DECIMAL(10,2),
    "ticketDepois" DECIMAL(10,2),
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "paiId" TEXT,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curtidas" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curtidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AulaToPlano" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AulaToPlano_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "aulas_moduloId_ordem_key" ON "aulas"("moduloId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "progresso_aulas_usuarioId_aulaId_key" ON "progresso_aulas"("usuarioId", "aulaId");

-- CreateIndex
CREATE UNIQUE INDEX "curtidas_postId_usuarioId_key" ON "curtidas"("postId", "usuarioId");

-- CreateIndex
CREATE INDEX "_AulaToPlano_B_index" ON "_AulaToPlano"("B");

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "aulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_aulas" ADD CONSTRAINT "progresso_aulas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresso_aulas" ADD CONSTRAINT "progresso_aulas_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "aulas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus" ADD CONSTRAINT "bonus_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "comentarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtidas" ADD CONSTRAINT "curtidas_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtidas" ADD CONSTRAINT "curtidas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AulaToPlano" ADD CONSTRAINT "_AulaToPlano_A_fkey" FOREIGN KEY ("A") REFERENCES "aulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AulaToPlano" ADD CONSTRAINT "_AulaToPlano_B_fkey" FOREIGN KEY ("B") REFERENCES "planos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
