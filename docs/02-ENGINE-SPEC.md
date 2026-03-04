# 02 — ESPECIFICAÇÃO DO MOTOR

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Este documento DESCREVE o motor. Não prescreve mudanças.

---

## 1. Comportamento Determinístico

### Garantias Formais (DET-01 a DET-06)

| ID | Garantia | Descrição |
|----|----------|-----------|
| DET-01 | Seed → Sequência | Mesma seed composta → mesma sequência de questões |
| DET-02 | PRNG Formal | Mulberry32, período 2³², distribuição uniforme sobre [0, 1) |
| DET-03 | Seed Composta | `Seed = FNV1a(sessionId) ⊕ FNV1a(progressHash) ⊕ stepIndex` |
| DET-04 | Replay Parcial | Reconstruir RNG com N avanços produz sequência idêntica a partir do ponto N |
| DET-05 | Zero Math.random() | Nenhum uso de `Math.random()` em caminhos de seleção |
| DET-06 | sessionId Obrigatório | Erro explícito se `sessionId` ausente — sem fallback silencioso |

### Composição da Seed

```
sessionHash   = FNV-1a(sessionId)     // identidade única da sessão
progressHash  = FNV-1a(canonicalState) // estado determinístico do progresso
stepIndex     = integer                // posição na sessão

seed = (sessionHash ^ progressHash ^ stepIndex) >>> 0
```

A serialização canônica do estado ordena as chaves de `topics` alfabeticamente, garantindo determinismo independente da insertion order de objetos JavaScript.

---

## 2. Princípios de Decisão de Reforço

### Seleção Ponderada (Modo SMART)

O motor usa **seleção por roleta ponderada** (roulette wheel selection) para escolher questões:

| Status do Tópico | Peso | Significado |
|-------------------|------|-------------|
| `WEAK` / `NOT_EVALUATED` | 30 | Prioridade máxima — tópicos com déficit severo |
| `EVOLVING` | 20 | Prioridade alta — tópicos em desenvolvimento |
| `STRONG` | 5 | Manutenção — reforço espaçado |

### Controle de STRONG

O motor controla quantas questões STRONG aparecem por sessão via `getStrongQuestionsTarget()`:

| % de Tópicos STRONG | Questões STRONG/sessão |
|----------------------|------------------------|
| > 50% | Máximo 1 |
| > 20% | Máximo 2 |
| ≤ 20% | Máximo 3 |

### Decisões Forçadas vs. Bloqueadas

- **FORÇADA:** Quando os slots restantes ≤ questões STRONG necessárias → força seleção STRONG
- **BLOQUEADA:** Quando limite de STRONG atingido → bloqueia seleção STRONG, prioriza WEAK/EVOLVING

### Reforço Imediato (+2)

Quando o usuário erra uma questão, ela é reinserida na sessão **após um buffer de 2 questões de distração**:

```
Questão X [ERRO] → Questão Y → Questão Z → Questão X [REFORÇO]
```

- Máximo de 3 reforços pendentes por sessão (`MAX_REINFORCEMENT_CAP = 3`)
- Reforço tem prioridade sobre seleção ponderada

---

## 3. Tracking de Histórico

### Histórico por Questão (`QuestionHistory`)

Cada questão mantém seu próprio registro de SRS (Spaced Repetition System):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `lastAttempt` | ISO string | Última vez que foi respondida |
| `lastSeen` | ISO string | Última vez que foi exibida |
| `nextReview` | ISO string | Data calculada da próxima revisão |
| `masteryLevel` | [0, 5] | Nível de domínio (controla intervalos) |
| `consecutiveSuccesses` | ≥ 0 | Acertos consecutivos |
| `errorCount` | ≥ 0 | Total de erros históricos |

### Intervalos de Mastery (SRS)

```
MASTERY_INTERVALS = [0, 1, 3, 7, 15, 30]  // dias
```

| Mastery Level | Intervalo | Significado |
|---------------|-----------|-------------|
| 0 | 0 dias | Revisão imediata |
| 1 | 1 dia | Muito recente |
| 2 | 3 dias | Consolidando |
| 3 | 7 dias | Estável |
| 4 | 15 dias | Forte |
| 5 | 30 dias | Dominado |

### Progressão de Mastery

