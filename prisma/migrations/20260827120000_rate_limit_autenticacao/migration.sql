-- CreateTable
CREATE TABLE "tentativas_autenticacao" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativas_autenticacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentativas_autenticacao_chave_criadoEm_idx" ON "tentativas_autenticacao"("chave", "criadoEm");
