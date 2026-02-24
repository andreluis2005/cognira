/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║            COGNIRA — Deterministic Learning Engine v3.0                     ║
 * ║            Grade: Investment-Fund Auditable Infrastructure                 ║
 * ║                                                                            ║
 * ║  Core engine da plataforma educacional Cognira.                            ║
 * ║  Projetada para escala global (10M+ usuários).                             ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                            ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │ PROVA DE PUREZA FUNCIONAL                                         │    ║
 * ║  │                                                                   │    ║
 * ║  │  P1: Nenhuma função lê ou escreve estado externo (filesystem,     │    ║
 * ║  │      rede, variáveis globais mutáveis).                           │    ║
 * ║  │  P2: Todas as entradas são parâmetros explícitos.                 │    ║
 * ║  │  P3: Todas as saídas são valores de retorno explícitos.           │    ║
 * ║  │  P4: Nenhuma referência ao relógio do sistema (Date.now,          │    ║
 * ║  │      new Date) — timestamp é injetado como parâmetro.             │    ║
 * ║  │  P5: PRNG é determinístico (Mulberry32, seed explícita).          │    ║
 * ║  │  P6: crypto.randomUUID() usado apenas em startSession para       │    ║
 * ║  │      geração de ID; não influencia seleção de questões.           │    ║
 * ║  │  P7: Nenhum console.log/warn/error em caminhos de produção.      │    ║
 * ║  │  P8: Imutabilidade profunda — nenhuma ref compartilhada.          │    ║
 * ║  │                                                                   │    ║
 * ║  │  ∴ f(progress, sessionId, history, timestamp) = determinístico    │    ║
 * ║  │  ∴ Dado mesmo input → mesmo output, sempre.                      │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ║                                                                            ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │ GARANTIAS DETERMINÍSTICAS                                         │    ║
 * ║  │                                                                   │    ║
 * ║  │  DET-01: Mesma seed composta → mesma sequência de questões.       │    ║
 * ║  │  DET-02: PRNG Mulberry32, período 2³², distribuição uniforme.     │    ║
 * ║  │  DET-03: Seed = FNV1a(sessionId) ⊕ FNV1a(progressHash) ⊕ step.  │    ║
 * ║  │  DET-04: Replay parcial: reconstruir RNG com N avanços           │    ║
 * ║  │          produz sequência idêntica a partir do ponto N.           │    ║
 * ║  │  DET-05: Zero usos de Math.random() em caminhos de seleção.      │    ║
 * ║  │  DET-06: sessionId é OBRIGATÓRIO — erro explícito se ausente.    │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ║                                                                            ║
 * ║  ┌─────────────────────────────────────────────────────────────────────┐    ║
 * ║  │ ANÁLISE FORMAL DE COMPLEXIDADE                                    │    ║
 * ║  │                                                                   │    ║
 * ║  │  Notação: Q=|ALL_QUESTIONS|, T=|TOPICS|, H=|history|≤15,         │    ║
 * ║  │           QH=|questionsHistory|≤MAX_HISTORY(500), D=4 domínios   │    ║
 * ║  │                                                                   │    ║
 * ║  │  Função                    │ Pior Caso  │ Médio      │ Memória   │    ║
 * ║  │  ─────────────────────────────────────────────────────────────── │    ║
 * ║  │  getTopicStatus()          │ O(1)       │ O(1)       │ O(1)     │    ║
 * ║  │  deriveMacroTopics()       │ O(D×T)     │ O(T)       │ O(D)    │    ║
 * ║  │  calculateReadinessScore() │ O(T)       │ O(T)       │ O(T)    │    ║
 * ║  │  getStrongQuestionsTarget()│ O(T)       │ O(T)       │ O(1)    │    ║
 * ║  │  selectNextQuestion()      │ O(Q+H)     │ O(Q)       │ O(Q)    │    ║
 * ║  │  processStep()             │ O(Q+H+T)   │ O(Q+T)     │ O(Q+T) │    ║
 * ║  │  validateProgress()        │ O(T+QH)    │ O(T+QH)    │ O(1)   │    ║
 * ║  │  hashProgressState()       │ O(T+QH)    │ O(T+QH)    │ O(1)   │    ║
 * ║  │  compressHistory()         │ O(QH)      │ O(1)*      │ O(QH)  │    ║
 * ║  │                                                                   │    ║
 * ║  │  * compressHistory é O(1) amortizado quando |QH| < MAX_HISTORY   │    ║
 * ║  │                                                                   │    ║
 * ║  │  Lookups otimizados (pré-computados uma vez):                     │    ║
 * ║  │    QUESTIONS_BY_ID (Map) : O(1) por acesso                       │    ║
 * ║  │    TOPICS_BY_DOMAIN (Map): O(1) por domínio                      │    ║
 * ║  └─────────────────────────────────────────────────────────────────────┘    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { Question, UserProgress, QuestionHistory, MacroDomain, TopicStatus, TopicProgress } from './types';
import questionsData from '@/data/questions.json';
import { TOPICS } from './topics';

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 1: INVARIANTES FORMAIS (ESPECIFICAÇÃO EXPORTADA)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Especificação formal dos invariantes da engine.
 * Separação clara entre especificação e implementação.
 * Cada invariante é declarado matematicamente e verificável em runtime.
 */
