# Handoff: App Método Líder — Victor Carvalho (consultoria de alta performance)

## Visão geral

App web (PWA) para a consultoria de alta performance do Victor Carvalho (@victorcarvalhopersonal). Dois produtos numa mesma base:

- **Painel do Aluno (mobile-first)** — responde "o que preciso fazer hoje para continuar evoluindo?". Navegação por bottom navigation bar de 5 itens, uso com uma mão durante o treino.
- **Painel do Consultor/Admin (desktop)** — responde "quem precisa da minha atenção hoje?". Sidebar fixa à esquerda, visual de software SaaS corporativo, conteúdo na área central.

Posicionamento: premium, sério, maduro, humano. **Regra de ouro:** nada de app genérico de academia, nada de gráficos decorativos, nada de gamificação (sem badges, medalhas, confetes, streaks infantis, emojis). Métricas só quando acionáveis.

## Sobre os arquivos de design

O arquivo `Metodo Lider App.dc.html` deste pacote é uma **referência de design feita em HTML** — um protótipo que mostra aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar esses designs no ambiente do codebase de destino** (React/Next, Vue, etc.), usando os padrões, bibliotecas e convenções já estabelecidos lá. Se ainda não existe codebase, escolha o stack apropriado e implemente os designs nele.

O HTML usa um runtime próprio de streaming (tags `<x-dc>`, `<helmet>`, estilos inline). **Ignore esse runtime.** Extraia dele: estrutura, hierarquia, medidas, cores, tipografia, copy e comportamentos.

## Fidelidade

**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos e estados são finais e devem ser recriados fielmente. Exceções explicitamente marcadas como placeholder (vídeos, figuras anatômicas, fotos de progresso) precisam dos assets reais.

---

## Design tokens

### Cores

| Token | Hex / valor | Uso |
|---|---|---|
| `bg/base` | `#0E0D0C` | fundo da aplicação, canvas |
| `bg/surface` | `#100F0D` | superfície de tela (mobile shell, admin content) |
| `bg/panel` | `#131210` | sidebar admin, tabelas |
| `bg/card` | `#161412` (mobile) / `#151311` (admin) | cards |
| `bg/input` | `#0F0E0C` | campos de formulário |
| `accent` | `#C9A87C` | acento único (areia/caramelo): CTAs, rótulos, item ativo |
| `accent/hover` | `#E0C79E` | hover de botão primário |
| `accent/wash` | `rgba(201,168,124,0.08–0.14)` | fundo de item selecionado/ativo |
| `accent/border` | `rgba(201,168,124,0.30–0.55)` | bordas de destaque |
| `text/primary` | `#F6F3EE` | títulos |
| `text/body` | `#F4F1EC` / `#EDE9E3` | texto de interface |
| `text/muted` | `rgba(237,233,227,0.55)` | secundário |
| `text/subtle` | `rgba(237,233,227,0.45)` | rótulos |
| `text/faint` | `rgba(237,233,227,0.35)` | placeholders, cabeçalhos de tabela |
| `border/hairline` | `rgba(237,233,227,0.10–0.14)` | bordas de card e divisores |
| `alert` | `#C0483B` | vermelho: músculo em destaque, aluno em risco, alerta de lesão |

Paleta derivada das fotos do Victor (grafite quente, areia, off-white). **Apenas um acento.** O vermelho é semântico (anatomia + alerta), nunca decorativo.

### Tipografia

- **Display / falas:** `Instrument Serif`, regular 400, itálico para ênfase. Títulos de tela 28–40px, hero 66px, citações 21–34px. `letter-spacing: -0.02em` nos tamanhos grandes, `line-height` 1.02–1.45.
- **Interface:** `Manrope` 300/400/500/600/700. Corpo 13–15px, `line-height` 1.6–1.7. Números de destaque 26–30px/600.
- **Rótulos (eyebrow):** Manrope, 10–11px, `letter-spacing` 0.16–0.24em, `text-transform: uppercase`, cor `accent` ou `text/subtle`.
- **Monoespaçado:** `ui-monospace` 9–12px, só em placeholders de asset e valores de referência ("22×10").

