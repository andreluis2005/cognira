# Plano de Execucao Inicial do Cognira

## Objetivo

Sair da fase de conceito e entrar em desenvolvimento orientado a entrega.

## Fase 0 - Decisoes a fechar imediatamente

### 1. Banco

Escolher a stack de persistencia principal.

Recomendacao:

- PostgreSQL
- ORM opcional: Prisma ou Drizzle

### 2. Autenticacao

Escolher provedor de auth.

Recomendacao:

- Auth.js ou Clerk

### 3. Pagamentos

Escolher como vender programas.

Recomendacao:

- Stripe para MVP

### 4. Storage

Definir onde guardar assets e anexos.

Recomendacao:

- S3 compativel ou Supabase Storage

## Fase 1 - Fundacao

- criar schema inicial do banco
- configurar migrations
- implementar autenticacao
- criar ownership basico de programas
- criar seed com programa demo

## Fase 2 - Creator MVP

- criar tela de novo programa
- criar CRUD de trilhas
- criar CRUD de topicos
- criar CRUD de questoes
- criar fluxo de publicar

## Fase 3 - Marketplace MVP

- pagina de listagem de programas
- pagina publica do programa
- perfil do criador
- reviews basicas

## Fase 4 - Learn MVP

- conectar programa publicado ao fluxo de estudo
- criar matricula
- associar sessao a programa real
- persistir progresso por programa e topico

## Fase 5 - IA de Conteudo

- criar job de geracao
- revisar drafts
- aprovar e converter em questoes publicadas

## Entregas mais importantes agora

1. implementar o banco
2. implementar auth
3. criar a area do criador
4. ligar o catalogo ao estudo

## Riscos se pular essas etapas

- crescer com modelo de dados errado
- misturar AWS demo com arquitetura real
- ter UI bonita sem sistema publicavel
- reescrever sessao e progresso depois

## Melhor proximo passo

Criar o schema real do projeto e iniciar a camada de autenticacao e ownership.
