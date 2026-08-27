@AGENTS.md

# Padrões de programação — VC Personal

> Este arquivo é lido automaticamente antes de qualquer alteração de código
> neste repositório. O que está aqui vale como regra, não como sugestão.
> Se uma regra não se aplicar ao caso, dizer explicitamente por quê — nunca
> ignorar em silêncio.

## Como trabalhamos

- **Decisão técnica**: decidir e explicar depois. **Decisão de produto/regra
  de negócio**: explicar e esperar confirmação. Na dúvida sobre em qual
  categoria a decisão cai, perguntar.
- Comentário no código explica **por que**, não **o que**. Se o "o quê" não
  estiver óbvio, o problema é o nome da variável/função, não a falta de
  comentário.
- Mensagem de commit explica o raciocínio, não só o arquivo alterado — o
  `git log` é a memória do projeto.
- Nunca declarar algo pronto sem ter testado de verdade. `npm run build`
  passar **não** é teste: é preciso exercitar o fluxo no navegador (ou por
  requisição real) antes de dizer que funciona.
- Sempre rodar o **build de produção** localmente antes de subir. Servidor de
  desenvolvimento esconde erro que só aparece no build.
- Melhoria fora do escopo pedido: pode sugerir e aplicar quando for
  claramente benéfica e não alterar regra de negócio. Regra de negócio nunca
  muda sem confirmação.

## Segurança — checklist obrigatório

Antes de terminar qualquer alteração, conferir os itens abaixo que tocarem
no que foi mexido. Cada um tem a razão junto porque a razão é o que faz
lembrar da regra em um caso novo que não está listado aqui.

### Segredos e configuração

- **Nenhuma chave, senha ou token em código.** Tudo por `process.env`, com o
  nome documentado no `.env.example` (sem o valor).
- `.env` está no `.gitignore` e **nunca** pode ser commitado. Ao usar
  `git add`, preferir `git add -A -- ':!.env'` e revisar `git status` antes
  do commit.
- Se um segredo vazar para o histórico do Git, **não basta apagar o
  arquivo**: o valor continua acessível em qualquer commit anterior. O
  procedimento é: (1) revogar/rotacionar a chave no serviço, imediatamente;
  (2) só depois limpar o histórico. Rotacionar é o que resolve; limpar o
  histórico é higiene.
- Chave que aparece no navegador (`NEXT_PUBLIC_*`) é **pública por
  definição**. Nunca prefixar assim uma chave de servidor.

### Autenticação e autorização

- **Toda** página e Server Action protegida chama `exigirSessao()` ou
  `exigirPapel(...)` do `src/lib/auth-guard.ts` — no próprio arquivo, sempre.
- **Nunca depender de `proxy.ts` nem de `layout.tsx` para segurança.** O
  proxy existe só para UX (evitar o flash da tela protegida); o layout
  renderiza em paralelo com a página, então as queries da página começam
  antes do redirect do layout acontecer. Quem protege é a própria página.
- Senha sempre com hash **bcrypt** (`src/lib/senha.ts`), nunca em texto puro,
  nunca com hash rápido (MD5/SHA sozinhos são feitos para serem rápidos —
  exatamente o oposto do que se quer aqui).
- Token de recuperação: guardar **só o hash** no banco, com prazo de
  expiração e marca de uso único. O token em si só existe no link enviado.
- Formulário que revela se um e-mail existe é enumeração de usuários:
  responder igual para e-mail existente e inexistente.
- Ação sensível pública (login, cadastro, recuperação de senha) precisa de
  **limite de tentativas** (`src/lib/rate-limit.ts`). O contador vive no
  **banco**, não em memória: a Render reinicia o processo a cada deploy e
  hiberna quando ocioso, o que zeraria um contador em memória.
- Sessão é JWT: uma vez emitida, vale até expirar mesmo que a conta seja
  desativada. Por isso `exigirSessao()` confere `ativo` no banco a cada
  requisição protegida.