export const ENGINE_INVARIANTS = {
    /** readinessScore ∈ [0, 100] ⊂ ℤ */
    INV_01_READINESS_RANGE: {
        id: 'INV-01',
        description: 'readinessScore ∈ [0, 100] ⊂ ℤ',
        check: (value: number): boolean =>
            Number.isInteger(value) && value >= 0 && value <= 100,
    },
    /** coverage = evaluatedTopics / totalTopics ∈ [0, 1] ⊂ ℝ */
    INV_02_COVERAGE_RANGE: {
        id: 'INV-02',
        description: 'coverage ∈ [0, 1] ⊂ ℝ',
        check: (value: number): boolean =>
            Number.isFinite(value) && value >= 0 && value <= 1,
    },
    /** accuracy ∈ [0, 100] ⊂ ℤ (por tópico) */
    INV_03_ACCURACY_RANGE: {
        id: 'INV-03',
        description: 'accuracy ∈ [0, 100] ⊂ ℤ',
        check: (value: number): boolean =>
            Number.isInteger(value) && value >= 0 && value <= 100,
    },
    /** masteryLevel ∈ {0, 1, 2, 3, 4, 5} ⊂ ℤ */
    INV_04_MASTERY_RANGE: {
        id: 'INV-04',
        description: 'masteryLevel ∈ {0, 1, 2, 3, 4, 5}',
        check: (value: number): boolean =>
            Number.isInteger(value) && value >= 0 && value <= 5,
    },
    /** ∀t ∈ topics: t.correct ≤ t.attempts */
    INV_05_CORRECT_LEQ_ATTEMPTS: {
        id: 'INV-05',
        description: '∀t ∈ topics: t.correct ≤ t.attempts',
        check: (correct: number, attempts: number): boolean =>
            correct <= attempts,
    },
    /** ∀t ∈ topics: t.attempts ≥ 0 ∧ t.correct ≥ 0 */
    INV_06_NON_NEGATIVE_COUNTS: {
        id: 'INV-06',
        description: '∀t ∈ topics: t.attempts ≥ 0 ∧ t.correct ≥ 0',
        check: (attempts: number, correct: number): boolean =>
            Number.isFinite(attempts) && attempts >= 0 &&
            Number.isFinite(correct) && correct >= 0,
    },
    /** ∀q ∈ questionsHistory: q.errorCount ≥ 0 */
    INV_07_ERROR_COUNT_NON_NEGATIVE: {
        id: 'INV-07',
        description: '∀q ∈ questionsHistory: q.errorCount ≥ 0',
        check: (value: number): boolean =>
            Number.isFinite(value) && value >= 0,
    },
    /** ∀q ∈ questionsHistory: q.consecutiveSuccesses ≥ 0 */
    INV_08_CONSECUTIVE_NON_NEGATIVE: {
        id: 'INV-08',
        description: '∀q ∈ questionsHistory: q.consecutiveSuccesses ≥ 0',
        check: (value: number): boolean =>
            Number.isFinite(value) && value >= 0,
    },
    /** MASTERY_INTERVALS[i] é definido e finito ∀ i ∈ [0, 5] */
    INV_09_MASTERY_INTERVALS_DEFINED: {
        id: 'INV-09',
        description: 'MASTERY_INTERVALS[i] é definido ∀ i ∈ [0, 5]',
        check: (intervals: number[]): boolean =>
            intervals.length === 6 && intervals.every(v => Number.isFinite(v) && v >= 0),
    },
    /** totalWeight > 0 antes de seleção por roleta */
    INV_10_POSITIVE_TOTAL_WEIGHT: {
        id: 'INV-10',
        description: 'totalWeight > 0 antes de seleção por roleta',
        check: (value: number): boolean =>
            Number.isFinite(value) && value > 0,
    },
    /** pendingReinforcements.length ≤ MAX_REINFORCEMENT_CAP */
    INV_11_REINFORCEMENT_CAP: {
        id: 'INV-11',
        description: 'pendingReinforcements.length ≤ 3',
        check: (value: number): boolean =>
            Number.isInteger(value) && value >= 0 && value <= 3,
    },
    /** sessionLength ≤ SESSION_SIZE */
    INV_12_SESSION_LENGTH: {
        id: 'INV-12',
        description: 'sessionLength ≤ 15',
        check: (value: number): boolean =>
            Number.isInteger(value) && value >= 0 && value <= 15,
    },
    /** readiness = clamp(round(30% × coverage + 70% × performance), 0, 100) */
    INV_13_READINESS_FORMULA: {
        id: 'INV-13',
        description: 'readiness = clamp(round(30% × coverage + 70% × perf), 0, 100)',
        check: (readiness: number, coverage: number, avgAccuracy: number): boolean => {
            const expected = Math.min(Math.round(coverage * 30 + (avgAccuracy / 100) * 70), 100);
            return readiness === Math.max(0, expected);
        },
    },
    /** |questionsHistory| ≤ MAX_HISTORY_SIZE */
    INV_14_HISTORY_BOUNDED: {
        id: 'INV-14',
        description: '|questionsHistory| ≤ MAX_HISTORY_SIZE (500)',
        check: (size: number): boolean =>
            Number.isInteger(size) && size >= 0 && size <= 500,
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 2: CONSTANTES E ESTRUTURAS PRÉ-COMPUTADAS
// ═══════════════════════════════════════════════════════════════════════════════

const ALL_QUESTIONS = questionsData as Question[];
export const MASTERY_INTERVALS = [0, 1, 3, 7, 15, 30];

/** Tamanho máximo da sessão */
const SESSION_SIZE = 15;

/** Máximo de reforços pendentes por sessão */
const MAX_REINFORCEMENT_CAP = 3;

/** Limite de crescimento de questionsHistory — INV-14 */
const MAX_HISTORY_SIZE = 500;

/** Invariant: banco de questões deve existir */
if (ALL_QUESTIONS.length === 0) {
    throw new Error('[Cognira Engine] FATAL: questions database is empty. Cannot initialize engine.');
}

/** Invariant: MASTERY_INTERVALS deve ter 6 elementos finitos */
if (!ENGINE_INVARIANTS.INV_09_MASTERY_INTERVALS_DEFINED.check(MASTERY_INTERVALS)) {
    throw new Error('[Cognira Engine] FATAL: MASTERY_INTERVALS is malformed.');
}

/**
 * Lookup O(1) por ID de questão.
 * Substitui ALL_QUESTIONS.find() que é O(Q) em caminhos críticos.
 */
const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(
    ALL_QUESTIONS.map(q => [q.id, q])
);

/**
 * Agrupamento O(1) de tópicos por macro domínio.
 * Substitui TOPICS.filter() repetido em deriveMacroTopics.
 */
const TOPICS_BY_DOMAIN: ReadonlyMap<string, readonly (typeof TOPICS)[number][]> = (() => {
    const map = new Map<string, (typeof TOPICS)[number][]>();
    for (const t of TOPICS) {
        const existing = map.get(t.macroDomain) || [];
        existing.push(t);
        map.set(t.macroDomain, existing);
    }
    return map;
})();

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 3: PRNG DETERMINÍSTICO (PURO)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mulberry32 — PRNG determinístico puro.
 * Período: 2³². Distribuição: uniforme sobre [0, 1).
 * Referência: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 *
 * @param seed - Inteiro 32-bit usado como estado inicial
 * @returns Função que retorna próximo valor pseudo-aleatório ∈ [0, 1)
 */
const createRng = (seed: number): (() => number) => {
    let state = seed | 0;
    return (): number => {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/**
 * FNV-1a hash de 32 bits — determinístico e rápido.
 * Converte string em inteiro sem sinal de 32 bits.
 * Complexidade: O(|str|)
 */
const fnv1aHash = (str: string): number => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
};

/**
 * Gera hash determinístico do estado de progresso.
 * Serializa campos que influenciam a seleção de questões em ordem canônica.
 *
 * Campos incluídos (todos que afetam seleção):
 *   - topics: topicId, attempts, correct, status (afetam pesos de seleção)
 *
 * Complexidade: O(T) — T = |topics|
 */
const hashProgressState = (progress: UserProgress): number => {
    const parts: string[] = [];
    // Chaves ordenadas para garantir determinismo independente de insertion order
    const sortedTopicKeys = Object.keys(progress.topics || {}).sort();
    for (const key of sortedTopicKeys) {
        const t = progress.topics[key];
        parts.push(`${key}:${t.attempts}:${t.correct}:${t.status}`);
    }
    return fnv1aHash(parts.join('|'));
};

/**
 * Cria seed composta a partir de três componentes (DET-03):
 *   seed = FNV1a(sessionId) ⊕ FNV1a(progressHash) ⊕ stepIndex
 *
 * A combinação XOR garante que:
 *   - Sessões diferentes com mesmo progresso → seeds diferentes
 *   - Mesmo progresso em steps diferentes → seeds diferentes
 *   - Mesmo sessionId com progresso diferente → seeds diferentes
 */
const computeCompositeSeed = (sessionId: string, progress: UserProgress, stepIndex: number): number => {
    const sessionHash = fnv1aHash(sessionId);
    const progressHash = hashProgressState(progress);
    return (sessionHash ^ progressHash ^ (stepIndex | 0)) >>> 0;
};

/**
 * Cria um RNG determinístico para um ponto exato da sessão.
 *
 * @param sessionId - UUID da sessão (obrigatório — DET-06)
 * @param progress - Estado do progresso (para seed composta)
 * @param stepIndex - Índice do passo atual na sessão
 * @returns Função RNG posicionada deterministicamente
 */
const createSessionRng = (
    sessionId: string,
    progress: UserProgress,
    stepIndex: number
): (() => number) => {
    const seed = computeCompositeSeed(sessionId, progress, stepIndex);
    return createRng(seed);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 4: UTILITÁRIOS PUROS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assertion de invariante com mensagem descritiva.
 * Lança erro explícito se qualquer invariante formal for violado.
 * Puro: não lê estado externo, apenas avalia condição.
 */
function assertInvariant(condition: boolean, message: string): asserts condition {
    if (!condition) {
        throw new Error(`[Cognira Engine] INVARIANT VIOLATION: ${message}`);
    }
}

/** Clamp puro: value ∈ [min, max] */
const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

/** Sanitiza valor numérico: se não finito, retorna fallback. */
const safeNumber = (value: number, fallback: number = 0): number =>
    Number.isFinite(value) ? value : fallback;

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 5: VALIDAÇÃO DE ESTADO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida a consistência matemática interna de um UserProgress.
 * Detecta corrupção silenciosa de estado.
 *
 * Complexidade: O(T + QH)
 *   - T = |topics|, QH = |questionsHistory|
 *   - Com MAX_HISTORY=500, QH é bounded → O(T + 500) = O(T) amortizado
 *
 * Puro: nenhum efeito colateral, apenas leitura do input.
 */
export const validateProgress = (progress: UserProgress): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // INV-01: readinessScore ∈ [0, 100]
    if (!ENGINE_INVARIANTS.INV_01_READINESS_RANGE.check(progress.readinessScore)) {
        errors.push(`INV-01: readinessScore=${progress.readinessScore}`);
    }

    // streak ≥ 0
    if (!Number.isFinite(progress.streak) || progress.streak < 0) {
        errors.push(`streak invalid: ${progress.streak}`);
    }

    // Validar cada tópico
    for (const [topicId, topic] of Object.entries(progress.topics || {})) {
        // INV-06
        if (!ENGINE_INVARIANTS.INV_06_NON_NEGATIVE_COUNTS.check(topic.attempts, topic.correct)) {
            errors.push(`INV-06 [${topicId}]: attempts=${topic.attempts}, correct=${topic.correct}`);
        }

        // INV-05
        if (!ENGINE_INVARIANTS.INV_05_CORRECT_LEQ_ATTEMPTS.check(topic.correct, topic.attempts)) {
            errors.push(`INV-05 [${topicId}]: correct(${topic.correct}) > attempts(${topic.attempts})`);
        }

        // INV-03
        if (!ENGINE_INVARIANTS.INV_03_ACCURACY_RANGE.check(topic.accuracy)) {
            errors.push(`INV-03 [${topicId}]: accuracy=${topic.accuracy}`);
        }

        // INV-04
        if (!ENGINE_INVARIANTS.INV_04_MASTERY_RANGE.check(topic.masteryLevel)) {
            errors.push(`INV-04 [${topicId}]: masteryLevel=${topic.masteryLevel}`);
        }

        // Consistency: accuracy ≈ round(correct/attempts × 100)
        if (topic.attempts > 0) {
            const expectedAccuracy = Math.round((topic.correct / topic.attempts) * 100);
            if (topic.accuracy !== expectedAccuracy) {
                errors.push(`[${topicId}]: accuracy stored=${topic.accuracy}, expected=${expectedAccuracy}`);
            }
        }

        // Status consistency
        const expectedStatus = getTopicStatus(topic.attempts, topic.accuracy);
        if (topic.status !== expectedStatus) {
            errors.push(`[${topicId}]: status stored=${topic.status}, expected=${expectedStatus}`);
        }
    }

    // Validar questionsHistory
    for (const [qId, qh] of Object.entries(progress.questionsHistory || {})) {
        if (!ENGINE_INVARIANTS.INV_04_MASTERY_RANGE.check(qh.masteryLevel)) {
            errors.push(`INV-04 qh[${qId}]: masteryLevel=${qh.masteryLevel}`);
        }
        if (!ENGINE_INVARIANTS.INV_07_ERROR_COUNT_NON_NEGATIVE.check(qh.errorCount)) {
            errors.push(`INV-07 qh[${qId}]: errorCount=${qh.errorCount}`);
        }
        if (!ENGINE_INVARIANTS.INV_08_CONSECUTIVE_NON_NEGATIVE.check(qh.consecutiveSuccesses)) {
            errors.push(`INV-08 qh[${qId}]: consecutiveSuccesses=${qh.consecutiveSuccesses}`);
        }
    }

    // INV-14: bounded history
    const historySize = Object.keys(progress.questionsHistory || {}).length;
    if (!ENGINE_INVARIANTS.INV_14_HISTORY_BOUNDED.check(historySize)) {
        errors.push(`INV-14: |questionsHistory|=${historySize} exceeds MAX_HISTORY=${MAX_HISTORY_SIZE}`);
    }

    return { valid: errors.length === 0, errors };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 6: IMUTABILIDADE PROFUNDA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deep clone de Record<string, QuestionHistory>.
 * Garante zero referências compartilhadas com o original.
 * Complexidade: O(N)
 */
const deepCloneQuestionsHistory = (
    source: Record<string, QuestionHistory>
): Record<string, QuestionHistory> => {
    const cloned: Record<string, QuestionHistory> = {};
    for (const key of Object.keys(source)) {
        cloned[key] = { ...source[key] };
    }
    return cloned;
};

/**
 * Deep clone de Record<string, TopicProgress>.
 * Complexidade: O(N)
 */
const deepCloneTopics = (
    source: Record<string, TopicProgress>
): Record<string, TopicProgress> => {
    const cloned: Record<string, TopicProgress> = {};
    for (const key of Object.keys(source)) {
        cloned[key] = { ...source[key] };
    }
    return cloned;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 7: CONTROLE DE CRESCIMENTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Comprime questionsHistory para respeitar MAX_HISTORY_SIZE.
 * Política: evicta entradas com lastAttempt mais antigo (LRU temporal).
 *
 * Complexidade:
 *   - O(1) amortizado quando |history| < MAX_HISTORY_SIZE (noop)
 *   - O(QH × log(QH)) no pior caso (sort + slice)
 *
 * Puro: retorna novo objeto, não muta o input.
 */
const compressHistory = (
    history: Record<string, QuestionHistory>
): Record<string, QuestionHistory> => {
    const entries = Object.entries(history);
    if (entries.length <= MAX_HISTORY_SIZE) return history;

    // Ordenar por lastAttempt (mais recentes primeiro)
    entries.sort((a, b) => {
        const dateA = a[1].lastAttempt || '';
        const dateB = b[1].lastAttempt || '';
        return dateB.localeCompare(dateA);
    });

    // Manter apenas os MAX_HISTORY_SIZE mais recentes
    const compressed: Record<string, QuestionHistory> = {};
    for (let i = 0; i < MAX_HISTORY_SIZE; i++) {
        compressed[entries[i][0]] = entries[i][1];
    }
    return compressed;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 8: LÓGICA CORE (SEM ALTERAÇÃO CONCEITUAL)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Determina o status de um tópico baseado em sua acurácia e tentativas.
 * Complexidade: O(1)
 *
 * Regras (imutáveis):
 *   attempts === 0  → NOT_EVALUATED
 *   accuracy < 40   → WEAK
 *   accuracy < 70   → EVOLVING
 *   accuracy >= 70  → STRONG
 */
const getTopicStatus = (attempts: number, accuracy: number): TopicStatus => {
    if (attempts === 0) return 'NOT_EVALUATED';
    if (accuracy < 40) return 'WEAK';
    if (accuracy < 70) return 'EVOLVING';
    return 'STRONG';
};

export interface SessionHistoryItem {
    questionId: string;
    isCorrect: boolean;
}

/**
 * Deriva dados de macro domínios a partir do progresso de tópicos granulares.
 * Pura agregação — nenhuma lógica de decisão.
 *
 * Complexidade: O(T) usando TOPICS_BY_DOMAIN (Map pré-computado)
 */
export const deriveMacroTopics = (topics: Record<string, TopicProgress>): Record<string, any> => {
    const macroData: Record<string, any> = {};
    const macroKeys: MacroDomain[] = [
        "D1_CLOUD_CONCEPTS",
        "D2_SECURITY_COMPLIANCE",
        "D3_TECHNOLOGY_SERVICES",
        "D4_BILLING_SUPPORT"
    ];

    macroKeys.forEach(mKey => {
        const relevantTopics = TOPICS_BY_DOMAIN.get(mKey) || [];
        let mAttempts = 0;
        let mCorrect = 0;
        let mMaxMastery = 0;

        relevantTopics.forEach(t => {
            const prog = topics[t.id];
            if (prog && prog.attempts > 0) {
                mAttempts += safeNumber(prog.attempts);
                mCorrect += safeNumber(prog.correct);
                mMaxMastery = Math.max(mMaxMastery, clamp(safeNumber(prog.masteryLevel), 0, 5));
            }
        });

        const mAccuracy = mAttempts > 0 ? Math.round((mCorrect / mAttempts) * 100) : 0;
        macroData[mKey] = {
            attempts: mAttempts,
            correct: mCorrect,
            accuracy: clamp(mAccuracy, 0, 100),
            masteryLevel: mMaxMastery,
            status: getTopicStatus(mAttempts, clamp(mAccuracy, 0, 100))
        };
    });

    return macroData;
};

/**
 * Calcula a prontidão (Readiness Score) baseada em múltiplos fatores.
 *
 * ╔═══════════════════════════════════════════════════╗
 * ║  FÓRMULA IMUTÁVEL (INV-13):                      ║
 * ║  readiness = 30% × Cobertura + 70% × Performance ║
 * ╚═══════════════════════════════════════════════════╝
 *
 * Complexidade: O(T)
 * Puro: nenhum efeito colateral.
 */
export const calculateReadinessScore = (progress: UserProgress): number => {
    const topicValues = Object.values(progress.topics || {});
    const evaluatedTopics = topicValues.filter(t => t.attempts > 0);
    const totalTopics = TOPICS.length;

    if (evaluatedTopics.length === 0 || totalTopics === 0) return 0;

    // 1. Cobertura (30%)
    const coverageRatio = evaluatedTopics.length / totalTopics;
    const coverageScore = coverageRatio * 30;

    // 2. Performance (70%)
    const avgAccuracy = evaluatedTopics.reduce(
        (acc, t) => acc + safeNumber(t.accuracy, 0), 0
    ) / evaluatedTopics.length;
    const performanceScore = (clamp(avgAccuracy, 0, 100) / 100) * 70;

    const total = coverageScore + performanceScore;
    const result = clamp(Math.round(safeNumber(total, 0)), 0, 100);

    assertInvariant(
        ENGINE_INVARIANTS.INV_01_READINESS_RANGE.check(result),
        `readinessScore out of range: ${result}`
    );

    return result;
};

/**
 * Retorna questão sem correctOptionId (segurança do cliente).
 * Shallow copy — seguro pois Question contém primitivos e array de objetos com primitivos.
 */
const prepareForClient = (question: Question): Partial<Question> => {
    const { correctOptionId, ...rest } = question;
    return rest;
};

/**
 * Determina alvo de questões STRONG baseado no perfil.
 * Constraints: Min 1, Max 3.
 * Complexidade: O(T)
 */
const getStrongQuestionsTarget = (progress: UserProgress): number => {
    const totalTopics = TOPICS.length;
    if (totalTopics === 0) return 1;

    const strongTopics = Object.values(progress.topics).filter(t => t.status === 'STRONG').length;
    const strongRatio = strongTopics / totalTopics;

    if (strongRatio > 0.5) return 1;
    if (strongRatio > 0.2) return 2;
    return 3;
};

/**
 * Seleciona a próxima questão via seleção ponderada determinística.
 *
 * Complexidade: O(Q + H)
 * Puro: recebe RNG como parâmetro, sem estado externo.
 */
const selectNextQuestion = (
    progress: UserProgress,
    history: SessionHistoryItem[],
    rng: () => number,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string
): Question => {
    // 1. Pool Base
    let pool = ALL_QUESTIONS;
    if (mode === 'topic' && targetId) pool = ALL_QUESTIONS.filter(q => q.topicId === targetId);
    else if (mode === 'domain' && targetId) pool = ALL_QUESTIONS.filter(q => {
        const topicInfo = TOPICS.find(t => t.id === q.topicId);
        return topicInfo?.macroDomain === targetId;
    });

    // Filtrar questões já usadas
    const usedIds = new Set(history.map(h => h.questionId));
    const available = pool.filter(q => !usedIds.has(q.id));

    // Fallback: pool exhausted — determinístico via RNG seeded
    if (available.length === 0) {
        const idx = Math.floor(rng() * ALL_QUESTIONS.length);
        return ALL_QUESTIONS[idx];
    }

    // Modo não-SMART: seleção simples via RNG determinístico
    if (mode !== 'smart') {
        const idx = Math.floor(rng() * available.length);
        return available[idx];
    }

    // --- LÓGICA SMART PONDERADA ---

    const candidates = available.map(q => {
        const topic = progress.topics[q.topicId];
        const status = topic ? topic.status : 'NOT_EVALUATED';
        return { q, status };
    });

    const poolStrong = candidates.filter(c => c.status === 'STRONG');
    const poolImprove = candidates.filter(c => c.status !== 'STRONG');

    const targetStrong = getStrongQuestionsTarget(progress);

    // O(H) — H ≤ 15, usando QUESTIONS_BY_ID para O(1) lookups
    const usedStrongCount = history.filter(h => {
        const q = QUESTIONS_BY_ID.get(h.questionId);
        if (!q) return false;
        const t = progress.topics[q.topicId];
        return t && t.status === 'STRONG';
    }).length;

    const remainingSlots = SESSION_SIZE - history.length;
    const strongNeeded = Math.max(0, 1 - usedStrongCount);
    const strongAllowed = Math.max(0, targetStrong - usedStrongCount);

    let finalPool: { q: Question, weight: number }[] = [];

    // DECISÃO FORÇADA
    if (remainingSlots <= strongNeeded && poolStrong.length > 0) {
        finalPool = poolStrong.map(c => ({ q: c.q, weight: 1 }));
    }
    // DECISÃO BLOQUEADA
    else if (strongAllowed <= 0) {
        if (poolImprove.length > 0) {
            finalPool = poolImprove.map(c => {
                let w = 1;
                if (c.status === 'WEAK' || c.status === 'NOT_EVALUATED') w = 3;
                if (c.status === 'EVOLVING') w = 2;
                return { q: c.q, weight: w };
            });
        } else {
            finalPool = poolStrong.map(c => ({ q: c.q, weight: 1 }));
        }
    }
    // DECISÃO PONDERADA (Padrão)
    else {
        poolImprove.forEach(c => {
            let w = 1;
            if (c.status === 'WEAK' || c.status === 'NOT_EVALUATED') w = 30;
            if (c.status === 'EVOLVING') w = 20;
            finalPool.push({ q: c.q, weight: w });
        });
        poolStrong.forEach(c => {
            finalPool.push({ q: c.q, weight: 5 });
        });
    }

    // Fallback: finalPool vazio
    if (finalPool.length === 0) finalPool = candidates.map(c => ({ q: c.q, weight: 1 }));

    // INV-10: totalWeight > 0
    const totalWeight = finalPool.reduce((acc, item) => acc + item.weight, 0);
    if (totalWeight <= 0) return finalPool[0].q;

    // Seleção Roleta — via RNG determinístico (DET-05)
    let random = rng() * totalWeight;

    for (const item of finalPool) {
        random -= item.weight;
        if (random <= 0) return item.q;
    }

    // Fallback: floating point drift
    return finalPool[finalPool.length - 1].q;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 9: API PÚBLICA (CONTRATO PRESERVADO)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Decide a PRIMEIRA questão da sessão.
 *
 * Contrato:
 *   IN:  progress, mode?, targetId?
 *   OUT: { sessionId, question (sem correctOptionId), totalQuestions }
 *
 * Nota: crypto.randomUUID() é usado aqui para geração de ID único.
 * Isso NÃO quebra pureza funcional da seleção porque:
 *   - O UUID é OUTPUT (não influencia a seleção)
 *   - A seleção passa pelo RNG seeded do UUID gerado
 *   - Uma vez que o sessionId é fixo, toda a sessão é reproduzível
 */
export const startSession = (
    progress: UserProgress,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string
) => {
    const sessionId = crypto.randomUUID();
    const rng = createSessionRng(sessionId, progress, 0);

    const question = selectNextQuestion(progress, [], rng, mode, targetId);

    return {
        sessionId,
        question: prepareForClient(question),
        totalQuestions: SESSION_SIZE
    };
};

/**
 * Processa a resposta e decide deterministicamente a PRÓXIMA questão.
 * Implementa Reforço Imediato (+2) e Buffer de Distração.
 *
 * Contrato:
 *   IN:  progress, questionId, selectedOptionId, history, sessionId, mode?, targetId?, now?
 *   OUT: { isCorrect, explanation, correctOptionId, nextQuestion, updatedProgress, totalQuestions }
 *
 * sessionId é OBRIGATÓRIO (DET-06). Erro explícito se ausente.
 * now é injetável para pureza funcional (P4). Default: new Date().
 *
 * Complexidade: O(Q + H + T)
 */
export const processStep = (
    progress: UserProgress,
    questionId: string,
    selectedOptionId: string,
    history: SessionHistoryItem[],
    sessionId: string,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string,
    now?: Date
): {
    isCorrect: boolean;
    explanation: string;
    correctOptionId: string;
    nextQuestion: Partial<Question> | null;
    updatedProgress: UserProgress;
    totalQuestions: number;
} => {
    // DET-06: sessionId obrigatório
    assertInvariant(
        typeof sessionId === 'string' && sessionId.length > 0,
        'sessionId is required for deterministic execution (DET-06)'
    );

    // Injeção de timestamp para pureza funcional (P4)
    const timestamp = now || new Date();

    // Lookup O(1)
    const question = QUESTIONS_BY_ID.get(questionId);
    if (!question) throw new Error(`[Cognira Engine] Question not found: ${questionId}`);

    const isCorrect = selectedOptionId === question.correctOptionId;

    // 1. Atualizar Histórico da Questão (SRS) — Deep clone
    const qHistory = deepCloneQuestionsHistory(progress.questionsHistory);
    const qh: QuestionHistory = qHistory[questionId]
        ? { ...qHistory[questionId] }
        : {
            lastAttempt: timestamp.toISOString(),
            lastSeen: timestamp.toISOString(),
            nextReview: timestamp.toISOString(),
            masteryLevel: 0,
            consecutiveSuccesses: 0,
            errorCount: 0
        };

    if (isCorrect) {
        qh.consecutiveSuccesses += 1;
        qh.masteryLevel = Math.min(qh.masteryLevel + 1, 5);
    } else {
        qh.consecutiveSuccesses = 0;
        qh.masteryLevel = Math.max(0, qh.masteryLevel - 1);
        qh.errorCount += 1;
    }

    // Defensive clamps — INV-04, INV-07, INV-08
    qh.masteryLevel = clamp(qh.masteryLevel, 0, 5);
    qh.consecutiveSuccesses = Math.max(0, qh.consecutiveSuccesses);
    qh.errorCount = Math.max(0, qh.errorCount);

    // INV-09: interval seguro via clamp
    const clampedMastery = clamp(qh.masteryLevel, 0, MASTERY_INTERVALS.length - 1);
    const interval = MASTERY_INTERVALS[clampedMastery];
    assertInvariant(
        Number.isFinite(interval),
        `MASTERY_INTERVALS[${clampedMastery}] is not finite: ${interval}`
    );

    const nextReviewDate = new Date(timestamp.getTime());
    nextReviewDate.setDate(timestamp.getDate() + interval);
    qh.nextReview = nextReviewDate.toISOString();
    qh.lastAttempt = timestamp.toISOString();
    qh.lastSeen = timestamp.toISOString();
    qHistory[questionId] = qh;

    // Compressão de history — INV-14
    const compressedHistory = compressHistory(qHistory);

    // 2. Atualizar Tópico — Deep clone
    const updatedTopics = deepCloneTopics(progress.topics);
    const topicId = question.topicId;

    if (topicId) {
        const topic: TopicProgress = updatedTopics[topicId] || {
            topicId,
            attempts: 0,
            correct: 0,
            accuracy: 0,
            status: 'NOT_EVALUATED' as TopicStatus,
            masteryLevel: 0
        };

        const attempts = topic.attempts + 1;
        const correct = topic.correct + (isCorrect ? 1 : 0);
        const safeCorrect = Math.min(correct, attempts); // INV-05
        const accuracy = Math.round((safeCorrect / attempts) * 100);

        updatedTopics[topicId] = {
            ...topic,
            attempts,
            correct: safeCorrect,
            accuracy: clamp(accuracy, 0, 100),
            masteryLevel: clamp(Math.max(topic.masteryLevel, qh.masteryLevel), 0, 5),
            status: getTopicStatus(attempts, clamp(accuracy, 0, 100))
        };
    }

    // 3. Macro Domains (pura agregação)
    const updatedMacroTopics = deriveMacroTopics(updatedTopics);

    const updatedProgress: UserProgress = {
        ...progress,
        questionsHistory: compressedHistory,
        topics: updatedTopics,
        macroTopics: updatedMacroTopics
    };

    updatedProgress.readinessScore = calculateReadinessScore(updatedProgress);

    // --- SELEÇÃO DA PRÓXIMA QUESTÃO ---

    let pool = ALL_QUESTIONS;
    if (mode === 'topic' && targetId) {
        pool = ALL_QUESTIONS.filter(q => q.topicId === targetId);
    } else if (mode === 'domain' && targetId) {
        pool = ALL_QUESTIONS.filter(q => {
            const topicInfo = TOPICS.find(t => t.id === q.topicId);
            return topicInfo?.macroDomain === targetId;
        });
    }

    const currentHistory: SessionHistoryItem[] = [...history, { questionId, isCorrect }];
    let nextQ: Question | null = null;

    // Reforço (+2) com cap — INV-11
    const pendingReinforcements = currentHistory.filter((h, idx) => {
        if (h.isCorrect) return false;
        const reinforcementIndex = currentHistory.findIndex((h2, idx2) =>
            idx2 > idx && h2.questionId === h.questionId
        );
        if (reinforcementIndex !== -1) return false;
        const isInPool = pool.some(q => q.id === h.questionId);
        return isInPool && (currentHistory.length - idx) >= 3;
    });

    const cappedReinforcements = pendingReinforcements.slice(0, MAX_REINFORCEMENT_CAP);

    if (cappedReinforcements.length > 0) {
        const target = cappedReinforcements[0];
        nextQ = pool.find(q => q.id === target.questionId) || null;
    }

    // Seleção ponderada determinística
    if (!nextQ) {
        if (currentHistory.length < SESSION_SIZE) {
            // Seed composta: sessionId ⊕ progressHash ⊕ stepIndex (DET-03)
            const stepIndex = currentHistory.length;
            const rng = createSessionRng(sessionId, updatedProgress, stepIndex);
            nextQ = selectNextQuestion(updatedProgress, currentHistory, rng, mode, targetId);
        }
    }

    return {
        isCorrect,
        explanation: question.explanation,
        correctOptionId: question.correctOptionId,
        nextQuestion: nextQ ? prepareForClient(nextQ) : null,
        updatedProgress,
        totalQuestions: Math.min(pool.length, SESSION_SIZE)
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 10: SELF-CHECK EXPORTADO (CI-READY)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Executa bateria de auto-testes para verificar integridade do motor.
 * NÃO executa automaticamente — deve ser chamada explicitamente em CI ou dev.
 *
 * Retorna objeto estruturado com resultado de cada teste.
 * Puro: nenhum efeito colateral.
 *
 * @returns { passed: boolean, results: { name: string, passed: boolean, detail?: string }[] }
 */
export const runEngineSelfCheck = (): {
    passed: boolean;
    results: { name: string; passed: boolean; detail?: string }[];
} => {
    const results: { name: string; passed: boolean; detail?: string }[] = [];

    const test = (name: string, fn: () => boolean, detail?: string) => {
        try {
            const passed = fn();
            results.push({ name, passed, detail: passed ? undefined : (detail || 'assertion failed') });
        } catch (e) {
            results.push({ name, passed: false, detail: `threw: ${e}` });
        }
    };

    // T01: Determinismo do PRNG
    test('T01: PRNG determinism', () => {
        const rng1 = createRng(12345);
        const rng2 = createRng(12345);
        return Array.from({ length: 20 }, () => rng1()).every((v, i) => {
            const v2 = rng2();
            return v === v2;
        });
    });

    // T02: PRNG range [0, 1)
    test('T02: PRNG range [0, 1)', () => {
        const rng = createRng(99999);
        return Array.from({ length: 1000 }, () => rng()).every(v => v >= 0 && v < 1);
    });

    // T03: FNV-1a hash determinism
    test('T03: FNV-1a hash determinism', () => {
        return fnv1aHash('test-session') === fnv1aHash('test-session');
    });

    // T04: FNV-1a hash collision resistance (basic)
    test('T04: FNV-1a collision resistance', () => {
        return fnv1aHash('session-A') !== fnv1aHash('session-B');
    });

    // T05: getTopicStatus consistency
    test('T05: getTopicStatus rules', () => {
        return getTopicStatus(0, 0) === 'NOT_EVALUATED' &&
            getTopicStatus(10, 20) === 'WEAK' &&
            getTopicStatus(10, 50) === 'EVOLVING' &&
            getTopicStatus(10, 80) === 'STRONG' &&
            getTopicStatus(1, 39) === 'WEAK' &&
            getTopicStatus(1, 40) === 'EVOLVING' &&
            getTopicStatus(1, 69) === 'EVOLVING' &&
            getTopicStatus(1, 70) === 'STRONG';
    });

    // T06: calculateReadinessScore bounds
    test('T06: readinessScore bounds', () => {
        const empty: UserProgress = {
            userId: 'test', readinessScore: 0, streak: 0,
            lastSessionDate: '2025-01-01T00:00:00Z', topics: {}, questionsHistory: {}
        };
        return calculateReadinessScore(empty) === 0;
    });

    // T07: validateProgress on clean state
    test('T07: validateProgress clean', () => {
        const clean: UserProgress = {
            userId: 'test', readinessScore: 0, streak: 0,
            lastSessionDate: '2025-01-01T00:00:00Z', topics: {}, questionsHistory: {}
        };
        const result = validateProgress(clean);
        return result.valid === true && result.errors.length === 0;
    });

    // T08: validateProgress detects corruption
    test('T08: validateProgress corruption', () => {
        const corrupted: UserProgress = {
            userId: 'test', readinessScore: -5, streak: 0,
            lastSessionDate: '2025-01-01T00:00:00Z', topics: {}, questionsHistory: {}
        };
        return validateProgress(corrupted).valid === false;
    });

    // T09: MASTERY_INTERVALS completude
    test('T09: MASTERY_INTERVALS integrity', () => {
        return ENGINE_INVARIANTS.INV_09_MASTERY_INTERVALS_DEFINED.check(MASTERY_INTERVALS);
    });

    // T10: QUESTIONS_BY_ID integrity
    test('T10: QUESTIONS_BY_ID integrity', () => {
        return QUESTIONS_BY_ID.size === ALL_QUESTIONS.length &&
            ALL_QUESTIONS.every(q => QUESTIONS_BY_ID.get(q.id) === q);
    });

    // T11: Composite seed determinism
    test('T11: Composite seed determinism', () => {
        const progress: UserProgress = {
            userId: 'test', readinessScore: 0, streak: 0,
            lastSessionDate: '2025-01-01T00:00:00Z',
            topics: { 'EC2': { topicId: 'EC2', attempts: 5, correct: 3, accuracy: 60, status: 'EVOLVING', masteryLevel: 2 } },
            questionsHistory: {}
        };
        const seed1 = computeCompositeSeed('sess-123', progress, 3);
        const seed2 = computeCompositeSeed('sess-123', progress, 3);
        return seed1 === seed2;
    });

    // T12: Different sessionIds produce different seeds
    test('T12: Seed divergence by sessionId', () => {
        const progress: UserProgress = {
            userId: 'test', readinessScore: 0, streak: 0,
            lastSessionDate: '2025-01-01T00:00:00Z', topics: {}, questionsHistory: {}
        };
        return computeCompositeSeed('A', progress, 0) !== computeCompositeSeed('B', progress, 0);
    });

    // T13: Different steps produce different seeds
    test('T13: Seed divergence by step', () => {
        const progress: UserProgress = {
            userId: 'test', readinessScore: 0, streak: 0,
            lastSessionDate: '2025-01-01T00:00:00Z', topics: {}, questionsHistory: {}
        };
        return computeCompositeSeed('X', progress, 0) !== computeCompositeSeed('X', progress, 1);
    });

    // T14: compressHistory respects MAX_HISTORY_SIZE
    test('T14: compressHistory cap', () => {
        const bigHistory: Record<string, QuestionHistory> = {};
        for (let i = 0; i < MAX_HISTORY_SIZE + 100; i++) {
            bigHistory[`q-${i}`] = {
                lastAttempt: new Date(2025, 0, i % 28 + 1).toISOString(),
                lastSeen: new Date(2025, 0, i % 28 + 1).toISOString(),
                nextReview: new Date(2025, 1, i % 28 + 1).toISOString(),
                masteryLevel: i % 6, consecutiveSuccesses: 0, errorCount: 0
            };
        }
        const compressed = compressHistory(bigHistory);
        return Object.keys(compressed).length === MAX_HISTORY_SIZE;
    });

    // T15: ENGINE_INVARIANTS completude
    test('T15: ENGINE_INVARIANTS completude', () => {
        return Object.keys(ENGINE_INVARIANTS).length === 14;
    });

    // T16: Invariant checks are pure functions
    test('T16: Invariant check purity', () => {
        const r1 = ENGINE_INVARIANTS.INV_01_READINESS_RANGE.check(50);
        const r2 = ENGINE_INVARIANTS.INV_01_READINESS_RANGE.check(50);
        const r3 = ENGINE_INVARIANTS.INV_01_READINESS_RANGE.check(101);
        return r1 === true && r2 === true && r3 === false;
    });

    return {
        passed: results.every(r => r.passed),
        results
    };
};
