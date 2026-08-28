# Status do projeto — Victor Carvalho Personal

> Atualizado em 24/08/2026. Esse arquivo existe pra qualquer pessoa (ou uma
> sessão nova do Claude) recuperar o contexto do projeto rapidamente, sem
> precisar reler todo o histórico de commits ou de conversa.

## O que é

App do Victor Carvalho Personal, com **dois produtos** que compartilham a
mesma infraestrutura mas nunca misturam conteúdo/regras:

- **ALUNO** — serviço de personal training pros clientes finais dele.
- **MENTORIA** — consultoria que o Victor vende pra OUTROS personal trainers.

3 perfis: `ALUNO`, `PERSONAL_PARCEIRO` (rótulo na tela: "Personal Trainer
Mentorado" — é o cliente B2B da mentoria), `ADMIN` (o Victor).

## Stack

- **Next.js 16** (App Router) + TypeScript, monólito (front + back juntos)
- **Prisma 7** ORM — atenção: mudou bastante da v6 (driver adapters
  obrigatórios, `prisma.config.ts`, cliente gerado fora do `node_modules`).
  Ver `.agents/skills/prisma-*` no repo, são docs oficiais da Prisma pra
  agentes de IA, mais confiáveis que treinamento defasado.
- **PostgreSQL na Neon** — é o MESMO banco em dev e produção (decisão do
  Denni: "não trabalhamos com normas", sem necessidade de separar ainda).
- **Auth.js (NextAuth v5 beta)** — Credentials + sessão JWT, sem adapter de
  banco (não precisa, não tem login OAuth).
- **Mercado Pago** — pagamentos (cartão vira assinatura recorrente de
  verdade via PreApproval; Pix/débito pagam ciclo a ciclo).
- **Vimeo** — hospedagem de vídeo, link privado (`?h=`) pra controle de acesso.
- **Resend** — envio de e-mail (recuperação de senha).
- **Cloudinary** (plano gratuito) — fotos de progresso, avatar e imagens
  de anatomia dos exercícios.
- **Render** — hospedagem do app.

## Onde tudo está hospedado

| Serviço | Link | Pra quê |
|---|---|---|
| GitHub | github.com/DenniCorrea/vc-personal | Código-fonte |
| Render | dashboard.render.com | Hospedagem — serviço "victorcarvalhopersonal" |
| App no ar | victorcarvalhopersonal.onrender.com | O app em produção |
| Neon | console.neon.tech | Banco de dados |
| Resend | resend.com | E-mail |
| Cloudinary | cloudinary.com | Fotos e imagens (plano gratuito) |
| Mercado Pago | mercadopago.com.br/developers/panel | Pagamentos (credenciais pendentes do Victor) |

## Fases concluídas (1 a 11)

1. Modelagem de dados
2. Autenticação e perfis
3. Planos e assinaturas (depois refatorado pro modelo `Produto`/`Plano`
   unificado, pra caber os dois produtos sem duplicar tabela)
4. Agendamento (`Horario` + `Agendamento`, limite semanal, sessão avulsa)
5. Pagamentos (Mercado Pago — código pronto, aguardando credenciais reais)
6. Vídeos (Vimeo, acesso por produto)
7. Área de treino (`Exercicio` reutilizável + `Treino` individual por aluno)
8. Área de mentoria (conteúdo por pilar, publicação agendada)
9. Hábitos e mentalidade (água/sono, mensagens agendadas)
10. Alertas e retenção (renovação, atraso, baixa utilização, lembretes)
11. Deploy (Render, no ar)

Mais 5 melhorias aprovadas depois da Fase 10 (log de admin, horário em
lote, cancelar/trocar plano, exportação/exclusão LGPD) e acesso cortesia
(VIP/teste sem pagamento). Trocar senha e recuperar senha por e-mail
(Resend) também prontos.

## Fase 12 — Método Líder (concluída, ainda não subida pro Render)

Redesenho completo seguindo o handoff de design (`design_handoff_metodo_lider/`)
— tema escuro fixo, Instrument Serif + Manrope — e as novas funcionalidades
do documento de regras de negócio do Victor:

- **App do aluno** (bottom nav): dashboard "Hoje", anamnese/onboarding,
  execução de treino com histórico de carga por série (referência "Antes"),
  nutrição com check-in por refeição, evolução (progressão de carga, peso,
  medidas, fotos via Cloudinary), mensagens (chat texto com o admin).
- **Painel do admin** (sidebar): Visão do dia (triagem — sem treino há 3+
  dias, check-ins a responder, revisão recomendada, aderência média), ficha
  do aluno com relatório comparativo entre avaliações e card de alerta de
  lesão (da anamnese), gestão de plano alimentar por aluno, conversas,
  mentalidade do dia reestilizada. Todas as telas antigas (planos, vídeos,
  exercícios, horários, conteúdo da mentoria, logs) continuam funcionando,
  só herdaram os tokens visuais novos.
- Schema novo: `Anamnese`, `Avaliacao`, `ExecucaoExercicio`,
  `PlanoNutricional`/`Refeicao`/`CheckinNutricional`, `FotoProgresso`,
  `Mensagem`, campos de anatomia no `Exercicio`, `avatarUrl` no `Usuario`.
- Escopo deixado de fora de propósito: mensagens por áudio (só texto),
  "Fase Inteligência" (dashboard agregado — adiada até ter uso real
  acumulado), Health Check de infra (fase separada, ainda não feita).

Testado ponta a ponta no navegador (login → anamnese → ficha pelo admin →
execução pelo aluno → avaliação comparativa → visão do dia) antes de
qualquer commit. Dois bugs reais de fuso horário encontrados e corrigidos
nesse processo (ver `git log`).

## Pendente

- Credenciais de teste do Mercado Pago (o Denni pediu pro Victor)
- Health Check de infra (endpoint + Render Cron Job) — combinado, ainda
  não feito
- Guia de estudo / apresentação / material de venda pro Victor / sugestão
  de precificação — combinado fazer depois que o Mercado Pago também
  estiver resolvido, mas sem bloquear o resto por causa disso

## Como retomar

O histórico completo de decisões (o quê e **por quê**) está nas mensagens
de commit do `git log` — cada uma explica o raciocínio, não só o que
mudou. Não é preciso reler a conversa inteira: `git log --oneline` já dá
o mapa das 15+ fases/mudanças, e `git log -p <hash>` mostra o diff de
qualquer uma.
