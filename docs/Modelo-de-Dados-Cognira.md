# Modelo de Dados do Cognira

## Objetivo

Este documento fecha o modelo de dados inicial do Cognira para permitir implementacao consistente de:

- autenticacao e perfis
- criacao e publicacao de programas
- ingestao e geracao de questoes
- sessao de estudo
- progresso cognitivo
- marketplace
- compras e patrocinio

O motor cognitivo permanece protegido. Este modelo organiza o produto ao redor dele.

## Principios

- AWS e apenas um dataset inicial.
- O modelo e multi-assunto por design.
- O mesmo usuario pode ser aluno, autor e patrocinador.
- O sistema deve suportar conteudo publico, privado e comercial.
- O progresso do aluno deve ser contextualizado por programa e topico.

## Entidades Principais

### 1. users

Representa a identidade principal da conta.

Campos principais:

- id
- email
- password_hash ou provider_id
- full_name
- avatar_url
- locale
- timezone
- status
- created_at
- updated_at

### 2. creator_profiles

Representa a camada de autor dentro da plataforma.

Campos principais:

- id
- user_id
- display_name
- bio
- headline
- website_url
- donation_enabled
- creator_score
- is_verified
- created_at
- updated_at

Relacionamento:

- um `user` pode ter zero ou um `creator_profile`

### 3. programs

Entidade principal de produto educacional publicado.

Exemplos:

- AWS Cloud Practitioner
- Matematica ENEM
- Portugues Fundamental
- Direito Constitucional para Concurso

Campos principais:

- id
- creator_profile_id
- title
- slug
- short_description
- long_description
- subject_area
- exam_type
- language_code
- thumbnail_url
- visibility
- monetization_type
- price_cents
- currency_code
- status
- review_status
- published_at
- created_at
- updated_at

Relacionamento:

- um `creator_profile` pode ter varios `programs`

### 4. program_trails

Agrupa topicos em jornadas internas dentro de um programa.

Exemplos:

- Fundamentos
- Seguranca
- Custos
- Revisao Final

Campos principais:

- id
- program_id
- title
- slug
- description
- position
- status
- created_at
- updated_at

### 5. topics

Representa a menor unidade semantica de estudo rastreavel pelo produto.

Campos principais:

- id
- program_id
- trail_id
- parent_topic_id
- title
- slug
- description
- cognitive_weight
- exam_weight
- position
- status
- created_at
- updated_at

Observacao:

- `parent_topic_id` permite hierarquia futura sem quebrar o modelo.

### 6. questions

Representa uma questao individual.

Campos principais:

- id
- program_id
- trail_id
- topic_id
- author_user_id
- origin_type
- source_reference
- stem
- explanation
- difficulty_level
- language_code
- status
- quality_score
- is_active
- created_at
- updated_at

Campos comportamentais:

- `origin_type`: manual, ai_draft, ai_reviewed, imported
- `status`: draft, review, published, archived

### 7. question_options

Alternativas de uma questao.

Campos principais:

- id
- question_id
- label
- body
- is_correct
- position

### 8. question_tags

Tags para classificacao e descoberta.

Campos principais:

- id
- name
- slug

### 9. question_tag_links

Relaciona questoes a tags.

Campos principais:

- question_id
- tag_id

### 10. ai_generation_jobs

Controla solicitacoes de geracao assistida por IA.

Campos principais:

- id
- user_id
- program_id
- trail_id
- topic_id
- prompt_text
- source_material_url
- source_material_text
- status
- provider_name
- generated_count
- created_at
- completed_at

### 11. ai_generation_items

Itens gerados em um job de IA antes de virarem questoes publicadas.

Campos principais:

- id
- job_id
- draft_payload_json
- validation_status
- review_notes
- approved_by_user_id
- approved_at

### 12. enrollments

Representa a relacao entre aluno e programa.

Campos principais:

- id
- user_id
- program_id
- access_type
- access_status
- enrolled_at
- expires_at

### 13. purchases

Controla compra de programas e planos.

Campos principais:

- id
- buyer_user_id
- program_id
- amount_cents
- currency_code
- payment_provider
- payment_status
- purchased_at

### 14. sponsorships

Representa patrocinio de estudo.

Campos principais:

