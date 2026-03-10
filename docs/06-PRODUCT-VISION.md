# 06 — VISÃO DE PRODUTO

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Define o horizonte estratégico do Cognira.

---

## Cognira Como Infraestrutura

O Cognira não é um produto de consumo. É **infraestrutura computacional** que pode ser empacotada de múltiplas formas.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    COGNIRA ENGINE                            │
│          (Motor Determinístico de Retenção Cognitiva)       │
│                                                             │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────┐  │
│  │   SDK   │  │   API    │  │  SaaS   │  │ White-Label │  │
│  └─────────┘  └──────────┘  └─────────┘  └─────────────┘  │
│                                                             │
│  O motor é o MESMO em todas as formas de distribuição.      │
│  Apenas a camada de entrega muda.                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Potencial de SDK

### Cognira SDK (`@cognira/engine`)

Um pacote NPM que permite qualquer desenvolvedor integrar o motor de retenção cognitiva em suas próprias aplicações.

```typescript
import { startSession, processStep, calculateReadinessScore } from '@cognira/engine';

// Qualquer app pode usar o motor sem construir a lógica do zero
const session = startSession(userProgress, 'smart');
```

### Características do SDK

| Aspecto | Descrição |
|---------|-----------|
| **Zero dependências** | O motor não depende de React, Next.js ou qualquer framework |
| **Isomórfico** | Funciona no browser, Node.js, edge workers, React Native |
| **Tipado** | TypeScript com tipos exportados — zero `any` na API pública |
| **Determinístico** | Mesmo input → mesmo output, em qualquer ambiente |
| **Self-validating** | `runEngineSelfCheck()` pode ser chamado pelo consumidor |
| **Tamanho** | ~73KB de TypeScript puro, sem assets |

### Target Audience

- Plataformas de e-learning que querem SRS determinístico
- Empresas de treinamento corporativo
- Universidades com sistemas de avaliação adaptativa
- Aplicativos de estudo que precisam de rigor científico

---

## Potencial de API

### Cognira API (REST/GraphQL)

Uma API pública que expõe o motor como serviço stateless.

```
POST /api/v1/sessions/start
POST /api/v1/sessions/{id}/step
GET  /api/v1/progress/{userId}/readiness
GET  /api/v1/progress/{userId}/risk-zones
POST /api/v1/sessions/{id}/pressure/score
```

### Características da API

| Aspecto | Descrição |
|---------|-----------|
| **Stateless** | Server não mantém estado — tudo vem no request |
| **Determinístico** | Replay de sessão via `sessionId` |
| **Multi-tenant** | Cada org/user isolado por `userId` e `examId` |
| **Auditável** | Cada decisão é rastreável e reproduzível |
| **Rate-limitable** | Funções puras são trivialmente rate-limitáveis |

---

## Futuro SaaS

### Modelo de Monetização

```
┌────────────────────────────────────────────────────┐
│  TIER            │  FEATURES           │  PREÇO    │
├────────────────────────────────────────────────────┤
│  Free            │  1 exame, básico    │  $0/mês   │
│  Pro             │  5 exames, CSI,     │  $9/mês   │
│                  │  Pressure Mode      │           │
│  Enterprise      │  Ilimitado, API,    │  Custom   │
│                  │  White-label, SLA   │           │
└────────────────────────────────────────────────────┘
```

### Métricas Diferenciadas (SaaS Premium)

| Métrica | Valor para o Usuário |
|---------|---------------------|
| Readiness Score | "Quão pronto estou para o exame?" |
| Risk Zones | "Quais tópicos vão me reprovar?" |
| CSI | "Meu conhecimento é estável ou frágil?" |
| Pressure Score | "Eu congelo sob pressão?" |
| Confidence Index | "Posso confiar no meu desempenho real?" |

Nenhum concorrente no mercado de certificação oferece esta profundidade analítica com **garantias determinísticas verificáveis**.

---

## Modelo White-Label

### Cognira for Business

Empresas de treinamento podem licenciar o motor e entregar sob suas próprias marcas:

```
┌──────────────────────────────┐
│  EMPRESA CLIENTE             │
│  ┌────────────────────────┐  │
│  │  UI da Empresa         │  │  ← A empresa constrói sua UI
│  │  (branding próprio)    │  │
│  └────────┬───────────────┘  │
│           │                  │
│  ┌────────▼───────────────┐  │
│  │  COGNIRA ENGINE        │  │  ← Motor idêntico, sem modificação
│  │  (SDK integrado)       │  │
│  └────────────────────────┘  │
│                              │
│  Dados isolados por tenant   │
└──────────────────────────────┘
```

### Requisitos para White-Label

1. O motor é **idêntico** — sem forks customizados
2. Customização acontece apenas na camada de UI e configuração (exames, tópicos)
3. Dados de cada tenant são isolados
4. O motor é distribuído como SDK ou acessado via API — nunca modificado

---

## Horizontes Estratégicos

### Curto Prazo (0–6 meses)
- Web app funcional para AWS Cloud Practitioner
- Validação do modelo de retenção com dados reais
- Self-check CI pipeline

### Médio Prazo (6–18 meses)
- Suporte multi-exame (AWS SA, Azure, GCP)
- API pública (v1)
- SDK NPM (`@cognira/engine`)
- Dashboard avançado com Risk Zones e CSI

### Longo Prazo (18–36 meses)
- SaaS com planos Free/Pro/Enterprise
- White-label para empresas de treinamento
- Integrações LMS (Learning Management System)
- Mobile (React Native consumindo SDK)
- Modelo de dados em PostgreSQL com migração completa de localStorage

---

## O Que Protege o Valor

O valor do Cognira não está na UI. Está no **motor determinístico**, nos **21 invariantes formais**, nos **28 self-tests** e na **arquitetura de grau institucional**.

Qualquer decisão que comprometia esses fundamentos destrói o posicionamento estratégico do produto.