### Espaçamento, raio, elevação

- Escala: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 26 / 34 / 40 / 48 px.
- Padding de card: 20–22px (mobile), 18–20px (admin). Gutter mobile 24px. Padding do conteúdo admin 34px/38px.
- **Raio:** `2px` em botões, inputs, chips, badges. `4px` em cards e tabelas. `6px` em janelas/containers. `50%` em avatares. Bolhas de chat 4/12px. Nada de cantos muito arredondados.
- **Sem box-shadow.** Profundidade vem de borda hairline + variação de fundo. Único blur: `backdrop-filter: blur(12–14px)` em barras fixas e no card de login.
- Alvos de toque mobile: mínimo 44px de altura.

---

## Telas

### 1. Login / Onboarding (hero com parallax) — desktop e mobile

**Objetivo:** apresentar a marca e o método antes do login. Página de rolagem única cujo destino é o formulário.

**Estrutura:** container de rolagem com conteúdo de **2400px** de altura sobre uma viewport de 700px (no protótipo; em produção usar `100vh`). Camadas absolutas transladadas em função de `scrollTop`.

| Camada | Fator | Conteúdo |
|---|---|---|
| 1 | 0.90 (move 0.10 do scroll) | degradê radial `radial-gradient(120% 90% at 72% 18%, #2A2622 0%, #14120F 55%, #0B0A09 100%)` |
| 2 | 0.72 (move 0.28) | marca d'água tipográfica "MÉTODO", Instrument Serif 230px, `rgba(201,168,124,0.07)` |
| 3 | 0.45 (move 0.55) | foto do Victor, 520×760, `object-position: 50% 12%`, máscara `linear-gradient(to bottom, #000 78%, transparent)`, `filter: contrast(1.05) saturate(0.92)` |
| 4 | 0.12 → 1.00 | copy do hero, citação e card de login (velocidade normal) |

Implementação: `transform: translateY(scrollTop * fator)` por camada, arredondado para inteiro; usar `requestAnimationFrame`/`will-change: transform` e respeitar `prefers-reduced-motion` (desligar parallax, layout empilhado).

**Blocos de conteúdo (posições no eixo de rolagem):**
- y≈150, esquerda 72px, largura 480: eyebrow "CONSULTORIA DE ALTA PERFORMANCE"; H1 Instrument Serif 66px "Constância / vale mais que / *motivação*." (a palavra "motivação" em itálico + `accent`); parágrafo 16px "Mentalidade, método e acompanhamento próximo. Continue rolando para acessar sua conta."; indicador "ROLE PARA ENTRAR" com filete vertical de 34px em degradê do accent.
- y≈1080: citação Instrument Serif 34px "Disciplina é o que sustenta o resultado depois que a vontade passa." + assinatura "VICTOR CARVALHO".
- y≈1700, centralizado: card de login, largura 432px, `rgba(20,18,15,0.86)` + `backdrop-filter: blur(14px)`, borda hairline, padding 44/40/38. Eyebrow "MÉTODO LÍDER"; H3 Instrument Serif 32px "Acessar minha conta"; campos E-mail e Senha (inputs **sem caixa**: apenas `border-bottom: 1px solid rgba(237,233,227,0.2)`, padding 10px 0, 15px); botão primário full-width 16px, `#C9A87C` sobre texto `#14120F`, 12px/600, uppercase, tracking 0.16em, "ENTRAR"; rodapé 13px "Esqueci minha senha" e "Primeiro acesso? Convite".

**Mobile:** mesma sequência em coluna; foto no topo com máscara, card de login ocupando a largura menos 24px de gutter.

### 2. Dashboard do Aluno (mobile, 390×844)

**Objetivo:** o que fazer hoje. Ordem dos blocos é intencional.

