import { Question, UserProgress, QuestionHistory, MacroDomain, TopicStatus, TopicProgress } from './types';
import questionsData from '@/data/questions.json';

import { TOPICS } from './topics';

const ALL_QUESTIONS = questionsData as Question[];
export const MASTERY_INTERVALS = [0, 1, 3, 7, 15, 30];

/**
 * Determina o status de um tópico baseado em sua acurácia e tentativas.
 */
const getTopicStatus = (attempts: number, accuracy: number): TopicStatus => {
    if (attempts === 0) return 'NOT_EVALUATED';
    if (accuracy < 40) return 'WEAK';
    if (accuracy < 70) return 'EVOLVING';
    return 'STRONG';
};

/**
 * Deriva dados de macro domínios a partir do progresso de tópicos granulares.
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
        const relevantTopics = TOPICS.filter(t => t.macroDomain === mKey);
        let mAttempts = 0;
        let mCorrect = 0;
        let mMaxMastery = 0;

        relevantTopics.forEach(t => {
            const prog = topics[t.id];
            if (prog && prog.attempts > 0) {
                mAttempts += prog.attempts;
                mCorrect += prog.correct;
                mMaxMastery = Math.max(mMaxMastery, prog.masteryLevel);
            }
        });

        const mAccuracy = mAttempts > 0 ? Math.round((mCorrect / mAttempts) * 100) : 0;
        macroData[mKey] = {
            attempts: mAttempts,
            correct: mCorrect,
            accuracy: mAccuracy,
            masteryLevel: mMaxMastery,
            status: getTopicStatus(mAttempts, mAccuracy)
        };
    });

    return macroData;
};

/**
 * Calcula a prontidão (Readiness Score) baseada em múltiplos fatores.
 * Fórmula: 30% Cobertura + 70% Performance
 */
export const calculateReadinessScore = (progress: UserProgress): number => {
    const topicValues = Object.values(progress.topics || {});
    const evaluatedTopics = topicValues.filter(t => t.attempts > 0);
    const totalTopics = TOPICS.length;

    if (evaluatedTopics.length === 0) return 0;

    // 1. Cobertura (30%) - % de tópicos oficiais avaliados
    const coverageScore = (evaluatedTopics.length / totalTopics) * 30;

    // 2. Performance (70%) - Acurácia média simples dos tópicos avaliados
    const avgAccuracy = evaluatedTopics.reduce((acc, t) => acc + t.accuracy, 0) / evaluatedTopics.length;
    const performanceScore = (avgAccuracy / 100) * 70;

    const total = coverageScore + performanceScore;
    return Math.min(Math.round(total), 100);
};

export interface SessionHistoryItem {
    questionId: string;
    isCorrect: boolean;
}

/**
 * Retorna uma questão válida para o cliente (sem correctOptionId)
 */
const prepareForClient = (question: Question): Partial<Question> => {
    const { correctOptionId, ...rest } = question;
    return rest;
};

/**
 * Determina o alvo de questões FORTES (Strong) baseado no perfil do usuário.
 * Constraints: Min 1, Max 3.
 * Advanced (Muitos tópicos fortes) -> Menos injeção (1).
 * Beginner (Poucos tópicos fortes) -> Mais injeção (3) para confiança.
 */
const getStrongQuestionsTarget = (progress: UserProgress): number => {
    const totalTopics = TOPICS.length;
    const strongTopics = Object.values(progress.topics).filter(t => t.status === 'STRONG').length;
    const strongRatio = strongTopics / totalTopics;

    // Advanced: > 50% Strong -> Target 1
    if (strongRatio > 0.5) return 1;
    // Intermediate: > 20% Strong -> Target 2
    if (strongRatio > 0.2) return 2;
    // Beginner: <= 20% Strong -> Target 3
    return 3;
};

/**
 * Seleciona a próxima questão baseada em pesos e restrições rígidas.
 */