- id
- sponsor_user_id
- beneficiary_user_id
- program_id
- mode
- funding_type
- budget_cents
- budget_crypto_amount
- crypto_symbol
- reward_rule
- status
- created_at
- activated_at

### 15. sponsorship_links

Links compartilhaveis de patrocinio.

Campos principais:

- id
- sponsorship_id
- token
- status
- max_uses
- used_count
- expires_at
- created_at

### 16. study_sessions

Representa a sessao de estudo do usuario.

Campos principais:

- id
- user_id
- program_id
- trail_id
- mode
- target_topic_id
- engine_session_ref
- session_status
- started_at
- ended_at

Observacao:

- `engine_session_ref` referencia o identificador operacional da engine.

### 17. session_blocks

Representa os blocos cognitivos da sessao.

Campos principais:

- id
- study_session_id
- block_type
- position
- total_questions
- started_at
- ended_at

Observacao:

- `block_type`: main, reinforcement

### 18. session_answers

Representa cada resposta dada pelo aluno.

Campos principais:

- id
- study_session_id
- session_block_id
- question_id
- selected_option_id
- is_correct
- answered_at
- response_time_ms
- order_index

### 19. topic_progress

Estado do aluno por topico dentro de um programa.

Campos principais:

- id
- user_id
- program_id
- topic_id
- attempts
- correct_count
- accuracy
- coverage
- readiness_score
- mastery_level
- status
- last_seen_at
- next_review_at
- updated_at

Chave logica:

- unico por `user_id + program_id + topic_id`

### 20. question_progress

Estado do aluno por questao, para reforco e revisao futura.

Campos principais:

- id
- user_id
- program_id
- question_id
- attempts
- correct_count
- error_count
- consecutive_successes
- mastery_level
- last_attempt_at
- last_seen_at
- next_review_at
- updated_at

### 21. program_reviews

Avaliacoes do marketplace.

Campos principais:

- id
- program_id
- user_id
- rating
- title
- body
- created_at
- updated_at

### 22. creator_metrics_snapshots

Snapshot periodico para ranking e analytics.

Campos principais:

- id
- creator_profile_id
- snapshot_date
- creator_score
- active_learners
- avg_program_rating
- completion_rate
- retention_signal
- revenue_cents

## Relacionamentos Essenciais

- `users 1:N enrollments`
- `users 1:N purchases`
- `users 1:N study_sessions`
- `users 1:N program_reviews`
- `users 1:1 creator_profiles`
- `creator_profiles 1:N programs`
- `programs 1:N program_trails`
- `programs 1:N topics`
- `programs 1:N questions`
- `programs 1:N enrollments`
- `programs 1:N purchases`
- `programs 1:N study_sessions`
- `programs 1:N program_reviews`
- `program_trails 1:N topics`
- `topics 1:N questions`
- `study_sessions 1:N session_blocks`
- `study_sessions 1:N session_answers`
- `session_blocks 1:N session_answers`

## Regras Estruturais

### Perfil de usuario

- um usuario pode estudar sem ser autor
- um autor sempre nasce de um usuario
- um usuario pode patrocinar outro usuario

### Programa

- todo programa pertence a um autor
- todo programa pode ser gratuito, por doacao ou pago
- todo programa pode ser publico, privado ou nao listado

### Conteudo

- toda questao deve pertencer a um programa
- toda questao deve pertencer a um topico
- trilha e opcional no inicio, mas recomendada
- questao gerada por IA entra como rascunho antes da publicacao em marketplace

### Progresso

- progresso do aluno deve ser calculado por topico dentro do programa
- progresso por questao serve para reforco e espacamento
- prontidao exibida ao usuario deve derivar do motor e do progresso contextual

### Sessao

- uma sessao pode conter mais de um bloco
- bloco principal e bloco de reforco sao independentes no nivel visual
- o modelo de dados deve preservar essa separacao

## Decisoes de Produto Ja Fechadas

- entidade central do catalogo: `programs`
- organizacao interna default: `program_trails -> topics -> questions`
- progresso principal do aluno: `user + program + topic`
- questoes geradas por IA devem permitir revisao antes de marketplace
- patrocinio existe como modulo separado do fluxo principal do MVP

## O que isso permite construir

- marketplace multi-assunto
- creator studio
- estudo privado sob demanda com IA
- prontidao por topico
- ranking de autores
- monetizacao simples e expansivel
- patrocinio e incentivos futuros