- **Header (padding 52/24):** eyebrow "TERÇA · SEMANA 6"; saudação Instrument Serif 30px "Bom dia, {nome}"; avatar 40px circular à direita com borda accent.
- **Mensagem de mentalidade** (primeiro card, borda `accent/border`, fundo `linear-gradient(160deg, rgba(201,168,124,0.10), rgba(201,168,124,0.02))`): eyebrow "MENTALIDADE DE HOJE", texto Instrument Serif 21px/1.45, rodapé "Victor · 2 min de leitura".
- **Treino de hoje:** eyebrow + "Plano 4x/semana" à direita; título 22px/600 "Treino B · Superiores"; meta 13px "7 exercícios · ~55 min · Peito, tríceps, ombro"; CTA primário "INICIAR TREINO".
- **Metas do dia:** barras de progresso de **3px** de altura, trilha `rgba(237,233,227,0.12)`, preenchimento `accent`, raio 2px. Água 2,1/3,5 L (60%); Sono 6h40/8h (83%). Sem ícones, sem percentuais grandes.
- **Nutrição · check-in:** contador "2 de 5 refeições"; refeições concluídas com `line-through` e texto esmaecido; a próxima com botão-chip "Check-in" com borda accent.
- **Recado do Victor:** avatar 36px + "Victor comentou seu treino" + trecho da mensagem.
- **Bottom nav (fixa, 5 itens):** Hoje / Treino / Nutrição / Evolução / Perfil. `rgba(16,15,13,0.94)` + blur 12px, borda superior hairline, padding 14/12/26, item ativo em `accent`, inativo `rgba(237,233,227,0.45)`, label 10px. Ícones no protótipo são formas geométricas simples — **substituir por um icon set de traço fino (1.5px), monocromático**.

### 3. Área de Treino — execução e registro de carga (mobile) — **o diferencial**

- **Header:** voltar / "TREINO B · SUPERIORES" + "Exercício 3 de 7" / cronômetro "28:14".
- **Título:** Instrument Serif 30px "Supino inclinado com halteres"; meta "4 séries · 8–10 reps · descanso 90s · cadência 3-1-1".
- **Vídeo de instrução:** bloco 196px de altura, botão play circular 52px com borda accent. *(placeholder — precisa do vídeo real)*
- **Figura anatômica:** bloco 118px de largura, mínimo 150px de altura, com o músculo trabalhado destacado em `#C0483B` (opacidade 0.85). Ao lado, card "MÚSCULOS": principal em vermelho com o rótulo "principal", secundários em texto esmaecido, e uma dica de execução. *(placeholder — precisa das figuras anatômicas reais, uma por grupo muscular, idealmente SVG com regiões nomeadas para colorir por exercício)*
- **Registro de séries (bloco em destaque, borda accent):**
  - Cabeçalho: "REGISTRAR HOJE" + "Último: 20/08".
  - Grid de 4 colunas: `36px | 1fr | 1fr | 64px` → Sér / Carga (kg) / Reps / **Antes**.
  - Inputs numéricos grandes: 17px/600, padding 12px, fundo `#0F0E0C`. A série ativa tem borda `rgba(201,168,124,0.45)`; as demais `rgba(237,233,227,0.14)`.
  - Coluna "Antes": monoespaçado 12px com o valor do último treino (`22×10`, `22×9`, `22×8`) — **referência sempre visível, nunca escondida atrás de toque**.
  - Rodapé: comparação em texto, "Você subiu 2kg em relação ao último treino."
  - Teclado numérico no mobile (`inputMode="decimal"`), salvamento otimista por série, funcionamento offline com sincronização posterior (a academia costuma ter sinal ruim).
- **Barra de ação fixa:** "DESCANSO 90S" (secundário, inicia timer) + "SALVAR SÉRIE" (primário, `flex: 1.4`).

### 4. Módulo de Nutrição — check-in (mobile)

