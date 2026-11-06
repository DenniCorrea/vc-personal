# Especificação responsiva — App Método Líder

**Documento obrigatório para implementação.** O protótipo HTML mostra cada tela dentro de uma moldura de tamanho fixo (390×844 para aluno, 1280×800 para admin) apenas para permitir a comparação lado a lado no canvas de design. Essas molduras **não são o layout final** — são a viewport-alvo de cada uma. Traduza-as conforme abaixo.

## Princípio

O app tem **dois produtos com prioridades opostas**:

| Produto | Viewport de referência | Prioridade | Navegação |
|---|---|---|---|
| **Painel do Aluno** | **390×844** (iPhone 13/14/15) | **Mobile-first — é o uso real, na academia, com uma mão** | Bottom navigation bar fixa |
| Painel do Consultor (admin) | 1280×800 | Desktop-first | Sidebar fixa 236px |

**O aluno nunca vai usar desktop.** Todo o CSS das telas de aluno deve ser escrito primeiro para 390px e só depois receber `min-width` para telas maiores. Nenhuma tela de aluno pode depender de hover para funcionar.

## Configuração base do projeto

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0E0D0C">
<meta name="color-scheme" content="dark only">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

- `viewport-fit=cover` + `env(safe-area-inset-*)` são obrigatórios: a bottom nav e as barras de ação fixas precisam respeitar o home indicator do iPhone.
- **Sem `maximum-scale` e sem `user-scalable=no`** — quebra acessibilidade.
- App é **dark-only**. Fixe `color-scheme: dark` para o iOS não inverter inputs.
- PWA instalável: manifest com `display: "standalone"`, `background_color` e `theme_color` = `#0E0D0C`, ícones 192/512, orientação `portrait` para as telas de aluno.
- Reset global: `box-sizing: border-box`, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior-y: contain` (evita pull-to-refresh acidental no meio do treino).
- `100vh` **não serve** no mobile (barra do navegador). Usar `100dvh` com fallback:
  ```css
  .app-shell { height: 100vh; height: 100dvh; }
  ```

## Breakpoints

```
xs   0–389px      celular pequeno (iPhone SE, 375px)  → conteúdo fluido, gutter 20px
sm   390–767px    ALVO PRINCIPAL do aluno             → gutter 24px
md   768–1023px   tablet                              → aluno centralizado máx 520px; admin em drawer
lg   1024–1439px  desktop                             → admin com sidebar fixa
xl   1440px+      desktop grande                      → admin com conteúdo máx 1400px, centralizado
```

## Telas do aluno — como traduzir a moldura de 390×844

A moldura do protótipo mapeia assim:

| Elemento no protótipo | Implementação real |
|---|---|
| `width: 390px` da moldura | `width: 100%` (viewport) |
| `height: 844px` da moldura | `min-height: 100dvh` |
| `border-radius: 34px` da moldura | **descartar** (é o bezel do desenho) |
| `padding-top: 48px` do header | `padding-top: calc(20px + env(safe-area-inset-top))` |
| gutter lateral de 24px | `padding-inline: 24px` (20px abaixo de 390px) |
| `flex: 1; overflow-y: auto` do conteúdo | rolagem natural da página, ou `flex:1; overflow-y:auto; -webkit-overflow-scrolling: touch` se o header for fixo |
| `padding-bottom: 110px` do conteúdo | `padding-bottom: calc(88px + env(safe-area-inset-bottom))` — espaço da bottom nav |
| barra inferior `position: absolute` | `position: fixed; bottom: 0; left: 0; right: 0` + `padding-bottom: calc(14px + env(safe-area-inset-bottom))` |

**Regra crítica de layout** (o protótipo já tem essa correção): dentro de qualquer coluna flex de altura fixa com rolagem, **todo card filho precisa de `flex-shrink: 0`**. Sem isso os cards são comprimidos e o conteúdo é cortado em vez de rolar.

Escala fluida acima de 390px (não esticar cards indefinidamente):

```css
.student-shell { width: 100%; max-width: 520px; margin-inline: auto; }
@media (min-width: 768px) {
  /* aluno em tablet/desktop: coluna centralizada sobre o fundo #0E0D0C, sem esticar */
}
```

### Tipografia responsiva (telas de aluno)

Manter os tamanhos do protótipo em 390px. Abaixo de 360px, reduzir **apenas** os títulos serif:

```css
h1, h2 { font-size: clamp(24px, 7.7vw, 30px); } /* 30px em 390px */
```

Corpo (13–15px), rótulos (10–11px) e números de destaque **não escalam** — já são o mínimo legível. **Nunca abaixo de 10px.**

### Alvos de toque

Mínimo **44×44px** em tudo que é tocável. No protótipo:
- itens da bottom nav: `min-height: 44px` (já aplicado)
- botão de play na lista de exercícios: 38px visual → **envolver em área de 44px** (`padding: 3px` ou `::after` expandindo a área de toque)
- chips de check-in e ações de linha: `min-height: 44px`
- inputs de carga/reps: altura ≥ 48px (uso com a mão suada, em pé)

## Tela por tela

### 1. Login / hero com parallax
- **Mobile (alvo):** rolagem vertical única. Foto ocupa `100vw × 62dvh` no topo com máscara inferior; a marca d'água "MÉTODO" cai para 96px (`clamp(80px, 26vw, 230px)`); H1 do hero `clamp(38px, 11vw, 66px)`; card de login em largura total menos gutter, sem `backdrop-filter` se houver queda de performance.
- **Parallax:** manter os fatores (0.10 / 0.28 / 0.55 / 1.0) mas com **amplitude reduzida a ~60%** no mobile e via `transform: translate3d()` em rAF. Desligar em `prefers-reduced-motion: reduce` e em conexões lentas.
- **Desktop (≥1024px):** layout do protótipo — copy à esquerda 480px, foto 520×760 à direita, card de login 432px centralizado no fim da rolagem.

### 2. Dashboard do aluno
- Mobile: coluna única, ordem exata do protótipo (mentalidade → treino de hoje → metas → nutrição → recado). `gap: 16px`.
- ≥768px: mesma coluna, máx 520px, centralizada. **Não** transformar em grid de 2 colunas — a hierarquia depende da ordem vertical.
- Barras de progresso: 3px de altura em qualquer viewport.

### 3. Área de treino
- Mobile é o caso de uso real (em pé, entre séries). Header fixo (`position: sticky; top: 0`) com cronômetro sempre visível; barra de ação fixa embaixo.
- Grid de registro `36px | 1fr | 1fr | 64px` funciona a partir de 320px. Abaixo de 360px, reduzir o gap de 10px para 8px.
- Inputs: `inputMode="decimal"`, `enterKeyHint="next"`, `autocomplete="off"`. Quando o teclado abre, garantir que a linha ativa fique visível (usar `visualViewport` API, não `scrollIntoView`).
- Vídeo e figura anatômica: largura total menos gutter; a figura mantém proporção fixa.
- ≥1024px (Victor conferindo no desktop): duas colunas — mídia à esquerda, registro à direita.

### 4. Nutrição
- Coluna única em qualquer viewport, máx 520px. Textarea de justificativa: `min-height: 70px`, cresce até 160px.

### 5. Planos e checkout
- **Mobile:** empilha. Catálogo primeiro, checkout depois. Os 3 cards de frequência viram **carrossel horizontal com snap** (`scroll-snap-type: x mandatory`, cards de 78vw) ou coluna empilhada — o card destacado (4x) sempre primeiro na ordem visual. Alternador segmentado em largura total. Resumo e total num bloco fixo no rodapé (`position: sticky; bottom: 0`).
- **≥1024px:** grid `640px | 400px` do protótipo, `gap: 24px`.

### 6. Onboarding / anamnese
- Mobile: uma pergunta por rolagem, barra de progresso `position: sticky; top: 0`, barra "Voltar / Continuar" fixa no rodapé. Seletor de 1–7 dias: grid de 7 colunas cabe em 320px (células de ~38px) — manter `min-height: 44px`.

### 7. Evolução
- Coluna única. Os dois cards (Peso / Treinos feitos) ficam em grid 2×1 desde 320px. Grid de fotos 2 colunas, `aspect-ratio: 3/4`.

### 8. Mensagens
- `height: 100dvh`, lista rolável + composer fixo. Composer: `padding-bottom: calc(16px + env(safe-area-inset-bottom))` e subir junto com o teclado (`visualViewport`). Bolhas: `max-width: 78%`.

### 9. Perfil
- Coluna única, cards com `flex-shrink: 0`. Toggles: 40×22px com alvo de toque de 44px.

### 10. Agenda
- Faixa da semana: grid de 7 colunas em qualquer viewport (células de ~44px em 390px). Abaixo de 360px, reduzir gap para 4px. Lista de compromissos em coluna única.

### 11. Vídeos
- Mobile: busca em largura total; filtros em fila horizontal rolável (`overflow-x: auto`, sem barra visível); linhas de vídeo com miniatura de 96×62 (`aspect-ratio: 16/10`).
- ≥768px: grid de 2 colunas para as linhas de vídeo.

### 12. Alertas
- **Aluno (mobile):** feed em coluna única, filete lateral de 2px indicando severidade.
- **Admin (desktop):** agrupado em Risco de abandono / Aguardando resposta / Operacional, tabelas `1.6fr | 1.4fr | 100px | 130px`. Abaixo de 1024px, cada linha vira card empilhado (nome + situação + ação em largura total).

### 13. Acesso rápido ao vídeo (bottom sheet)
- Sheet: `position: fixed; bottom: 0; width: 100%; max-height: 88dvh; border-radius: 16px 16px 0 0`, entrada `transform: translateY(100%) → 0` em 220ms `ease-out`, backdrop `rgba(8,7,6,0.72)`.
- **Não desmontar a tela de treino atrás** — o cronômetro e as séries registradas continuam vivos. Travar o scroll do fundo (`overflow: hidden` no body) enquanto o sheet está aberto.
- Fechar: ✕, arrasto para baixo (>80px ou velocidade alta), toque no backdrop, `Esc` no desktop.
- Iframe do Vimeo: `?dnt=1&title=0&byline=0&portrait=0&badge=0`, `allow="autoplay; fullscreen; picture-in-picture"`, `aspect-ratio: 16/9`, `loading="lazy"` com a miniatura pré-carregada por cima até o play. **Nunca abrir link externo.**
- Desktop: mesmo componente como modal centralizado (máx 720px).

### 14–16. Painel do consultor (Visão do dia, Aluno em detalhe, Plano alimentar/Mentalidade)
- **≥1024px:** layout do protótipo — sidebar 236px fixa (`position: sticky; height: 100dvh`), conteúdo com `padding: 34px 38px` e `max-width: 1400px`.
- **768–1023px:** sidebar vira drawer off-canvas com botão de menu; conteúdo em largura total.
- **<768px:** admin em modo consulta. Tabelas viram cards empilhados (rótulo em cima, valor embaixo, ação em largura total). O editor de ficha com arraste **não** deve ser oferecido no celular — mostrar em leitura com aviso "edite a ficha no computador".
- Grids de triagem: 4 colunas ≥1200px, 2 colunas 768–1199px, 1 coluna abaixo.
- Tabelas nunca com scroll horizontal escondido: ou reflow em cards, ou container com `overflow-x: auto` e sombra de borda indicando corte.

## Checklist de aceite

- [ ] Testado em 375×667 (SE), 390×844 (alvo), 430×932 (Pro Max) e 1280×800.
- [ ] Nenhum scroll horizontal em nenhuma largura.
- [ ] Bottom nav e barras de ação acima do home indicator (safe area).
- [ ] Nada tocável menor que 44×44.
- [ ] Nenhum texto abaixo de 10px; corpo em 13–15px.
- [ ] Teclado numérico nos campos de carga/reps; a linha em edição permanece visível.
- [ ] Registro de série funciona offline e sincroniza depois.
- [ ] Vídeo abre em sheet sobre o treino, sem perder cronômetro nem séries.
- [ ] `prefers-reduced-motion` desliga o parallax.
- [ ] Instalável como PWA, abrindo direto no dashboard do aluno.
