# Arquitetura de Modulos do Cognira

## Objetivo

Separar o produto em modulos claros para evitar acoplamento precoce entre:

- engine cognitiva
- experiencia de estudo
- criacao de conteudo
- marketplace
- monetizacao

## Modulos

### 1. cognitive-core

Responsavel por:

- selecao de perguntas
- repeticao espacada
- calculo de desempenho
- calculo de cobertura
- calculo de prontidao
- reforco automatico

Status:

- protegido
- nao alterar sem autorizacao explicita

### 2. learning-app

Responsavel por:

- descoberta para o aluno logado
- pagina do programa do aluno
- execucao da sessao
- resultados
- visualizacao de prontidao

### 3. creator-studio

Responsavel por:

- criacao de programas
- organizacao de trilhas
- organizacao de topicos
- criacao manual de questoes
- geracao assistida por IA
- revisao e publicacao

### 4. marketplace

Responsavel por:

- listagem de programas
- paginas publicas de programa
- paginas de criador
- reviews
- discovery e filtros

### 5. commerce

Responsavel por:

- compras
- checkout
- acesso a programas pagos
- doacoes

### 6. sponsorship

Responsavel por:

- links patrocinados
- bolsas
- regras de recompensa
- integracao futura com crypto

### 7. identity

Responsavel por:

- autenticacao
- perfis
- permissoes
- ownership

## Estrutura de Pastas Sugerida

```text
app/
  (marketing)/
  (auth)/
  (learn)/
  (creator)/
  (market)/
  api/
components/
  learn/
  creator/
  market/
  shared/
lib/
  cognitive-core/
  auth/
  db/
  market/
  creator/
  commerce/
  sponsor/
  validations/
data/
docs/
ai/
  skills/
```

## Fronteiras Importantes

### learning-app nao deve:

- reimplementar regras da engine
- recalcular prontidao de forma paralela
- inventar estado de negocio fora do que a engine entrega

### creator-studio nao deve:

- publicar questoes IA sem camada de revisao, por padrao
- depender de estruturas internas da sessao de estudo

### marketplace nao deve:

- acessar logica cognitiva para ranquear diretamente
- misturar descoberta com runtime de sessao

## Sequencia Recomendada de Implementacao

1. identity
2. data model e banco
3. marketplace basico
4. creator-studio basico
5. learning-app conectado ao novo modelo
6. commerce
7. sponsorship

## Decisao pratica para o repositorio atual

Como o repositorio hoje esta concentrado em `app/`, `lib/` e `data/`, a proxima evolucao segura e:

- preservar a engine atual em `lib/`
- criar modulos novos ao redor dela
- nao remodelar tudo de uma vez
- migrar gradualmente para areas de produto mais claras