- Header: data + "Plano alimentar" (Instrument Serif 30px).
- Refeições já resolvidas: card recolhido, `opacity: 0.72`, com o resultado no canto ("Segui o planejamento" em accent / "Fiz adaptações" em texto muted) e, quando houver, a justificativa citada num bloco com filete accent à esquerda e fundo `rgba(201,168,124,0.06)`.
- **Refeição atual (expandida, borda accent + gradiente):** nome 17px/600, horário, composição, e os dois botões de check-in: **"SEGUI O PLANEJAMENTO"** (primário) e **"FIZ ADAPTAÇÕES"** (secundário). O secundário revela o campo "O QUE MUDOU?" — textarea 70px mínimo — com a nota "Victor lê as adaptações no fim do dia."
- Refeições futuras: card simples com horário.
- Rodapé: "Aderência na semana — 86%" (número 20px em accent). Um número, não um gráfico.

### 5. Catálogo de Planos e Checkout (desktop 1040 total; empilha no mobile)

**Catálogo (640px):** eyebrow "CONSULTORIA"; H2 Instrument Serif 38px "Escolha sua frequência"; parágrafo explicativo; **alternador segmentado** "Treino + nutrição" / "Somente treino" (pílula ativa em `accent` com texto `#14120F`); grid de 3 cards de frequência — 2x R$ 249, **4x R$ 389 (destacado: borda accent, gradiente, tag "MAIS ESCOLHIDO" em cima da borda)**, 6x R$ 529 — cada um com preço 26px/600 e lista de entregáveis em 12px/1.7. Nota: "Também disponível: 1x, 3x, 5x e 7x por semana." O catálogo real deve cobrir **1x a 7x, com e sem nutrição**.

**Checkout (400px):** eyebrow "CHECKOUT"; H3 do plano escolhido; três formas de pagamento como linhas selecionáveis:
- **Pix** — selecionada por padrão, borda accent + wash, "Aprovação imediata", tag **"6% OFF"**;
- **Cartão de crédito** — "até 12x";
- **Débito** — "à vista".

Resumo: Mensalidade R$ 389,00 · Desconto Pix (6%) −R$ 23,34 (em accent) · **Total R$ 365,66** (28px/600). O desconto de 6% aplica-se somente ao Pix e o total recalcula ao trocar a forma de pagamento. CTA "GERAR PIX" (o rótulo muda conforme o método). Nota final: "Renovação mensal. Cancele quando quiser, sem multa."

### 6. Onboarding / Anamnese (mobile, 4 etapas)

Barra de progresso em 4 segmentos de 2px (concluídos em accent). Eyebrow "ETAPA 2 DE 4"; H2 Instrument Serif 30px "Onde você está hoje?"; subtítulo "Essas respostas definem a sua primeira ficha. Leva menos de dois minutos."

Controles: lista de opção única (item selecionado com borda accent, wash e "✓"); seletor de 1–7 dias em grid de 7 (selecionado em accent sólido); chips de objetivo (Hipertrofia / Emagrecimento / Saúde e constância / Performance); textarea de lesões e restrições. Barra fixa "VOLTAR" + "CONTINUAR". As respostas alimentam a montagem da primeira ficha e o alerta de lesão no painel do Victor.

### 7. Evolução do Aluno (mobile)

- Header: "SEMANA 6 DE 24" + "Sua evolução".
- **Progressão de carga:** por exercício, "22 → 24 kg" em accent quando houve evolução, cinza quando estagnou; barra de 3px. Sem gráfico de linhas.
- Dois cards lado a lado: Peso 78,4 kg ("−1,2 kg em 6 semanas") e Treinos feitos 21/24 ("88% de constância").
- **Fotos de acompanhamento:** grid 2×, 150px de altura, comparação semana 1 vs. semana 6, com ação "Enviar". *(placeholder — fotos do aluno)*
- **Medidas:** lista com valor atual e delta em accent (Cintura 82 cm −3; Braço direito 34 cm +1; Coxa 57 cm +1,5).

### 8. Mensagens (mobile)

Header com avatar do Victor e "Responde em até 12h". Bolhas: recebida `#1A1714`, raio `4px 12px 12px 12px`, máx. 280px; enviada `rgba(201,168,124,0.14)` com borda accent, raio `12px 4px 12px 12px`. Separador de data em uppercase 11px. Mensagem de áudio: play circular 32px + duração. Composer: input + botão quadrado 48px em accent.

### 9. Painel do Victor — Visão do dia (desktop 1280×800)