- **Cookie só pode ser alterado em Server Action ou Route Handler.** Chamar
  `signOut()` de dentro de um Server Component devolve HTTP 500. Para
  encerrar sessão a partir de um guard, redirecionar para uma Route Handler
  (ver `src/app/api/sessao-encerrada/route.ts`).

### Acesso a dados

- **Toda query que busca registro de uma pessoa filtra pelo dono**:
  `where: { id, usuarioId: session.user.id }`. Nunca `findUnique({ id })`
  confiando no id que veio da URL — id em URL é palpite de qualquer um
  (IDOR). Quando o filtro tiver que ser separado, comparar explicitamente e
  recusar.
- Para atualizar registro do próprio usuário, preferir `updateMany` com o
  `usuarioId` no `where` a `update` com id solto: se o registro não for
  dele, a operação simplesmente não afeta linha nenhuma.
- **Nunca montar SQL por concatenação de string.** Usar Prisma (parametriza
  sozinho). Se um dia `$queryRaw` for realmente necessário, usar a forma
  com template tag (`` $queryRaw`...${valor}` ``), nunca `$queryRawUnsafe`.
- Resposta de API devolve **só o necessário**. Nunca espalhar o objeto
  inteiro do banco (`...usuario`) sem remover `senhaHash`, `cpfHash` e
  qualquer campo interno.
- Campo que o usuário não pode escolher (`role`, `ativo`, `valor`, `status`
  de pagamento) **nunca** vem do formulário. Vem do servidor. Validar com
  Zod usando `z.enum([...])` restrito é a segunda barreira, não a primeira.

### Entrada de dados

- **Toda** entrada validada com Zod no servidor, sempre. Validação no
  cliente é conveniência de UX; qualquer um manda o POST direto.
- Número opcional em formulário: usar o helper `numeroOpcional()`, nunca
  `z.coerce.number().optional()` — campo vazio vira `0` antes do
  `.optional()` rodar e a validação falha sem motivo aparente.
- Upload de arquivo: validar **tamanho** e **tipo** no servidor, e deixar o
  serviço de destino conferir o conteúdo real (`resource_type` +
  `allowed_formats` no Cloudinary). O `type` do arquivo vem do navegador e
  pode estar mentindo; e quando vem vazio (câmera de alguns Android) não dá
  para recusar só por isso.
- **SVG nunca entra como imagem enviada por usuário.** Navegador trata SVG
  como documento: um "SVG" com `<script>` dentro vira XSS hospedado no nosso
  próprio domínio.

### Saída e navegador

- React já escapa texto por padrão — é isso que nos protege de XSS. Por isso
  **`dangerouslySetInnerHTML` é proibido** neste projeto em conteúdo que
  passe por texto de usuário. Se algum dia for inevitável, sanitizar antes
  com biblioteca dedicada e justificar no comentário.
- Cabeçalhos de segurança ficam em `next.config.ts` e valem para todas as
  rotas: HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, e `poweredByHeader: false`.
- HTTPS é obrigatório em produção (a Render já redireciona; o HSTS elimina a
  primeira requisição em texto puro).
- Resposta com dado pessoal leva `Cache-Control: no-store, private` — não
  pode ficar em cache de CDN nem do navegador esperando a próxima pessoa que
  usar o aparelho.

### Webhook e integração externa

- Notificação de serviço externo (Mercado Pago) **nunca** é fonte de
  verdade. Duas camadas: (1) conferir a assinatura HMAC do header, provando
  que veio de quem diz ter vindo; (2) buscar o dado de volta na API deles
  antes de mudar qualquer coisa no banco. O corpo da notificação serve só
  como "vai lá conferir".
- Rota chamada por agendador (cron) se protege por segredo em variável de
  ambiente, não por sessão — não há usuário logado ali.
- Erro devolvido para fora nunca detalha o motivo interno. "Não autorizado"
  basta; explicar o que falhou só ajuda quem está tentando forjar.

### LGPD e dado pessoal

- **Dado de saúde é dado pessoal SENSÍVEL** (LGPD art. 5º, II): anamnese,
  lesões, peso, percentual de gordura, fotos de progresso. Merece cuidado
  maior que nome e e-mail, não igual.
