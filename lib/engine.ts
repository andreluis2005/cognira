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
 * Decide a PRIMEIRA questão da sessão.
 * Suporta filtragem por Modo: smart (adaptive), topic (focused), domain (focused macro).
 */
export const startSession = (
    progress: UserProgress,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string
) => {
    let pool = ALL_QUESTIONS;

    // 1. Aplicar Filtro Base (por Modo)
    if (mode === 'topic' && targetId) {
        pool = ALL_QUESTIONS.filter(q => q.topicId === targetId);
    } else if (mode === 'domain' && targetId) {
        pool = ALL_QUESTIONS.filter(q => {
            const topicInfo = TOPICS.find(t => t.id === q.topicId);
            return topicInfo?.macroDomain === targetId;
        });
    }

    // Fallback se o pool estiver vazio (ex: tópico sem questões ainda)
    if (pool.length === 0) pool = ALL_QUESTIONS;

    // 2. Lógica de Seleção (Priorizando revisão se for SMART)
    const now = new Date();
    let priorityPool = pool.filter(q => {
        const history = progress.questionsHistory[q.id];
        if (!history) return true;
        return new Date(history.nextReview) <= now;
    });

    // Se for modo SMART, podemos ser mais agressivos na priorização
    // Para modos focados, pegamos o que estiver disponível no pool filtrado
    const selectedPool = priorityPool.length > 0 ? priorityPool : pool;
    const firstQ = selectedPool[Math.floor(Math.random() * selectedPool.length)];

    return {
        sessionId: crypto.randomUUID(),
        question: prepareForClient(firstQ)
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

    // Se não há reforço pendente ou disponível, pegar uma nova baseada em SRS
    if (!nextQ) {
        // Filtra o que ainda não apareceu nesta sessão
        const sessionIds = new Set(currentHistory.map(h => h.questionId));
        const available = pool.filter(q => !sessionIds.has(q.id));

        if (available.length > 0 && currentHistory.length < 15) {
            if (mode === 'smart') {
                const now = new Date();
                const srsAvailable = available.filter(q => {
                    const h = updatedProgress.questionsHistory[q.id];
                    return !h || new Date(h.nextReview) <= now;
                });
                nextQ = srsAvailable.length > 0 ? srsAvailable[0] : available[0];
            } else {
                nextQ = available[Math.floor(Math.random() * available.length)];
            }
        }
    }

    return {
        isCorrect,
        explanation: question.explanation,
        correctOptionId: question.correctOptionId,
        nextQuestion: nextQ ? prepareForClient(nextQ) : null,
        updatedProgress
    };
};
