-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "produto" "Produto" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "vimeoId" TEXT NOT NULL,
    "vimeoHash" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

