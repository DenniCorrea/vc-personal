import type { NextConfig } from "next";

// Cabecalhos de seguranca aplicados a TODA resposta do app. Cada um fecha
// uma porta especifica que, sem ele, fica aberta por padrao no navegador.
const CABECALHOS_SEGURANCA = [
  {
    // Obriga o navegador a so falar HTTPS com o dominio pelos proximos 2
    // anos, inclusive na PRIMEIRA visita depois disso. A Render ja redireciona
    // http->https, mas o redirect acontece DEPOIS de uma requisicao em texto
    // puro ter saido do celular do aluno — o HSTS elimina essa primeira ida.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Impede que o app seja carregado dentro de um <iframe> de outro site
    // (clickjacking: uma pagina falsa por cima da nossa capturando cliques).
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Impede o navegador de "adivinhar" o tipo de um arquivo. Sem isso, um
    // upload que o servidor diz ser imagem mas parece HTML pode acabar sendo
    // executado como HTML.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Sites externos linkados a partir do app recebem so o dominio de
    // origem, nunca a URL completa — senao um link vazaria coisas como
    // /painel/admin/alunos/<id-do-aluno> no Referer.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Desliga APIs de hardware que o app nao usa. Se um dia entrar leitura
    // de camera (ex: foto de progresso tirada na hora), essa linha precisa
    // liberar `camera=(self)`.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Não expõe "X-Powered-By: Next.js" — dizer ao mundo qual framework e
  // versão rodam aqui só ajuda quem procura um alvo com CVE conhecida.
  poweredByHeader: false,

  experimental: {
    // Padrao do Next e 1MB por Server Action — baixo demais pra foto de
    // celular (avatar, foto de progresso, imagem de anatomia do
    // exercicio passam por Server Action com upload de arquivo). 10mb
    // cobre uma foto de celular em resolucao normal com folga.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_SEGURANCA }];
  },
};

export default nextConfig;
