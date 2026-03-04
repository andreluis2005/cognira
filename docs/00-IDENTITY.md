# 00 — IDENTIDADE DO COGNIRA

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Alterações exigem revisão arquitetural completa.

---

## O Que É o Cognira

Cognira é um **Motor Determinístico de Retenção Cognitiva** (Deterministic Cognitive Retention Engine).

Não é um aplicativo de quiz. Não é um flashcard app. Não é uma plataforma de estudos genérica.

É uma **infraestrutura computacional** projetada para garantir que, dado o mesmo estado de entrada, o sistema sempre produz a mesma sequência de decisões — tornando cada sessão de estudo **auditável, reproduzível e matematicamente verificável**.

### Definição Formal

```
f(progress, sessionId, history, timestamp) → output determinístico
∴ Dado mesmo input → mesmo output, sempre.
```

---

## O Que o Cognira NÃO É

| Cognira NÃO é... | Porque... |
|---|---|
| Um quiz app | Quizzes são aleatórios. Cognira é determinístico. |
| Um flashcard app (Anki-like) | Flashcards dependem de auto-avaliação subjetiva. Cognira usa métricas objetivas. |
| Uma plataforma de ensino | Cognira não ensina. Ele otimiza a **retenção** do que já foi aprendido. |
| Um wrapper de UI sobre lógica trivial | O motor é o ativo principal. A UI é substituível. |
| Dependente de AI/ML para decisões | Todas as decisões são determinísticas via PRNG seeded e pesos formais. |

---

## Missão Core

**Maximizar a retenção cognitiva de longo prazo através de reforço determinístico, priorização por risco e simulação de pressão — com garantias matemáticas de reprodutibilidade.**

---

## Posicionamento Estratégico

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CAMADA DE INFRAESTRUTURA (Investment-Grade)           │
│                                                         │
│   • Motor puro, sem side-effects                        │
│   • 21 invariantes formais verificáveis em runtime      │
│   • PRNG Mulberry32 com seed composta (período 2³²)     │
│   • Self-check CI-ready com 28 testes internos          │
│   • Complexidade formal documentada (Big-O)             │
│   • Projetado para 10M+ usuários                        │
│                                                         │
│   Comparável a: motor de pricing de hedge fund,         │
│   motor de matching de exchange, core de motor de jogo. │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Por Que Determinismo Importa

### 1. Auditabilidade
Qualquer sessão pode ser **reproduzida exatamente** a partir de seu `sessionId` + estado de progresso + step index. Isso permite investigar bugs, validar resultados e provar que o sistema funciona como especificado.

### 2. Testabilidade
Testes determinísticos não são flaky. A mesma seed sempre produz a mesma sequência. O `runEngineSelfCheck()` valida 28 propriedades em cada build.

### 3. Confiança Institucional
Para que o Cognira escale como SaaS ou SDK, clientes corporativos precisam de **provas** de que o sistema se comporta conforme especificado. Determinismo é a fundação dessa prova.

### 4. Escalabilidade
Funções puras sem side-effects são trivialmente paralelizáveis. O motor pode rodar em qualquer ambiente (browser, server, edge worker) sem adaptação.

### 5. Replay & Debug
A capacidade de replay parcial (DET-04) permite reconstruir qualquer ponto de uma sessão sem re-executar do início:

```
Seed = FNV1a(sessionId) ⊕ FNV1a(progressHash) ⊕ stepIndex
→ Avançar N steps do RNG = ponto exato da sessão
```

---

## Princípio Fundamental

> **O Motor é o ativo. A interface é descartável.**
>
> Qualquer decisão que comprometa a pureza funcional, o determinismo ou a integridade dos invariantes do motor é uma decisão que destrói o valor do Cognira como infraestrutura.
