# Status operacional — Victor Carvalho Personal

> Atualizado em 06/11/2026.
>
> **Para que serve este arquivo:** retomar o trabalho sem reler a conversa
> inteira. É o documento *operacional* — onde as coisas estão, o que está
> pronto, o que trava o quê.
>
> Não confundir com os outros três:
> - **`README.md`** — o projeto contado de fora: o problema, a pivotagem,
>   as decisões. É a porta de entrada de quem nunca viu o repositório.
> - **`CLAUDE.md`** — as regras de código. Lido antes de qualquer alteração.
> - **`AGENTS.md`** — aviso do Next.js 16, gerado pela própria ferramenta.
>
> Quando algo mudar, atualize **um** deles — o que couber. Foi a duplicação
> entre este arquivo e o README que deixou os dois se contradizendo por dois
> meses e meio.

## O que está no ar

| | |
|---|---|
| App | victorcarvalhopersonal.onrender.com |
| Código | github.com/DenniCorrea/vc-personal |
| Deploy | Render — automático a cada push na `master` |
| Banco | Neon (PostgreSQL) — **o mesmo em dev e produção** |

O inventário de contas e links de cada serviço (Neon, Resend, Cloudinary,
Mercado Pago, AWS) está no `Contas_e_Links_VC_Personal.docx`, **fora do
repositório**, de propósito — ver "Onde ficam os documentos" no fim.

## Produto: dois, um ligado

O app atende dois públicos na mesma base de código:

- **Mentoria B2B** — o Victor vende para outros personal trainers.
  **É o produto em operação.** 19 telas do mentorado, 34 do admin.
- **Área do aluno (B2C)** — personal training para o cliente final dele.
  **Pausada desde 28/08/2026**, por decisão de negócio: a mentoria tem
  ticket maior e foi priorizada.

A pausa é **uma linha**: `ALUNO_PAUSADO` em `src/lib/feature-flags.ts`.
Nada foi apagado. Voltar a ligar é trocar `true` por `false` e testar os
fluxos — as correções feitas na mentoria foram aplicadas na camada
compartilhada, então a área do aluno já as herdou.

A referência visual dessa área está em `design_handoff_aluno_b2c/`.

## O que trava o quê

| Pendência | Quem resolve | O que destrava |
|---|---|---|
| Credenciais do Mercado Pago | Victor | Checkout real (código pronto e testado em sandbox) |
| Dados do Victor (nome/CNPJ, contato, prazo de guarda) | Victor | Publicar a política de privacidade no app |
| Decisão da conta do Vimeo (dele ou do Denni) | Denni + Victor | Upload de vídeo em nome do dono certo |
| Health check de infra (endpoint + Render Cron) | Denni | Monitoramento — combinado, ainda não feito |

Nada aqui bloqueia o resto: o app funciona hoje sem nenhum desses itens.

## Armadilhas que já custaram caro

Todas estão detalhadas no `CLAUDE.md`, com o porquê. As que mais voltam:

- **Fuso horário** — o Render roda em UTC, a máquina local não. Fuso é
  sempre declarado, nunca herdado do processo.
- **Erro em Server Action** não chega legível em produção; devolver estado
  por `useActionState` em vez de `throw`.
- **Banco compartilhado** entre dev e produção: comando destrutivo é
  proibido no projeto. Reabrir essa decisão **antes do primeiro cliente
  pagante**.
- **Build de produção** localmente antes de todo push — o servidor de
  desenvolvimento esconde erro que só aparece no build.

## Onde ficam os documentos

Documento de negócio **não entra no repositório**, mesmo sem senha dentro:
o repositório é público desde 11/2026, e esse material não precisa estar
lá. Todos ficam em `Documentos/Estudo APP Victor/`:

| Arquivo | O que é |
|---|---|
| `Contas_e_Links_VC_Personal.docx` | Onde cada serviço está e para que serve (sem senhas) |
| `Guia_de_Estudos_VC_Personal.docx` | Material de estudo do Denni sobre o que foi construído |
| `Apresentacao_Metodo_Lider_VC_Personal.pptx` | Apresentação do app para o Victor |
| `Politica_de_Privacidade_VC_Personal_RASCUNHO.docx` | Rascunho, esperando os dados do Victor |

As **senhas** não estão em nenhum arquivo: ficam no gerenciador de senhas
pessoal, e as chaves técnicas só no `.env` local e nas variáveis de
ambiente do Render.

## Como retomar

1. `README.md` para o contexto, este arquivo para o estado.
2. `git log --oneline` — cada mensagem explica o **porquê**, não só o que
   mudou. É a memória real do projeto.
3. `CLAUDE.md` antes de escrever qualquer código.
