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

type Visibilidade = "publica" | "privada";

type ResultadoUpload = {
  secure_url: string;
  public_id: string;
  format: string;
};

function validar(arquivo: File) {
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
}

async function subir(
  arquivo: File,
  pasta: string,
  visibilidade: Visibilidade,
): Promise<ResultadoUpload> {
  validar(arquivo);

  const bytes = await arquivo.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise<ResultadoUpload>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `vc-personal/${pasta}`,
        // "authenticated" faz o caminho publico do Cloudinary devolver 404 —
        // so uma URL assinada com nosso api_secret abre o arquivo.
        type: visibilidade === "privada" ? "authenticated" : "upload",
        // Segunda barreira, agora do lado do Cloudinary: mesmo que o
        // `arquivo.type` venha mentindo (ele vem do navegador), o
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
        resolve(resultado as ResultadoUpload);
      },
    );
    upload.end(buffer);
  });
}

// Imagem de acesso publico — avatar e imagem de anatomia do exercicio.
// Devolve a URL, que e o que guardamos no banco.
//
// Por que essas podem ser publicas: a imagem de anatomia e ilustracao
// generica (a mesma que ja existe em qualquer site de musculacao), e o
// avatar e uma foto de rosto que a propria pessoa escolheu como
// identificacao. Foto de progresso e outra conversa — ver abaixo.
export async function enviarImagem(
  arquivo: File,
  pasta: "avatares" | "anatomia",
): Promise<string> {
  const resultado = await subir(arquivo, pasta, "publica");
  return resultado.secure_url;
}

// Foto de progresso: sobe como PRIVADA e devolve o identificador, nao a
// URL. O caminho publico dessa imagem no Cloudinary passa a devolver 404;
// quem entrega ela pro navegador e /api/fotos-progresso/[id], que confere
// sessao e dono antes de servir os bytes.
export async function enviarImagemPrivada(
  arquivo: File,
  pasta: "fotos-progresso",
): Promise<{ publicId: string; formato: string }> {
  const resultado = await subir(arquivo, pasta, "privada");
  return { publicId: resultado.public_id, formato: resultado.format };
}

// Monta a URL assinada de uma imagem privada. Uso EXCLUSIVO do servidor:
// a assinatura do Cloudinary nao expira, entao essa URL nunca pode chegar
// ao navegador — se vazasse, valeria pra sempre e pra qualquer um. A rota
// que serve a foto usa isso pra buscar os bytes e repassar, sem nunca
// entregar o endereco em si.
export function urlAssinadaPrivada(publicId: string, formato: string): string {
  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: "image",
    format: formato,
    sign_url: true,
    secure: true,
  });
}
