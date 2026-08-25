import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Padrao do Next e 1MB por Server Action — baixo demais pra foto de
    // celular (avatar, foto de progresso, imagem de anatomia do
    // exercicio passam por Server Action com upload de arquivo). 10mb
    // cobre uma foto de celular em resolucao normal com folga.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
