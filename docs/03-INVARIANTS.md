# 03 — INVARIANTES FORMAIS

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Violar qualquer invariante é proibido.

---

## Definição

Um **invariante** é uma propriedade que DEVE ser verdadeira em TODOS os estados válidos do sistema. Se um invariante for violado, o sistema está corrompido.

Todos os invariantes são:
- Declarados formalmente em `ENGINE_INVARIANTS` e `COGNITIVE_INVARIANTS`
- Verificáveis em runtime via funções `check()`
- Validados pela bateria `runEngineSelfCheck()` (28 testes)
- Protegidos por `assertInvariant()` em caminhos críticos

---

## Invariantes Core (INV-01 a INV-14)

### INV-01 — Readiness Score Range
```
readinessScore ∈ [0, 100] ⊂ ℤ
```
O score de prontidão é sempre um inteiro entre 0 e 100, inclusive.

### INV-02 — Coverage Range
```
coverage = evaluatedTopics / totalTopics ∈ [0, 1] ⊂ ℝ
```
A cobertura é sempre um número real finito entre 0 e 1.

### INV-03 — Accuracy Range
```
accuracy ∈ [0, 100] ⊂ ℤ (por tópico)
```
A acurácia de cada tópico é sempre um inteiro entre 0 e 100.

### INV-04 — Mastery Level Range
```
masteryLevel ∈ {0, 1, 2, 3, 4, 5} ⊂ ℤ
```
O nível de domínio é sempre um dos seis valores inteiros discretos.

### INV-05 — Correct ≤ Attempts
```
∀t ∈ topics: t.correct ≤ t.attempts
```
O número de acertos nunca excede o número de tentativas. Protegido por `safeCorrect = Math.min(correct, attempts)`.

### INV-06 — Non-Negative Counts
```
∀t ∈ topics: t.attempts ≥ 0 ∧ t.correct ≥ 0
```
Contadores de tentativas e acertos são sempre não-negativos e finitos.

### INV-07 — Error Count Non-Negative
```
∀q ∈ questionsHistory: q.errorCount ≥ 0
```
O contador de erros por questão é sempre não-negativo e finito.

### INV-08 — Consecutive Successes Non-Negative
```
∀q ∈ questionsHistory: q.consecutiveSuccesses ≥ 0
```
O contador de acertos consecutivos é sempre não-negativo e finito.

### INV-09 — Mastery Intervals Defined
```
MASTERY_INTERVALS[i] é definido e finito ∀ i ∈ [0, 5]
```
O array de intervalos de SRS possui exatamente 6 elementos, todos finitos e não-negativos. Verificado na inicialização do módulo — falha é fatal.

### INV-10 — Positive Total Weight
```
totalWeight > 0 antes de seleção por roleta
```
Antes de executar a seleção ponderada, o peso total do pool deve ser positivo. Evita divisão por zero e seleção indefinida.

### INV-11 — Reinforcement Cap
```
pendingReinforcements.length ≤ 3
```
Máximo de 3 reforços pendentes por sessão. Evita que múltiplos erros saturem a sessão com repetições.

### INV-12 — Session Length
```
sessionLength ≤ 15
```
Uma sessão tem no máximo 15 questões (incluindo reforços).

### INV-13 — Readiness Formula
```
readiness = clamp(round(30% × coverage + 70% × performance), 0, 100)
```
O readiness score segue EXATAMENTE esta fórmula. Verificável por `ENGINE_INVARIANTS.INV_13_READINESS_FORMULA.check()`.

### INV-14 — History Bounded
```
|questionsHistory| ≤ MAX_HISTORY_SIZE (500)
```
O histórico de questões nunca excede 500 entradas. Protegido por `compressHistory()` com evicção LRU temporal.

---

## Invariantes Cognitivos (INV-15 a INV-21)

### INV-15 — Risk Score Range
```
riskScore ∈ [0, 100]
```

### INV-16 — CSI Range
```
stabilityIndex (CSI) ∈ [0, 100]
```

### INV-17 — Pressure Score Range
```
pressureScore ∈ [0, 100]
```

### INV-18 — Confidence Index Range
```
confidenceIndex ∈ [0, 100]
```

### INV-19 — Risk Zone Valid
```
riskZone ∈ {CRITICAL, UNSTABLE, SOLID}
```

### INV-20 — Risk Multiplier Range
```
riskMultiplier ∈ {1.0, 1.25, 1.6}
```

### INV-21 — No Readiness Reduction
```
readinessBase nunca é reduzido por extensões cognitivas
```
As extensões cognitivas produzem métricas **separadas** (confidenceIndex). O readinessScore base NUNCA é modificado por elas.

---

## Meta-Invariantes (Propriedades do Sistema)

### Invariante de Determinismo
> Dado `f(progress, sessionId, history, timestamp)`, a saída é **sempre** idêntica para a mesma entrada. Nenhuma fonte de aleatoriedade externa (Math.random, Date.now, network) influencia decisões.

### Invariante de Histórico Imutável
> O histórico de questões (`questionsHistory`) **nunca é deletado**, apenas comprimido. Entradas são removidas apenas quando `|questionsHistory| > MAX_HISTORY_SIZE`, via evicção LRU temporal (mais antigas primeiro). O conteúdo de entradas existentes nunca é retroativamente alterado por compressão.

### Invariante de Consistência de Reforço
> Se uma questão foi respondida incorretamente, ela será reinserida exatamente 2 questões depois, sujeita ao cap de 3 reforços pendentes. A decisão de reforço tem prioridade sobre a seleção ponderada.

### Invariante de Não-Autoridade da UI
> A camada de interface **nunca** toma decisões sobre seleção de questões, cálculo de scores, progressão de mastery ou qualquer lógica de retenção. Toda decisão passa pelo motor. A UI é um **terminal de exibição**.

### Invariante de Integridade de Tipos
> Todos os tipos são definidos em `lib/types.ts` e são a fonte de verdade tipada do sistema. Extensões de tipo usam campos opcionais (`?`) para garantir compatibilidade retroativa. Nenhum campo obrigatório pode ser adicionado a tipos existentes sem revisão arquitetural.
