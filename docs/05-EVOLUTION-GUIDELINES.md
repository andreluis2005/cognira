# 05 — DIRETRIZES DE EVOLUÇÃO

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Define como o sistema pode crescer sem se corromper.

---

## Princípio Fundamental

> **O Cognira evolui por ADIÇÃO, nunca por MODIFICAÇÃO do core.**
>
> Novas features são camadas aditivas sobre um núcleo imutável.

---

## 1. Como Novas Features Devem Integrar

### Checklist de Integração

Toda nova feature deve satisfazer TODOS os critérios:

- [ ] **Aditiva:** Nenhuma função existente do motor foi alterada
- [ ] **Backward-compatible:** Se os novos campos opcionais estiverem ausentes, o comportamento é idêntico ao original
- [ ] **Pura:** A nova função não tem side-effects
- [ ] **Determinística:** Dado o mesmo input, produz o mesmo output
- [ ] **Invariantes preservados:** Todos os invariantes existentes continuam válidos
- [ ] **Novos invariantes:** Se aplicável, novos invariantes foram declarados e verificáveis
- [ ] **Self-check atualizado:** Novos testes foram adicionados a `runEngineSelfCheck()`
- [ ] **Tipos atualizados:** Novos campos em `lib/types.ts` são opcionais (`?`)
- [ ] **Documentação atualizada:** Documentos constitucionais refletem a mudança

### Exemplo de Integração Correta

As Extensões Cognitivas (Risk Zone, CSI, Pressure, Confidence) são o modelo a seguir:

```typescript
// ✅ CORRETO — Campo opcional em tipo existente
export interface TopicProgress {
    // ... campos existentes (inalterados) ...
    riskScore?: number;       // NOVO — opcional
    riskZone?: RiskZone;      // NOVO — opcional
    stabilityIndex?: number;  // NOVO — opcional
}

// ✅ CORRETO — Nova função que não altera nada existente
export const calculateTopicRiskScore = (
    topic: TopicProgress,
    topicDef: { examWeight: 'LOW' | 'MEDIUM' | 'HIGH' },
    questionsForTopic: QuestionHistory[],
    now: Date
): number => { /* ... */ };

// ✅ CORRETO — Backward compat: se campo ausente, retorna default
export const getRiskMultiplier = (riskZone?: RiskZone): number => {
    if (!riskZone) return 1.0;  // Comportamento original preservado
    return RISK_MULTIPLIERS[riskZone] ?? 1.0;
};
```

### Exemplo de Integração INCORRETA

```typescript
// ❌ PROIBIDO — Modificar função existente
export const calculateReadinessScore = (progress: UserProgress): number => {
    // ... lógica original ...
    const penalty = progress.avgCSI ? (100 - progress.avgCSI) * 0.1 : 0;
    return result - penalty;  // ← VIOLA INV-13 e R08
};

// ❌ PROIBIDO — Campo obrigatório em tipo existente
export interface TopicProgress {
    riskScore: number;  // ← QUEBRA backward compat (era opcional)
}

// ❌ PROIBIDO — Side-effect no motor
export const calculateCSI = (...) => {
    console.log('Calculating CSI...');  // ← VIOLA P7
    localStorage.setItem('lastCSI', ...);  // ← VIOLA P1, R02, R05
};
```

---

## 2. Como Suporte Multi-Exame Deve Ser Adicionado

O Cognira atualmente é focado em AWS Cloud Practitioner. Para suportar múltiplos exames:

### Arquitetura Recomendada

```
data/
  exams/
    aws-cloud-practitioner/
      questions.json
      topics.ts
    aws-solutions-architect/
      questions.json
      topics.ts
    azure-fundamentals/
      questions.json
      topics.ts

lib/
  engine.ts          ← NÃO MUDA
  types.ts           ← Adiciona ExamId ao UserProgress (opcional)
  storage.ts         ← Evolui para suportar múltiplos progressos
  exam-registry.ts   ← NOVO: registra exames disponíveis
```

### Regras

1. O motor (`engine.ts`) **NÃO sabe qual exame está rodando**. Ele recebe `Question[]` e `UserProgress` e faz seu trabalho
2. A seleção de exame é responsabilidade da **camada de configuração** (nova), não do motor
3. Cada exame tem seu próprio `UserProgress` — dados **nunca são compartilhados** entre exames
4. `TOPICS` e `ALL_QUESTIONS` devem ser parametrizados (injeção por exame) ao invés de importados estaticamente
5. O formato de `Question` e `Topic` permanece o mesmo

---

## 3. Como a Camada de Persistência Pode Evoluir

### De localStorage para API/Database

```
Fase 1 (Atual):  localStorage (browser)
Fase 2:          API REST (Next.js API routes + PostgreSQL)
Fase 3:          Microserviço independente + cache Redis
```

### Contrato de Interface

A camada de persistência expõe apenas duas operações:

```typescript
// Este contrato pode evoluir, mas a assinatura core permanece:
getUserProgress(userId: string, examId?: string): Promise<UserProgress>
saveUserProgress(progress: UserProgress): Promise<void>
```

### Regras de Evolução

1. O motor **nunca importa** da camada de persistência
2. A migração de esquema é responsabilidade da camada de persistência
3. `macroTopics` NUNCA é persistido — sempre derivado
4. A camada de persistência pode adicionar campos de metadados (timestamps, versão do esquema) sem afetar o motor
5. Backups e replicação são preocupações da persistência, não do motor

---

## 4. Como Evitar Contaminação do Motor

### Sinais de Contaminação

| Sinal | Diagnóstico |
|-------|-------------|
| Import de `localStorage`, `fetch`, ou `fs` no `engine.ts` | Violação de P1 (pureza funcional) |
| Uso de `Date.now()` ou `new Date()` sem parâmetro injetado | Violação de P4 |
| Uso de `Math.random()` em seleção de questões | Violação de DET-05 |
| `console.log/warn/error` em caminhos de produção | Violação de P7 |
| Modificação de argumento recebido em vez de clonar | Violação de P8 |
| Campo obrigatório adicionado a tipo existente | Violação de backward compat |
| Função existente com comportamento alterado | Violação de R09 |
| `runEngineSelfCheck()` falhando | Sistema corrompido |

### Prevenção

1. **Todo PR que toca `engine.ts` deve passar por `runEngineSelfCheck()`**
2. **Novos testes devem ser adicionados antes ou junto com novas funções**
3. **Grep proibido:** `Math.random`, `Date.now()`, `new Date()` sem parâmetro, `localStorage`, `fetch`, `console.` em `engine.ts`
4. **Type check:** Campos adicionados a tipos existentes devem ser opcionais
5. **Revisão de diff:** Qualquer modificação de função existente exige justificativa formal
