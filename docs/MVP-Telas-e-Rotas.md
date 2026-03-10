# MVP Telas e Rotas do Cognira

## Objetivo

Definir a experiencia minima do produto de forma coerente com:

- aprendizado cognitivo
- criacao de conteudo
- marketplace
- crescimento futuro

## Superficies do Produto

- Learn
- Create
- Market
- Account

O modulo Sponsor pode nascer depois do MVP sem quebrar o fluxo principal.

## Learn

### 1. Landing

Rota:

- `/`

Objetivo:

- apresentar proposta de valor
- explicar como o Cognira funciona
- converter visitante em cadastro ou exploracao

### 2. Descoberta de Programas

Rotas:

- `/programs`
- `/programs?query=...`
- `/programs?subject=...`

Objetivo:

- buscar programas por tema, prova ou assunto
- filtrar gratuito, pago, idioma e categoria

### 3. Pagina do Programa

Rota:

- `/programs/[slug]`

Objetivo:

- apresentar programa
- mostrar autor
- mostrar trilhas e topicos
- exibir preco, reputacao e CTA de iniciar

### 4. Matricula ou Compra

Rotas:

- `/checkout/[programId]`
- `/enroll/[programId]`

Objetivo:

- garantir acesso ao programa

### 5. Dashboard do Aluno

Rota:

- `/learn`

Objetivo:

- mostrar programas em andamento
- mostrar prontidao geral
- destacar proxima sessao

### 6. Pagina do Programa do Aluno

Rota:

- `/learn/programs/[programId]`

Objetivo:

- exibir trilhas, topicos, status e CTA de sessao

### 7. Sessao de Estudo

Rota:

- `/session`

Objetivo:

- executar bloco principal e bloco de reforco
- manter contexto visual independente por bloco

Observacao:

- esta tela deve continuar respeitando a engine existente

### 8. Resultado da Sessao

Rota:

- `/results`

Objetivo:

- mostrar desempenho
- mostrar impacto em prontidao
- sugerir proximo passo

## Create

### 9. Dashboard do Criador

Rota:

- `/creator`

Objetivo:

- mostrar programas criados
- mostrar status de publicacao
- mostrar metricas basicas

### 10. Novo Programa

Rota:

- `/creator/programs/new`

Objetivo:

- criar programa
- definir titulo, descricao, categoria, monetizacao e visibilidade

### 11. Editor de Programa

Rotas:

- `/creator/programs/[programId]`
- `/creator/programs/[programId]/edit`

Objetivo:

- editar dados do programa
- organizar trilhas
- organizar topicos

### 12. Gerenciador de Topicos

Rota:

- `/creator/programs/[programId]/topics`

Objetivo:

- criar e ordenar topicos
- associar topicos a trilhas

### 13. Banco de Questoes do Programa

Rota:

- `/creator/programs/[programId]/questions`

Objetivo:

- listar, criar, editar e revisar questoes

### 14. Nova Questao Manual

Rota:

- `/creator/programs/[programId]/questions/new`

Objetivo:

- inserir questao manualmente

### 15. Geracao por IA

Rota:

- `/creator/programs/[programId]/ai`

Objetivo:

- solicitar questoes por IA
- revisar resultados gerados

### 16. Publicacao

Rota:

- `/creator/programs/[programId]/publish`

Objetivo:

- validar programa
- publicar no marketplace

## Market

### 17. Perfil do Autor

Rota:

- `/creators/[slug]`

Objetivo:

- mostrar reputacao
- mostrar programas publicados
- mostrar reviews

### 18. Ranking de Criadores

Rota:

- `/creators`

Objetivo:

- discovery de autores
- reputacao e conversao

## Account

### 19. Login

Rota:

- `/login`

### 20. Cadastro

Rota:

- `/signup`

### 21. Perfil e Configuracoes

Rota:

- `/account`

## Fluxo Minimo para Lancar MVP

1. visitante chega na landing
2. cria conta
3. descobre um programa
4. entra ou compra
5. inicia sessao
6. conclui sessao
7. acompanha progresso

Em paralelo:

1. autor cria conta
2. cria programa
3. adiciona topicos e questoes
4. publica
5. recebe alunos e avaliacoes

## O que pode ficar para depois

- patrocinio em crypto
- trilhas privadas patrocinadas
- ranking sofisticado
- feed social
- comunidade
- gamificacao mais profunda