**Sidebar fixa (236px, `#131210`, borda direita hairline):** marca "Método Líder" (Instrument Serif 20px) + "PAINEL DO CONSULTOR"; itens de 12/14px — Visão do dia · Alunos (contador 48) · Fichas de treino · Planos alimentares · Check-ins (**badge 9 em `#C0483B`**) · Mensagens · Mentalidade do dia · Planos e pagamentos. Item ativo: wash accent + `border-left: 2px solid #C9A87C`. Rodapé com avatar e nome do consultor.

**Conteúdo (padding 34/38):** data + H2 Instrument Serif 34px "Quem precisa da sua atenção hoje" + CTA "PUBLICAR MENTALIDADE".

**Quatro cards de triagem:** "Sem treino há 3+ dias" → 6 (em `#C0483B`); "Check-ins a responder" → 9; "Fichas a vencer" → 4; "Aderência média" → 81% (em accent). Números 30px/600.

**Tabela de atenção** — colunas `2fr | 1.1fr | 1fr | 1fr | 130px`: Aluno (nome 15px + plano 12px) · Situação (vermelho quando é risco, accent quando aguarda ação, muted quando é rotina) · Último treino · Aderência · **ação específica por linha** (botão-chip com borda accent: "Falar agora", "Responder", "Montar ficha", "Ver check-in"). Cada linha oferece exatamente a ação que resolve aquele caso — a triagem é o produto.

### 10. Painel do Victor — Aluno em detalhe + editor de ficha (desktop)

- **Cabeçalho do aluno:** avatar 56px, nome Instrument Serif 30px, meta "Plano 4x + nutrição · desde 12/07 · hipertrofia", ações "MENSAGEM" (secundário) e "PUBLICAR FICHA" (primário).
- **Abas:** Ficha de treino (ativa, sublinhado accent) · Nutrição · Check-ins · Evolução · Anamnese.
- **Editor de ficha (grid `1fr | 300px`):** abas de treino A–D + "+ exercício"; tabela `24px | 2fr | 70px | 90px | 90px | 1fr` → alça de arrastar (⋮⋮) · Exercício · Séries · Reps · Descanso · Observação. Linhas reordenáveis por arrasto; células editáveis inline.
- **Coluna lateral:** card **de alerta** (borda e texto em `#C0483B`, fundo `rgba(192,72,59,0.07)`) com a restrição declarada na anamnese ("dor no ombro direito… evitar desenvolvimento militar") — deve aparecer sempre que a anamnese registrar lesão; card "ÚLTIMOS 7 DIAS" (treinos 4/4, nutrição 86%, sono 6h50, carga total +4% em accent); card "NOTA INTERNA" (visível só para o Victor).

### 11. Painel do Victor — Plano alimentar + Mentalidade do dia (desktop)

- **Plano alimentar (grid `1fr | 340px`):** tabela `150px | 1fr | 90px | 100px` → Refeição · Composição · Kcal · **Aderência** (accent quando alta, muted quando média, `#C0483B` quando baixa). Lateral: "ADAPTAÇÕES A REVISAR" com a justificativa do aluno citada, data, e CTA "RESPONDER ALUNO"; card "METAS DIÁRIAS" (água, sono, proteína) editável.
- **Mentalidade do dia:** editor com textarea em Instrument Serif 22px sobre card com gradiente accent, rodapé "Publica hoje às 06h00" e contador "72 / 180 caracteres"; CTA "AGENDAR PUBLICAÇÃO"; lateral "PRÓXIMAS" com a fila de mensagens datadas. A mensagem publicada aparece no card de mentalidade do dashboard do aluno.

---

## Interações e comportamento

