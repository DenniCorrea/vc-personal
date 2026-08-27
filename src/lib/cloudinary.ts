import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Formatos aceitos. SVG fica DE FORA de proposito: navegador trata SVG
// como documento, entao um "SVG" com <script> dentro vira XSS hospedado no
// nosso proprio dominio de imagens. Os 4 abaixo sao formatos de imagem
// binaria — nao executam nada.
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;
const FORMATOS_CLOUDINARY = ["jpg", "jpeg", "png", "webp", "heic"];

// 10MB e o mesmo teto do `serverActions.bodySizeLimit` no next.config.ts.
// Checar aqui tambem serve pra devolver uma mensagem legivel em vez do erro
// cru do Next quando alguem manda um arquivo grande demais.
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

// Recebe o arquivo direto da action (Server Actions recebem File do form),
// valida, sobe pro Cloudinary dentro de uma pasta por tipo, e devolve so a
// URL — e a URL que guardamos no banco (Usuario.avatarUrl, FotoProgresso.url).
//
// A validacao roda no servidor de proposito: o `accept="image/*"` do input
// e so conveniencia de UX, qualquer um contorna isso mandando o POST direto.
export async function enviarImagem(
  arquivo: File,
  pasta: "avatares" | "fotos-progresso" | "anatomia",
): Promise<string> {
  if (arquivo.size === 0) {
    throw new Error("Arquivo vazio.");
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("Imagem muito grande (máximo 10MB). Tente uma foto menor.");
  }
  // Pre-filtro pelo MIME que o navegador informou. E so um atalho pra dar
  // mensagem boa e nao gastar upload a toa — NAO e a checagem que vale,
  // porque esse campo vem do cliente e pode vir mentindo. Quando vem VAZIO
  // (acontece de verdade em camera de alguns Android) deixamos passar de
  // proposito: quem decide nesse caso e o Cloudinary abaixo, que olha o
  // conteudo real do arquivo em vez de acreditar no que o cliente disse.
  if (arquivo.type && !TIPOS_PERMITIDOS.includes(arquivo.type as (typeof TIPOS_PERMITIDOS)[number])) {
    throw new Error("Formato não aceito. Use JPG, PNG, WEBP ou HEIC.");
  }

  const bytes = await arquivo.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const resultado = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `vc-personal/${pasta}`,
        // Segunda barreira, agora do lado do Cloudinary: mesmo que o
        // `arquivo.type` acima venha mentindo (ele vem do navegador), o
        // Cloudinary olha o conteudo de verdade e recusa o que nao for
        // imagem nesses formatos. E ESSA a checagem que vale.
        resource_type: "image",
        allowed_formats: FORMATOS_CLOUDINARY,
      },
      (erro, resultado) => {
        if (erro || !resultado) {
          // Recusa do Cloudinary (400) quase sempre significa "isso nao e
          // uma imagem de verdade". Sem traduzir, o erro cru sobe ate a tela
          // e o aluno ve um 500 sem explicacao. Erro de rede/credencial
          // (qualquer coisa fora 4xx) continua subindo como falha nossa.
          const httpCode = (erro as { http_code?: number } | null)?.http_code;
          if (httpCode && httpCode >= 400 && httpCode < 500) {
            return reject(new Error("Esse arquivo não é uma imagem válida. Use JPG, PNG, WEBP ou HEIC."));
          }
          return reject(erro ?? new Error("Falha no upload"));
        }
        resolve(resultado);
      },
    );
    upload.end(buffer);
  });

  return resultado.secure_url;
}