const selectNextQuestion = (
    progress: UserProgress,
    history: SessionHistoryItem[],
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string
): Question => {
    // 1. Definir Pool Base
    let pool = ALL_QUESTIONS;
    if (mode === 'topic' && targetId) pool = ALL_QUESTIONS.filter(q => q.topicId === targetId);
    else if (mode === 'domain' && targetId) pool = ALL_QUESTIONS.filter(q => TOPICS.find(t => t.id === q.topicId)?.macroDomain === targetId);

    // Filtrar questões já usadas nesta sessão
    const usedIds = new Set(history.map(h => h.questionId));
    let available = pool.filter(q => !usedIds.has(q.id));

    // Fallback crítico
    if (available.length === 0) return ALL_QUESTIONS[Math.floor(Math.random() * ALL_QUESTIONS.length)];

    // Se NÃO for SMART, seleção aleatória simples
    if (mode !== 'smart') return available[Math.floor(Math.random() * available.length)];

    // --- LÓGICA SMART PONDERADA ---

    // 1. Identificar Status de cada questão candidata
    const candidates = available.map(q => {
        const topic = progress.topics[q.topicId];
        const status = topic ? topic.status : 'NOT_EVALUATED';
        return { q, status };
    });

    // 2. Separar Pools
    const poolStrong = candidates.filter(c => c.status === 'STRONG');
    const poolImprove = candidates.filter(c => c.status !== 'STRONG'); // Weak, Evolving, Not Evaluated

    // 3. Verificar Restrições de "Strong"
    const targetStrong = getStrongQuestionsTarget(progress);

    // Quantas Strong já foram usadas?
    // Precisamos olhar o histórico e ver o status ATUAL desses tópicos (aproximação aceitável)
    const usedStrongCount = history.filter(h => {
        const q = ALL_QUESTIONS.find(aq => aq.id === h.questionId);
        if (!q) return false;
        const t = progress.topics[q.topicId];
        return t && t.status === 'STRONG';
    }).length;

    const remainingSlots = 15 - history.length;
    const strongNeeded = Math.max(0, 1 - usedStrongCount); // Garantir Mínimo 1
    const strongAllowed = Math.max(0, targetStrong - usedStrongCount); // Respeitar Máximo (Target)

    let finalPool: { q: Question, weight: number }[] = [];

    // DECISÃO FORÇADA: Se faltam slots e ainda não atingimos o mínimo 1 STRONG
    if (remainingSlots <= strongNeeded && poolStrong.length > 0) {
        // FORÇAR STRONG
        finalPool = poolStrong.map(c => ({ q: c.q, weight: 1 }));
    }
    // DECISÃO BLOQUEADA: Se já atingimos o limite de STRONG
    else if (strongAllowed <= 0) {
        // BLOQUEAR STRONG (Usar apenas Improve)
        // Se Improve estiver vazio (caso raro de usuário 100% strong), liberamos Strong com peso baixo
        if (poolImprove.length > 0) {
            finalPool = poolImprove.map(c => {
                // Pesos Internos
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
        // Misturar Pools com Pesos Diferenciados
        poolImprove.forEach(c => {
            let w = 1;
            if (c.status === 'WEAK' || c.status === 'NOT_EVALUATED') w = 30; // 3x mais chance que base
            if (c.status === 'EVOLVING') w = 20; // 2x mais chance
            finalPool.push({ q: c.q, weight: w });
        });

        // Inserir Strong (Injeção Controlada)
        // Ajustamos o peso para que, em média, elas apareçam mas não dominem
        poolStrong.forEach(c => {
            finalPool.push({ q: c.q, weight: 5 }); // Peso baixo
        });
    }

    // Fallback de segurança se finalPool ficar vazio
    if (finalPool.length === 0) finalPool = candidates.map(c => ({ q: c.q, weight: 1 }));

    // Seleção Roleta (Weighted Random)
    const totalWeight = finalPool.reduce((acc, item) => acc + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of finalPool) {
        random -= item.weight;
        if (random <= 0) return item.q;
    }

    return finalPool[0].q;
};

/**
 * Decide a PRIMEIRA questão da sessão.
 */
export const startSession = (
    progress: UserProgress,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string
) => {
    const question = selectNextQuestion(progress, [], mode, targetId);

    return {
        sessionId: crypto.randomUUID(),
        question: prepareForClient(question),
        totalQuestions: 15
    };
};

/**
 * Processa a resposta e decide dinamicamente a PRÓXIMA questão.
 * Implementa Reforço Imediato (+2) e Buffer de Distração.
 */
export const processStep = (
    progress: UserProgress,
    questionId: string,
    selectedOptionId: string,
    history: SessionHistoryItem[],
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string
): {
    isCorrect: boolean;
    explanation: string;
    correctOptionId: string;
    nextQuestion: Partial<Question> | null;
    updatedProgress: UserProgress;
    totalQuestions: number;
} => {
    const question = ALL_QUESTIONS.find(q => q.id === questionId);
    if (!question) throw new Error('Question not found');

    const isCorrect = selectedOptionId === question.correctOptionId;

    // 1. Atualizar Histórico da Questão (SRS)
    const now = new Date();
    const qHistory = { ...progress.questionsHistory };
    const qh = qHistory[questionId] || {
        lastAttempt: now.toISOString(),
        lastSeen: now.toISOString(),
        nextReview: now.toISOString(),
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

    const interval = MASTERY_INTERVALS[qh.masteryLevel];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(now.getDate() + interval);
    qh.nextReview = nextReviewDate.toISOString();
    qh.lastAttempt = now.toISOString();
    qHistory[questionId] = qh;

    // 2. Atualizar Tópico Específico
    const updatedTopics = { ...progress.topics };
    const topicId = question.topicId;

    if (topicId && updatedTopics[topicId]) {
        const topic = updatedTopics[topicId];
        const attempts = topic.attempts + 1;
        const correct = topic.correct + (isCorrect ? 1 : 0);
        const accuracy = Math.round((correct / attempts) * 100);

        updatedTopics[topicId] = {
            ...topic,
            attempts,
            correct,
            accuracy,
            masteryLevel: Math.max(topic.masteryLevel, qh.masteryLevel),
            status: getTopicStatus(attempts, accuracy)
        };
    }

    // 3. Agregar para Macro Domains (Pura Agregação)
    const updatedMacroTopics = deriveMacroTopics(updatedTopics);

    let updatedProgress = {
        ...progress,
        questionsHistory: qHistory,
        topics: updatedTopics,
        macroTopics: updatedMacroTopics
    };

    // Recalcular Score de Prontidão Centralizado
    updatedProgress.readinessScore = calculateReadinessScore(updatedProgress);

    // --- SELEÇÃO DA PRÓXIMA QUESTÃO ---

    // Definir o Universo de Questões permitido para esta sessão
    let pool = ALL_QUESTIONS;
    if (mode === 'topic' && targetId) {
        pool = ALL_QUESTIONS.filter(q => q.topicId === targetId);
    } else if (mode === 'domain' && targetId) {
        pool = ALL_QUESTIONS.filter(q => {
            const topicInfo = TOPICS.find(t => t.id === q.topicId);
            return topicInfo?.macroDomain === targetId;
        });
    }

    const currentHistory = [...history, { questionId, isCorrect }];
    let nextQ: Question | null = null;

    // HEURÍSTICA DE REFORÇO (+2) - Somente se a questão estiver no POOL atual
    const pendingReinforcements = currentHistory.filter((h, idx) => {
        if (h.isCorrect) return false;
        // Já foi reforçada depois do erro?
        const reinforcementIndex = currentHistory.findIndex((h2, idx2) =>
            idx2 > idx && h2.questionId === h.questionId
        );
        if (reinforcementIndex !== -1) return false;

        // Verifica se a questão pertence ao pool filtrado
        const isInPool = pool.some(q => q.id === h.questionId);
        // BUFFER: passaram pelo menos 2 questões desde o erro?
        return isInPool && (currentHistory.length - idx) >= 3;
    });

    if (pendingReinforcements.length > 0) {
        const target = pendingReinforcements[0];
        nextQ = pool.find(q => q.id === target.questionId) || null;
    }

    // Se não há reforço pendente ou disponível, pegar uma nova baseada em Algoritmo Ponderado
    if (!nextQ) {
        if (currentHistory.length < 15) {
            nextQ = selectNextQuestion(updatedProgress, currentHistory, mode, targetId);
        }
    }

    return {
        isCorrect,
        explanation: question.explanation,
        correctOptionId: question.correctOptionId,
        nextQuestion: nextQ ? prepareForClient(nextQ) : null,
        updatedProgress,
        totalQuestions: Math.min(pool.length, 15)
    };
};