- **Acerto:** `masteryLevel = min(masteryLevel + 1, 5)`, `consecutiveSuccesses += 1`
- **Erro:** `masteryLevel = max(0, masteryLevel - 1)`, `consecutiveSuccesses = 0`, `errorCount += 1`

---

## 4. Lógica de Prioridade

### Status de Tópico

```
attempts === 0   → NOT_EVALUATED
accuracy < 40    → WEAK
accuracy < 70    → EVOLVING
accuracy >= 70   → STRONG
```

### Readiness Score (INV-13)

Fórmula imutável:

```
readiness = clamp(round(30% × cobertura + 70% × performance), 0, 100)

Onde:
  cobertura   = (tópicos avaliados / total de tópicos) × 30
  performance = (média de accuracy dos tópicos avaliados / 100) × 70
```

### Extensões Cognitivas (Aditivas)

#### A) Risk Score por Tópico

```
riskScore = (accuracyDeficit × 0.35 + examImpact × 0.25 +
             inconsistency × 0.20 + recencyDecay × 0.20) × 100

Classificação:
  riskScore ≥ 60 → CRITICAL
  riskScore ≥ 30 → UNSTABLE
  riskScore < 30 → SOLID
```

#### B) Cognitive Stability Index (CSI)

```
CSI = (consistency × 0.40 + antiVolatility × 0.30 + trendScore × 0.30) × 100
```

#### C) Confidence Index (Dual Readiness)

```
confidenceIndex = 0.7 × avgCSI + 0.3 × pressureScore
```

**NUNCA modifica** o `readinessScore` base. É uma métrica **separada e complementar**.

---

## 5. Capacidade de Replay

O sistema suporta replay determinístico em dois níveis:

### Replay Completo
Dado `sessionId` + `UserProgress` inicial, toda a sessão pode ser reconstruída step-by-step produzindo a mesma sequência exata de questões.

### Replay Parcial (DET-04)
Para acessar o step N de uma sessão, basta:
1. Computar `seed = computeCompositeSeed(sessionId, progress, N)`
2. Criar `rng = createRng(seed)`
3. O RNG está posicionado no ponto exato

---

## 6. Análise de Complexidade

| Função | Pior Caso | Caso Médio | Memória |
|--------|-----------|------------|---------|
| `getTopicStatus()` | O(1) | O(1) | O(1) |
| `deriveMacroTopics()` | O(D×T) | O(T) | O(D) |
| `calculateReadinessScore()` | O(T) | O(T) | O(T) |
| `getStrongQuestionsTarget()` | O(T) | O(T) | O(1) |
| `selectNextQuestion()` | O(Q+H) | O(Q) | O(Q) |
| `processStep()` | O(Q+H+T) | O(Q+T) | O(Q+T) |
| `validateProgress()` | O(T+QH) | O(T+QH) | O(1) |
| `hashProgressState()` | O(T+QH) | O(T+QH) | O(1) |
| `compressHistory()` | O(QH) | O(1)* | O(QH) |

```
Notação: Q=|ALL_QUESTIONS|, T=|TOPICS|=17, H=|sessionHistory|≤15,
         QH=|questionsHistory|≤500, D=4 (macro domínios)

* compressHistory é O(1) amortizado quando |QH| < MAX_HISTORY_SIZE
```

### Lookups Otimizados (pré-computados uma vez)

| Estrutura | Acesso | Descrição |
|-----------|--------|-----------|
| `QUESTIONS_BY_ID` (Map) | O(1) | Substitui `ALL_QUESTIONS.find()` que seria O(Q) |
| `TOPICS_BY_DOMAIN` (Map) | O(1) | Substitui `TOPICS.filter()` repetido |

---

## 7. Self-Check (CI-Ready)

O motor exporta `runEngineSelfCheck()` com 28 testes internos:

| Range | Categoria | Exemplos |
|-------|-----------|----------|
| T01–T04 | PRNG e Hash | Determinismo, range [0,1), colisão |
| T05–T08 | Lógica Core | Status, readiness, validação |
| T09–T16 | Invariantes | Intervals, lookup, seeds, compressão, pureza |
| T17–T28 | Extensões Cognitivas | Risk score, CSI, pressão, confidence, backward compat |
