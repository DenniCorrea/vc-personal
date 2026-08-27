// Reducao de imagem NO NAVEGADOR, antes de enviar pro servidor.
//
// Por que isso existe: foto de celular novo passa fácil de 10MB (48MP no
// iPhone, 108MP em alguns Android). Esse tamanho estourava o limite de
// corpo das Server Actions e devolvia uma tela de erro genérica —
// "This page couldn't load" — sem a pessoa entender o motivo.
//
// A saída óbvia seria só aumentar o limite do servidor, mas isso seria a
// escolha errada por três motivos: o aluno costuma enviar a foto do
// celular na academia, no 4G (subir 12MB ali é lento e caro pra ele); o
// Cloudinary gratuito tem cota; e a Render gratuita tem 512MB de RAM, que
// não sobra pra segurar arquivos grandes de várias pessoas ao mesmo tempo.
//
// E, principalmente: a foto é EXIBIDA em uma miniatura. Nunca precisou
// dos 4032px originais. Reduzir aqui é a correção certa, não um paliativo.

const LADO_MAXIMO = 1600; // suficiente pra ampliar e comparar evolução
const QUALIDADE = 0.85;

// Acima disso nem tentamos processar: navegador de celular antigo pode
// travar tentando desenhar uma imagem gigante num canvas.
const LIMITE_ABSOLUTO = 40 * 1024 * 1024;

export type ResultadoReducao =
  | { ok: true; arquivo: File; reduzida: boolean }
  | { ok: false; erro: string };

function carregar(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("navegador não conseguiu ler a imagem"));
    };
    img.src = url;
  });
}

export async function reduzirImagem(arquivo: File): Promise<ResultadoReducao> {
  if (arquivo.size > LIMITE_ABSOLUTO) {
    return { ok: false, erro: "Essa imagem é grande demais (acima de 40MB). Escolha outra foto." };
  }

  try {
    const img = await carregar(arquivo);
    const maiorLado = Math.max(img.width, img.height);

    // Já é pequena o bastante e não é um formato que precise converter —
    // manda como está, sem perder qualidade à toa.
    if (maiorLado <= LADO_MAXIMO && arquivo.size <= 2 * 1024 * 1024) {
      return { ok: true, arquivo, reduzida: false };
    }

    const escala = Math.min(1, LADO_MAXIMO / maiorLado);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);

    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: true, arquivo, reduzida: false };
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", QUALIDADE));
    if (!blob) return { ok: true, arquivo, reduzida: false };

    // Sempre .jpg: o canvas so devolve JPEG/PNG/WEBP, entao mesmo uma foto
    // HEIC de iPhone sai daqui como JPEG — o que resolve de quebra o
    // formato que o Cloudinary as vezes recusa.
    const nome = arquivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return { ok: true, arquivo: new File([blob], nome, { type: "image/jpeg" }), reduzida: true };
  } catch {
    // Navegador que nao decodifica o formato (HEIC no Chrome do desktop, por
    // exemplo). Se ainda couber no limite do servidor, deixa passar e o
    // Cloudinary decide; se nao couber, avisa aqui com mensagem clara em vez
    // de deixar estourar numa tela de erro sem explicacao.
    if (arquivo.size > 9 * 1024 * 1024) {
      return {
        ok: false,
        erro: "Não consegui preparar essa foto (formato não suportado pelo navegador) e ela é grande demais para enviar. Tente tirar uma nova foto ou salvá-la como JPG.",
      };
    }
    return { ok: true, arquivo, reduzida: false };
  }
}
