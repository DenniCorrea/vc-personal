-- CreateTable
CREATE TABLE "exercicios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "instrucoes" TEXT,
    "cuidados" TEXT,
    "videoId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treinos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treino_exercicios" (
    "id" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "exercicioId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "series" INTEGER,
    "repeticoes" TEXT,
    "carga" TEXT,
    "descanso" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "treino_exercicios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exercicios" ADD CONSTRAINT "exercicios_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treino_exercicios" ADD CONSTRAINT "treino_exercicios_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treino_exercicios" ADD CONSTRAINT "treino_exercicios_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