- **Parallax do login:** ver tabela de fatores na tela 1. `translateY` por camada em função do scroll, via rAF. Desativar sob `prefers-reduced-motion`.
- **Transições:** 150–200ms `ease-out` em cor/borda/opacidade. Nenhuma animação de layout, nenhum bounce, nada de spring. Movimento é sóbrio.
- **Hover:** botão primário `#C9A87C → #E0C79E`; secundário clareia a borda de `0.2` para `0.5` de alfa; linhas de tabela clareiam levemente o fundo; item de sidebar ganha wash accent.
- **Foco:** anel de foco visível em accent (não remover outline sem substituto) — acessibilidade obrigatória.
- **Registro de carga:** salvamento por série, otimista, com fila offline; o valor "Antes" vem do último registro daquele exercício.
- **Timer de descanso:** iniciado pelo botão, continua rodando em background com notificação ao fim.
- **Check-in de nutrição:** "Fiz adaptações" abre o textarea e só conclui com o texto enviado; gera item na fila de revisão do Victor.
- **Checkout:** trocar método recalcula o total (6% só no Pix) e muda o rótulo do CTA.
- **Estados vazios:** texto curto em `text/muted`, sem ilustração. Ex.: "Nenhum check-in aguardando." Carregamento: skeleton em `#151311`, sem spinners coloridos.
- **Erros de formulário:** mensagem 12px em `#C0483B` sob o campo, borda do campo em `#C0483B`.
- **Responsivo:** telas de aluno são mobile-first (breakpoint de conteúdo 390–430px, máx. 520px centralizado no desktop). Painel admin a partir de 1024px; abaixo disso, sidebar colapsa em drawer e as tabelas viram cards empilhados.

## Estado necessário

- **Sessão:** usuário, papel (`aluno` | `consultor`), token.
- **Aluno:** plano ativo (frequência, com/sem nutrição), ficha atual + treino do dia, sessão de treino em andamento (exercício atual, séries registradas, timer), histórico de carga por exercício, metas diárias (água, sono), check-ins de nutrição do dia, mentalidade do dia, medidas/fotos/peso, thread de mensagens.
- **Consultor:** fila de triagem (sem treino há N dias, check-ins pendentes, fichas a vencer, aderência média), aluno selecionado e suas abas, rascunho de ficha (com reordenação), plano alimentar, fila de mentalidade agendada.
- **Onboarding:** respostas da anamnese por etapa, persistidas parcialmente (o usuário pode sair e voltar).

## Assets

- **Fotos do Victor** (`uploads/victor/`, fornecidas pelo usuário): retrato de estúdio em fundo grafite (usado no hero do login e nos avatares) e foto de evento. **Pendente:** definir se as fotos finais virão com fundo removido (recorte) para composição do hero.
- **Pendentes (placeholders no protótipo, com hachura diagonal e legenda monoespaçada):** vídeos de instrução por exercício; figuras anatômicas simples por grupo muscular com o músculo alvo em `#C0483B` (idealmente SVG com regiões nomeadas); fotos de acompanhamento dos alunos.
- **Ícones:** substituir as formas geométricas do protótipo por um icon set de traço fino monocromático (1.5px), sem preenchimento e sem cor própria.
- **Fontes:** Instrument Serif e Manrope (Google Fonts) — auto-hospedar em produção.

## Arquivos

- `Metodo Lider App.dc.html` — protótipo hifi com as 11 telas, organizado em três seções (Turno 3 no topo, depois Turno 2, depois Turno 1). Ids de referência: `1a` login/parallax, `1b` dashboard do aluno, `2a` área de treino, `2b` nutrição, `2c` planos e checkout, `2d` painel visão do dia, `3a` onboarding, `3b` evolução, `3c` mensagens, `3d` aluno em detalhe/ficha, `3e` plano alimentar/mentalidade.
- `uploads/victor/` — fotos originais do Victor.
- `screenshots/` — captura de cada tela, nomeada pelo id: `1a-login-parallax`, `1b-dashboard-aluno`, `2a-area-de-treino`, `2b-nutricao-checkin`, `2c-planos-checkout`, `2d-admin-visao-do-dia`, `3a-onboarding-anamnese`, `3b-evolucao`, `3c-mensagens`, `3d-admin-aluno-ficha`, `3e-admin-nutricao-mentalidade`. Telas com rolagem interna aparecem no estado inicial — o HTML é a fonte para o conteúdo completo.
