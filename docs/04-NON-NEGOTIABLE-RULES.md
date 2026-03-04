# 04 — REGRAS NÃO-NEGOCIÁVEIS

> **Versão Constitucional:** 1.0  
> **Última atualização:** 2026-03-04  
> **Status:** IMUTÁVEL — Nenhuma regra pode ser relaxada sem revisão arquitetural completa.

---

## Propósito

Este documento lista explicitamente o que **NUNCA** pode ser alterado sem uma revisão arquitetural formal, documentada e aprovada. Estas regras existem para proteger a integridade do Cognira como infraestrutura de grau institucional.

---

## 🔴 Regras Absolutas

### R01 — Determinismo do Motor
> **O motor DEVE ser determinístico.**

- Nenhuma fonte de aleatoriedade não-controlada pode ser introduzida em caminhos de decisão
- `Math.random()` é **proibido** em qualquer função que influencie seleção de questões
- O PRNG deve ser Mulberry32 com seed composta conforme DET-03
- `crypto.randomUUID()` é permitido **apenas** para geração de `sessionId` (output, não input)

### R02 — Pureza Funcional do Motor
> **Nenhuma função do motor pode ter side-effects.**

- Zero leitura/escrita de estado externo (filesystem, rede, variáveis globais)
- Zero referência ao relógio do sistema — timestamp é parâmetro injetado
- Zero `console.log/warn/error` em caminhos de produção
- Todas as entradas são parâmetros; todas as saídas são retornos

### R03 — Imutabilidade de Dados
> **Nenhuma função do motor pode mutar seus argumentos.**

- Deep clone obrigatório antes de modificar `topics` ou `questionsHistory`
- Nenhuma referência compartilhada entre input e output
- O chamador sempre recebe um objeto novo

### R04 — Separação Motor/UI
> **A UI NUNCA toma decisões de lógica.**

- Seleção de questões: MOTOR
- Cálculo de scores: MOTOR
- Progressão de mastery: MOTOR
- Decisão de reforço: MOTOR
- Classificação de risco: MOTOR
- Exibição e input do usuário: UI

### R05 — Separação Motor/Storage
> **O motor NÃO sabe como dados são persistidos.**

- O motor recebe `UserProgress` como parâmetro e retorna `UserProgress` atualizado
- Nenhuma referência a `localStorage`, API, banco de dados ou filesystem no motor
- A camada de persistência pode ser substituída sem alterar o motor

### R06 — macroTopics São Derivados
> **macroTopics NUNCA são persistidos.**

- `macroTopics = deriveMacroTopics(topics)` — sempre computado, nunca salvo
- O `saveUserProgress()` remove `macroTopics` explicitamente antes de salvar
- Qualquer tentativa de persistir macroTopics viola R06

### R07 — Invariantes São Invioláveis
> **Nenhum invariante (INV-01 a INV-21) pode ser violado em runtime.**

- Violação de invariante = bug crítico
- `assertInvariant()` lança erro explícito — sem falha silenciosa
- Todos os invariantes são verificáveis por `runEngineSelfCheck()`

### R08 — Fórmula de Readiness É Imutável
> **`readiness = 30% × coverage + 70% × performance` — INV-13**

- Esta fórmula é uma constante do sistema
- Extensões cognitivas (CSI, pressão) produzem métricas **separadas**
- O readiness base NUNCA é alterado por extensões

### R09 — Extensões São Aditivas
> **Extensões cognitivas NUNCA modificam funções existentes.**

- Novas funções podem ser adicionadas
- Novos campos de tipo devem ser opcionais (`?`)
- Se campos opcionais ausentes → comportamento idêntico ao original
- Zero alteração em `startSession()`, `processStep()`, `selectNextQuestion()` etc.

### R10 — Histórico Nunca É Deletado Retroativamente
> **Dados de `questionsHistory` são comprimidos, nunca deletados.**

- `compressHistory()` mantém as `MAX_HISTORY_SIZE` entradas mais recentes
- Entradas existentes nunca têm seus campos alterados pela compressão
- O conteúdo do que é mantido permanece íntegro

### R11 — Tipos São a Fonte de Verdade
> **`lib/types.ts` define o contrato formal do sistema.**

- Nenhum campo obrigatório pode ser adicionado sem revisão completa
- Extensões usam campos opcionais
- Runtime assertions validam contra os tipos

### R12 — Self-Check Deve Sempre Passar
> **`runEngineSelfCheck()` deve retornar `passed: true` em todos os builds.**

- Se qualquer dos 28 testes falhar → build corrompido
- Novos testes devem ser adicionados para novas funcionalidades
- Testes existentes NUNCA são removidos ou relaxados

---

## Processo de Revisão Arquitetural

Para alterar qualquer Regra Não-Negociável:

1. **Documentar** a motivação completa por escrito
2. **Analisar** o impacto em todos os invariantes afetados
3. **Demonstrar** que nenhum invariante é violado (ou propor novos invariantes)
4. **Verificar** que `runEngineSelfCheck()` continua passando
5. **Atualizar** TODOS os documentos constitucionais afetados
6. **Registrar** a mudança com data e justificativa
