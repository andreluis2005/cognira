# 01 — ARQUITETURA

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Alterações exigem revisão arquitetural completa.

---

## Visão Geral das Camadas

```
╔══════════════════════════════════════════════════════════════╗
║                    COGNIRA ARCHITECTURE                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │              CAMADA DE INTERFACE (UI)                 │    ║
║  │                                                      │    ║
║  │  • Next.js (App Router) + React                      │    ║
║  │  • Tailwind CSS                                      │    ║
║  │  • Páginas: /dashboard, /session, /results           │    ║
║  │  • ZERO lógica de decisão                            │    ║
║  │  • Apenas exibe e transmite                          │    ║
║  └──────────────┬──────────────────┬────────────────────┘    ║
║                 │ chama funções    │ exibe resultados         ║
║  ┌──────────────▼──────────────────▼────────────────────┐    ║
║  │              CAMADA DO MOTOR (ENGINE)                 │    ║
║  │                                                      │    ║
║  │  lib/engine.ts — 1689 linhas                         │    ║
║  │  • 100% puro funcional                               │    ║
║  │  • 12 seções organizacionais                         │    ║
║  │  • 21 invariantes formais (14 core + 7 cognitivos)   │    ║
║  │  • PRNG Mulberry32 determinístico                    │    ║
║  │  • 28 self-tests internos                            │    ║
║  │  • Zero I/O, zero estado global                      │    ║
║  └──────────────┬───────────────────────────────────────┘    ║
║                 │ recebe/retorna dados puros                  ║
║  ┌──────────────▼───────────────────────────────────────┐    ║
║  │           CAMADA DE PERSISTÊNCIA (STORAGE)            │    ║
║  │                                                      │    ║
║  │  lib/storage.ts — 120 linhas                         │    ║
║  │  • localStorage (implementação atual)                │    ║
║  │  • Migração de esquema embutida                      │    ║
║  │  • macroTopics são DERIVADOS, nunca persistidos      │    ║
║  │  • Substituível por API/DB sem alterar o motor       │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │            CAMADA DE DADOS (ESTÁTICA)                 │    ║
║  │                                                      │    ║
║  │  lib/types.ts  — Tipos TypeScript (modelo formal)    │    ║
║  │  lib/topics.ts — 17 tópicos em 4 macro domínios      │    ║
║  │  data/questions.json — Banco de questões              │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Camada do Motor (`lib/engine.ts`)

O motor é o **ativo central** do Cognira. Suas 12 seções internas:

| Seção | Nome | Responsabilidade |
|-------|------|------------------|
| 1 | Invariantes Formais | 14 invariantes verificáveis em runtime (`ENGINE_INVARIANTS`) |
| 2 | Constantes Pré-computadas | `ALL_QUESTIONS`, `MASTERY_INTERVALS`, Maps de lookup O(1) |
| 3 | PRNG Determinístico | Mulberry32, FNV-1a hash, seed composta |
| 4 | Utilitários Puros | `assertInvariant`, `clamp`, `safeNumber` |
| 5 | Validação de Estado | `validateProgress()` — detecta corrupção silenciosa |
| 6 | Imutabilidade Profunda | Deep clone de `topics` e `questionsHistory` |
| 7 | Controle de Crescimento | `compressHistory()` — evicção LRU temporal |
| 8 | Lógica Core | `getTopicStatus`, `deriveMacroTopics`, `calculateReadinessScore`, `selectNextQuestion` |
| 9 | API Pública | `startSession()`, `processStep()` — contrato preservado |
| 11 | Extensões Cognitivas | Risk Zone, CSI, Pressure, Confidence Index |
| 12 | Self-Check | 28 testes internos CI-ready |

### Propriedades de Pureza (P1–P8)

- **P1:** Nenhuma função lê ou escreve estado externo
- **P2:** Todas as entradas são parâmetros explícitos
- **P3:** Todas as saídas são valores de retorno explícitos
- **P4:** Nenhuma referência ao relógio do sistema — timestamp é injetado
- **P5:** PRNG determinístico com seed explícita (Mulberry32)
- **P6:** `crypto.randomUUID()` usado apenas para geração de ID (output, não influencia seleção)
- **P7:** Nenhum `console.log/warn/error` em caminhos de produção
- **P8:** Imutabilidade profunda — nenhuma referência compartilhada

---

## Camada de Interface (`app/`)

| Rota | Arquivo | Função |
|------|---------|--------|
| `/` | `app/page.tsx` | Redirect para `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | Exibe áreas prioritárias (Críticos/Instáveis/Sólidos) |
| `/session` | `app/session/page.tsx` | Sessão de estudo interativa de 15 questões |
| `/results` | `app/results/page.tsx` | Resultados pós-sessão |

**Regra absoluta:** A UI **nunca** toma decisões sobre seleção de questões, priorização ou cálculo de scores. Ela apenas:
1. Chama funções do motor
2. Exibe os resultados
3. Transmite input do usuário para o motor

---

## Camada de Persistência (`lib/storage.ts`)

### Funções Exportadas

| Função | Descrição |
|--------|-----------|
| `getUserProgress()` | Lê e migra dados do `localStorage` |
| `saveUserProgress()` | Persiste progresso SEM `macroTopics` (derivados) |
| `createInitialProgress()` | Gera estado inicial para todos os 17 tópicos |

### Princípio de Derivação

```
macroTopics = deriveMacroTopics(topics)  // SEMPRE calculado, NUNCA persistido
```

`macroTopics` é **explicitamente removido** antes de salvar (`const { macroTopics, ...toSave } = progress`). Isso garante que não existe estado derivado persistido que possa divergir do estado fonte.

---

## Modelo de Dados (`lib/types.ts`)

### Hierarquia de Tipos

```
UserProgress (raiz)
├── userId: string
├── readinessScore: number ∈ [0, 100]
├── streak: number
├── lastSessionDate: string (ISO)
├── topics: Record<string, TopicProgress>       ← SOURCE OF TRUTH
│   ├── topicId, attempts, correct, accuracy
│   ├── status: TopicStatus (NOT_EVALUATED|WEAK|EVOLVING|STRONG)
│   ├── masteryLevel: number ∈ [0, 5]
│   └── [extensões opcionais: riskScore, riskZone, stabilityIndex]
├── macroTopics?: Record<string, any>            ← DERIVADO (nunca persistido)
├── questionsHistory: Record<string, QuestionHistory>
│   ├── lastAttempt, lastSeen, nextReview (ISO)
│   ├── masteryLevel ∈ [0, 5]
│   ├── consecutiveSuccesses ≥ 0
│   └── errorCount ≥ 0
└── [extensões opcionais: avgCSI, lastPressureScore, confidenceIndex]
```

---

## Princípios de Separação

### 1. Motor ≠ Storage
O motor não sabe como os dados são persistidos. Ele recebe `UserProgress` e retorna `UserProgress` atualizado. A camada de persistência pode ser trocada (banco de dados, API, cloud) sem alterar uma única linha do motor.

### 2. Motor ≠ UI
O motor não sabe como os dados são exibidos. A UI pode ser completamente reescrita (mobile, CLI, API, SDK) sem alterar o motor.

### 3. Dados Estáticos ≠ Dados Dinâmicos
`questions.json` e `TOPICS` são estáticos e imutáveis em runtime. `UserProgress` é dinâmico e evoluí a cada sessão.

### 4. Estado Fonte ≠ Estado Derivado
`topics` é fonte de verdade. `macroTopics` é computado sob demanda. Nunca conflitam. Nunca divergem.
