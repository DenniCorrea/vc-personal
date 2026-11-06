# Victor Carvalho Personal — plataforma de mentoria para personal trainers

Aplicação web em produção, construída do zero para um cliente real: o personal trainer
Victor Carvalho. Não é um projeto de estudo com dados fictícios — é o sistema que ele usa
para atender e cobrar.

**No ar:** [victorcarvalhopersonal.onrender.com](https://victorcarvalhopersonal.onrender.com)

---

## O problema

O Victor tem dois negócios que dividem a mesma infraestrutura, mas nunca podem misturar
conteúdo nem regra:

- **Aluno** — personal training para o cliente final: treino, evolução, nutrição.
- **Mentoria** — consultoria B2B vendida para **outros personal trainers**, que querem
  parar de vender hora avulsa e cobrar por acompanhamento.

Antes disso, o trabalho vivia em planilha, PDF e WhatsApp. Ficha de treino num arquivo,
dieta em outro, cobrança de check-in perdida na rolagem da conversa. Não havia como provar
evolução para o cliente nem como escalar o atendimento sem virar administrativo puro.

## A pivotagem — e por que ela importa mais que o código

O projeto começou pelo **B2C** (área do aluno). Foram 12 fases construídas: treino com
histórico de carga, anamnese, avaliação física comparativa, nutrição com check-in por
refeição, fotos de progresso, hábitos, alertas de retenção, pagamento.

Estava funcionando. E foi pausado.

**A decisão foi de negócio, não técnica.** Olhando o funil real do Victor, a mentoria B2B
tem **ticket maior** e concentra **o maior volume de trabalho hoje**. Construir as duas
frentes em paralelo diluiria o esforço nas duas. Então: foco total no produto que paga
melhor agora, com o B2C **pausado — não cancelado**.

Isso está literalmente no código, numa linha só:

```ts
// src/lib/feature-flags.ts
export const ALUNO_PAUSADO = true;
```

Nada foi apagado. Todas as telas, tabelas e regras do aluno continuam íntegras no
repositório. Quando o Victor decidir retomar, é trocar `true` por `false`. A pausa é
reversível de propósito — porque a estratégia pode mudar de novo, e um sistema que obriga a
reconstruir o que foi desligado penaliza justamente quem tem visão de negócio.

## Como está hoje

| Área | Estado |
|---|---|
| **Mentoria B2B** | Em desenvolvimento ativo — foco atual |
| **Área do aluno (B2C)** | Pausada, íntegra, reversível por flag |
| **Pagamentos** | Código pronto (Mercado Pago), aguardando credenciais do cliente |

### O que a plataforma de mentoria faz

**Para o mentorado (o personal trainer que contrata):**
- Trilha de conteúdo em módulos e aulas, com progresso e retomada de onde parou
- Player com prazo de acesso por aula ("acesso por mais 42 dias")
- **Dúvida ancorada na aula** — pergunta enviada do player chega ao mentor com o módulo, a
  aula e o minuto exato do vídeo
- Bônus e masterclasses com contador regressivo de expiração
- Comunidade fechada entre mentorados, com comparativo de ticket antes/depois
- Diagnóstico inicial que cria a linha de base do resultado dele
- Canal direto com o mentor e agenda de sessões 1-on-1

**Para o mentor (o Victor):**
- Triagem diária: quem precisa de resposta, quem sumiu, receita recorrente
- Gestão da trilha: módulos, aulas, visibilidade por plano, prazo de acesso
- Fila de dúvidas ordenada por tempo de espera, respondível sem sair da tela
- Agenda: ele marca a sessão no nome do mentorado, que é avisado e recebe lembretes
- Moderação da comunidade e mentalidade da semana
- Planos, receita recorrente e falhas de cobrança

---

## Stack e as decisões por trás dela

| Escolha | Por quê |
|---|---|
| **Next.js 16** (App Router) | Monólito: front e back no mesmo projeto. Uma pessoa mantendo — menos partes móveis vence performance teórica |
| **PostgreSQL na Neon** | Plano gratuito que não expira. Render também oferece Postgres, mas com prazo |
| **Prisma 7** | Tipagem forte entre banco e código. Consultas parametrizadas por padrão — injeção de SQL deixa de ser possível por construção |
| **Auth.js v5** (JWT) | Sem OAuth no escopo, então sem adapter de banco. Sessão em cookie assinado |
| **Render** | Processo Node persistente, necessário para os alertas agendados. Serverless resolveria pior |
| **Cloudinary / Vimeo / Resend** | Imagem, vídeo e e-mail: problemas resolvidos, sem valor em reconstruir |

Números do repositório: **60 telas**, **34 modelos de dados**, **18 migrações**,
**47 commits** entre 23 e 28 de agosto de 2026.

---

## Como isto foi construído

Este projeto foi desenvolvido com **Claude Code** como par de programação. Isso não é
detalhe escondido — é parte do que ele demonstra.

O trabalho humano aqui não foi digitar código: foi **dirigir**. Definir regra de negócio,
recusar solução que não cabia no caso real, testar no celular de verdade e voltar com
defeito encontrado, decidir o que entra e o que fica para depois.

### O que virou processo

**Um arquivo de padrões lido antes de qualquer alteração** ([`CLAUDE.md`](./CLAUDE.md)) —
checklist de segurança, regras de LGPD, e as armadilhas que já custaram tempo neste projeto,
cada uma com o *porquê* junto:

- Campo `@db.Date` do Postgres volta como meia-noite UTC — ler com getter local mostra o
  dia errado
- Fuso horário declarado, nunca herdado do processo: local roda em São Paulo, produção roda
  em UTC. Uma sessão marcada para 14h valia 11h de verdade
- Erro lançado em Server Action vira página genérica em produção — quando a mensagem
  importa, retornar estado
- Limite de 1MB da Server Action barra qualquer foto de celular. E aumentar o limite não
  resolve: a correção certa é reduzir a imagem no navegador antes de enviar

**Auditorias periódicas**, não só quando algo quebra. Uma delas encontrou:
uma tela com conteúdo real que ficou inalcançável depois de uma mudança de navegação; a
página de LGPD fora do alcance de um perfil inteiro; e o bug de fuso horário acima — que
mostrava "14:00" na tela enquanto o horário real era outro, o tipo de defeito que ninguém
descobre olhando.

**Teste no navegador antes de declarar pronto.** `npm run build` passar não é teste.

### Segurança e LGPD

Levado a sério porque o app guarda **dado de saúde** — que a LGPD classifica como dado
pessoal sensível:

- Limite de tentativas de login no banco (não em memória: a Render reinicia e zeraria o
  contador — exatamente o que um ataque precisaria)
- Cabeçalhos de segurança, HSTS, sem `X-Powered-By`
- Fotos de progresso **privadas**: o caminho público do Cloudinary devolve 404, e as
  imagens passam por uma rota que confere sessão e dono a cada acesso
- Upload valida tipo e tamanho no servidor; SVG recusado (vira XSS no próprio domínio)
- Exportação e exclusão de dados pelo titular
- Senha em bcrypt, token de recuperação só como hash, com prazo e uso único

**Uma falha encontrada e corrigida.** Antes de preparar este repositório para ficar
público, auditei os 1.208 objetos do histórico do Git atrás de segredo vazado. Nenhuma
chave de API apareceu — o `.env` nunca foi commitado. Mas achei outra coisa: o
`prisma/seed.ts` trazia a senha das contas de exemplo escrita como literal, e **essa
mesma senha valia nas contas do banco de produção**. Publicar o código seria publicar o
login de administrador do app no ar.

O que foi feito, nesta ordem: rotacionar as senhas de produção (uma distinta por conta)
e invalidar os tokens de recuperação pendentes; depois tirar a senha do código, que
agora vem de variável de ambiente — e o seed **se recusa a rodar** sem ela, porque um
valor padrão silencioso é exatamente como senha fraca sobrevive até a produção.

A senha antiga continua visível em dois commits antigos, e isso é deliberado: ela já não
abre nada, e reescrever o histórico apagaria justamente o registro de como o problema
foi encontrado e resolvido. Rotacionar é o que resolve; limpar histórico é higiene — na
ordem inversa, o segredo fica exposto enquanto se reescrevem os commits.

---

## O que vem depois

- Checkout com Pix (6% de desconto), cartão e débito — depende das credenciais do Mercado Pago
- Notificação por e-mail e push dos lembretes (hoje o aviso só aparece dentro do app)
- Upload de vídeo direto pelo painel, sem passar pelo Vimeo
- Retomada da área do aluno, quando fizer sentido comercialmente

---

## Sobre este repositório

Sou estudante de Análise e Desenvolvimento de Sistemas. Este projeto é onde eu aprendo — e
onde eu entrego.

Não me apresento como desenvolvedor sênior. O que este repositório mostra é outra coisa:
que eu consigo **conduzir a construção de um sistema real, do zero até produção**, tomando
as decisões que importam — o que construir, em que ordem, o que pausar, quando dizer não a
uma solução bonita que não cabe no problema, e quando parar para auditar em vez de seguir
empilhando funcionalidade.

O `git log` é a documentação de verdade: cada mensagem de commit explica o **raciocínio**,
não só o arquivo alterado. Inclusive os erros — quando uma correção minha estava errada,
está escrito lá que estava.

Se você chegou aqui por um processo seletivo, sugiro começar por
[`CLAUDE.md`](./CLAUDE.md) e por `git log`. É onde o pensamento aparece.