- Todo model novo que guarde algo ligado a uma pessoa **precisa entrar** na
  exportação de `/api/meus-dados` (art. 18). Exportação incompleta não
  cumpre a lei.
- Exclusão de conta é *soft delete* + alerta para o admin, nunca `DELETE`
  automático: a lei também obriga a **reter** parte do dado (registro de
  pagamento, nota fiscal). Apagar de verdade é decisão humana.
- CPF não é guardado em texto puro. Hoje só existe `cpfHash` (uma via, serve
  para checar duplicidade). Se um dia for preciso **exibir** o CPF (nota
  fiscal), isso exige campo cifrado reversível, chave em variável de
  ambiente e acesso restrito a admin — decisão a tomar quando a necessidade
  aparecer, não antes.
- Minimização: não guardar dado que não vai ser usado. Cada campo novo com
  dado pessoal precisa de uma razão clara.

### Dependências

- Rodar `npm audit` periodicamente e antes de entregas relevantes.
- Vulnerabilidade em dependência **de desenvolvimento** (que não vai para o
  runtime de produção) não justifica um downgrade que quebre o projeto —
  mas precisa estar registrada e revisada, não ignorada.

## Armadilhas já encontradas neste projeto

Cada uma destas custou tempo de depuração. Conferir antes de repetir o
padrão:

- **Fuso horário em campo `@db.Date`**: o Prisma devolve esses campos como
  meia-noite **UTC**. Usar getter local (`getDate()`,
  `toLocaleDateString()`) mostra o dia errado quando o servidor não está em
  UTC. Para exibir campo `@db.Date`, usar getters **UTC**
  (`formatarDataCurta` em `src/lib/data.ts`); para gravar, usar
  `Date.UTC(ano, mes-1, dia)`. Campo `DateTime` de verdade (com hora) não
  tem esse problema e usa getters locais normalmente.
- **Limite de 1MB da Server Action**: o padrão do Next.js barra qualquer
  foto de celular. Já ajustado para 10mb em `next.config.ts` — qualquer
  fluxo novo de upload depende disso.
- **`display: contents` em `<form>`** para montar grid quebra no Safari
  mobile. Usar grid real por linha.
- **Server Component não aceita handler de evento** (`onChange`, `onClick`).
  Extrair para um componente com `"use client"`.
- **Erro lançado em Server Action não chega legível ao usuário em
  produção** — o Next.js mascara com mensagem genérica. Para erro que a
  pessoa precisa ler, retornar estado pelo `useActionState` em vez de
  `throw`.

## Banco de dados — cuidado redobrado

**Existe UM banco só, compartilhado entre desenvolvimento e produção.** Não
há ambiente de teste separado. Decisão revista e mantida em 27/08/2026
enquanto o app está em fase de teste — mas com atenção explícita a comandos
destrutivos.

- **Proibido** neste projeto: `prisma migrate reset`, `db push
  --force-reset`, `DROP`, `TRUNCATE`, e qualquer `DELETE`/`deleteMany` sem
  filtro. Não existe "só testar e ver no que dá" aqui.
- Teste que escreve no banco limpa exatamente o que criou (filtrando pela
  chave do próprio teste) e restaura o que sobrescreveu.
- Antes de migration destrutiva (remover ou renomear coluna): conferir a
  contagem de linhas primeiro e registrar isso na própria migration.
  Migration segura em tabela vazia deixa de ser segura com dado dentro.
- O Neon gratuito guarda só **24h** de histórico para restaurar.
- Reabrir a conversa sobre separar dev de produção **antes do primeiro aluno
  pagante entrar** — a decisão atual vale só para o período de teste.

## Antes de subir para produção

1. `npx tsc --noEmit` — sem erro de tipo.
2. `npm run build` — build de produção passa.
3. Fluxo alterado exercitado de verdade (navegador ou requisição real).
4. `git status` revisado — nada de `.env` ou segredo no diff.
5. Push → deploy automático na Render → conferir no ar antes de dar por
   encerrado.
