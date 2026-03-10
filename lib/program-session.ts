import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { programTrails, programs, questionOptions, questions, topics } from '@/lib/db/schema';
import { Question, QuestionHistory, TopicProgress, TopicStatus, UserProgress } from '@/lib/types';

type ProgramQuestion = Question & {
    topicLabel: string;
    trailLabel?: string;
    programTitle: string;
};

type SessionHistoryItem = {
    questionId: string;
    isCorrect: boolean;
};

const SESSION_SIZE = 15;
const MAX_REINFORCEMENT_CAP = 3;

function hashString(value: string) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createRng(seed: number) {
    return function rng() {
        let t = seed += 0x6d2b79f5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function getTopicStatus(attempts: number, accuracy: number): TopicStatus {
    if (attempts === 0) return 'NOT_EVALUATED';
    if (accuracy < 40) return 'WEAK';
    if (accuracy < 70) return 'EVOLVING';
    return 'STRONG';
}

function deepCloneProgress(progress: UserProgress): UserProgress {
    return {
        ...progress,
        topics: Object.fromEntries(
            Object.entries(progress.topics || {}).map(([key, value]) => [key, { ...value }]),
        ),
        questionsHistory: Object.fromEntries(
            Object.entries(progress.questionsHistory || {}).map(([key, value]) => [key, { ...value }]),
        ),
        macroTopics: progress.macroTopics ? { ...progress.macroTopics } : undefined,
    };
}

async function getProgramDataset(programId: string) {
    const programRows = await db
        .select({
            id: programs.id,
            title: programs.title,
            status: programs.status,
        })
        .from(programs)
        .where(and(eq(programs.id, programId), eq(programs.status, 'published')))
        .limit(1);

    const program = programRows[0];
    if (!program) {
        throw new Error('Program not found or not published');
    }

    const topicRows = await db
        .select({
            id: topics.id,
            title: topics.title,
            trailId: topics.trailId,
        })
        .from(topics)
        .where(eq(topics.programId, programId))
        .orderBy(asc(topics.position), asc(topics.createdAt));

    const trailRows = await db
        .select({
            id: programTrails.id,
            title: programTrails.title,
        })
        .from(programTrails)
        .where(eq(programTrails.programId, programId));

    const questionRows = await db
        .select({
            id: questions.id,
            topicId: questions.topicId,
            stem: questions.stem,
            explanation: questions.explanation,
            optionId: questionOptions.id,
            optionLabel: questionOptions.label,
            optionBody: questionOptions.body,
            optionIsCorrect: questionOptions.isCorrect,
        })
        .from(questions)
        .innerJoin(questionOptions, eq(questionOptions.questionId, questions.id))
        .where(and(eq(questions.programId, programId), eq(questions.isActive, true)))
        .orderBy(asc(questions.createdAt), asc(questionOptions.position));

    const topicMap = new Map(topicRows.map((topic) => [topic.id, topic]));
    const trailMap = new Map(trailRows.map((trail) => [trail.id, trail.title]));

    const grouped = new Map<string, ProgramQuestion>();

    for (const row of questionRows) {
        const topic = topicMap.get(row.topicId);
        if (!topic) continue;

        const existing = grouped.get(row.id);
        if (existing) {
            existing.options.push({
                id: row.optionId,
                text: row.optionBody,
            });
            if (row.optionIsCorrect) {
                existing.correctOptionId = row.optionId;
            }
            continue;
        }

        grouped.set(row.id, {
            id: row.id,
            certification: program.title,
            topicId: row.topicId,
            text: row.stem,
            options: [{
                id: row.optionId,
                text: row.optionBody,
            }],
            correctOptionId: row.optionIsCorrect ? row.optionId : '',
            explanation: row.explanation,
            topicLabel: topic.title,
            trailLabel: topic.trailId ? trailMap.get(topic.trailId) : undefined,
            programTitle: program.title,
        });
    }

    return {
        program,
        topics: topicRows,
        questions: Array.from(grouped.values()),
    };
}

export async function getProgramQuestionMap(programId: string) {
    const dataset = await getProgramDataset(programId);
    return dataset.questions.map((question) => ({
        id: question.id,
        topicId: question.topicId,
    }));
}

function calculateReadiness(
    progress: UserProgress,
    topicTotals: Map<string, number>,
    datasetQuestions: ProgramQuestion[],
) {
    const topicIds = Array.from(topicTotals.keys());
    if (topicIds.length === 0) return 0;

    const topicScores = topicIds.map((topicId) => {
        const topicProgress = progress.topics[topicId];
        if (!topicProgress) return 0;

        const seenQuestions = datasetQuestions.filter((question) =>
            question.topicId === topicId && Boolean(progress.questionsHistory[question.id]),
        ).length;

        const totalQuestions = topicTotals.get(topicId) || 1;
        const coverage = Math.min(100, Math.round((seenQuestions / totalQuestions) * 100));
        return Math.round((coverage * 0.3) + (topicProgress.accuracy * 0.7));
    });

    return Math.round(topicScores.reduce((sum, value) => sum + value, 0) / topicScores.length);
}

function prepareQuestion(question: ProgramQuestion, reinforcement = false) {
    return {
        ...question,
        isReinforcement: reinforcement || undefined,
    };
}

function selectNextQuestion(
    allQuestions: ProgramQuestion[],
    progress: UserProgress,
    history: SessionHistoryItem[],
    sessionId: string,
    targetId?: string,
) {
    const pool = targetId ? allQuestions.filter((question) => question.topicId === targetId) : allQuestions;
    const answeredIds = new Set(history.map((item) => item.questionId));
    const available = pool.filter((question) => !answeredIds.has(question.id));

    if (available.length === 0) {
        return null;
    }

    const seed = hashString(`${sessionId}:${history.length}:${progress.readinessScore}:${pool.length}`);
    const rng = createRng(seed);

    const weightedPool = available.map((question) => {
        const topicProgress = progress.topics[question.topicId];
        const questionProgress = progress.questionsHistory[question.id];

        let weight = 10;
        if (!topicProgress || topicProgress.status === 'NOT_EVALUATED') weight += 20;
        else if (topicProgress.status === 'WEAK') weight += 15;
        else if (topicProgress.status === 'EVOLVING') weight += 8;

        if (questionProgress?.errorCount) weight += questionProgress.errorCount * 6;
        if (!questionProgress) weight += 12;

        return { question, weight };
    });

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let random = rng() * totalWeight;

    for (const item of weightedPool) {
        random -= item.weight;
        if (random <= 0) {
            return item.question;
        }
    }

    return weightedPool[weightedPool.length - 1]?.question || null;
}

export async function startProgramSession(
    progress: UserProgress,
    programId: string,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string,
) {
    const dataset = await getProgramDataset(programId);
    const sessionId = crypto.randomUUID();
    const firstQuestion = selectNextQuestion(dataset.questions, progress, [], sessionId, mode === 'topic' ? targetId : undefined);

    return {
        sessionId,
        question: firstQuestion ? prepareQuestion(firstQuestion) : null,
        totalQuestions: Math.min(dataset.questions.length, SESSION_SIZE),
        programTitle: dataset.program.title,
    };
}

export async function processProgramStep(
    progress: UserProgress,
    programId: string,
    questionId: string,
    selectedOptionId: string,
    history: SessionHistoryItem[],
    sessionId: string,
    mode: 'smart' | 'topic' | 'domain' = 'smart',
    targetId?: string,
) {
    const dataset = await getProgramDataset(programId);
    const question = dataset.questions.find((item) => item.id === questionId);

    if (!question) {
        throw new Error('Question not found in program');
    }

    const updatedProgress = deepCloneProgress(progress);
    const isCorrect = question.correctOptionId === selectedOptionId;
    const now = new Date().toISOString();

    const questionHistory: QuestionHistory = updatedProgress.questionsHistory[questionId]
        ? { ...updatedProgress.questionsHistory[questionId] }
        : {
            lastAttempt: now,
            lastSeen: now,
            nextReview: now,
            masteryLevel: 0,
            consecutiveSuccesses: 0,
            errorCount: 0,
        };

    questionHistory.lastAttempt = now;
    questionHistory.lastSeen = now;
    questionHistory.consecutiveSuccesses = isCorrect ? questionHistory.consecutiveSuccesses + 1 : 0;
    questionHistory.errorCount = isCorrect ? questionHistory.errorCount : questionHistory.errorCount + 1;
    questionHistory.masteryLevel = isCorrect
        ? Math.min(questionHistory.masteryLevel + 1, 5)
        : Math.max(questionHistory.masteryLevel - 1, 0);

    updatedProgress.questionsHistory[questionId] = questionHistory;

    const topicProgress: TopicProgress = updatedProgress.topics[question.topicId]
        ? { ...updatedProgress.topics[question.topicId] }
        : {
            topicId: question.topicId,
            attempts: 0,
            correct: 0,
            accuracy: 0,
            status: 'NOT_EVALUATED',
            masteryLevel: 0,
        };

    topicProgress.attempts += 1;
    topicProgress.correct += isCorrect ? 1 : 0;
    topicProgress.accuracy = Math.round((topicProgress.correct / topicProgress.attempts) * 100);
    topicProgress.masteryLevel = Math.max(topicProgress.masteryLevel, questionHistory.masteryLevel);
    topicProgress.status = getTopicStatus(topicProgress.attempts, topicProgress.accuracy);

    updatedProgress.topics[question.topicId] = topicProgress;

    const topicTotals = new Map<string, number>();
    dataset.questions.forEach((item) => {
        topicTotals.set(item.topicId, (topicTotals.get(item.topicId) || 0) + 1);
    });
    updatedProgress.readinessScore = calculateReadiness(updatedProgress, topicTotals, dataset.questions);

    const currentHistory = [...history, { questionId, isCorrect }];
    const pool = mode === 'topic' && targetId
        ? dataset.questions.filter((item) => item.topicId === targetId)
        : dataset.questions;

    const pendingReinforcements = currentHistory.filter((item, index) => {
        if (item.isCorrect) return false;
        const repeated = currentHistory.findIndex((candidate, candidateIndex) =>
            candidateIndex > index && candidate.questionId === item.questionId,
        );
        if (repeated !== -1) return false;
        return (currentHistory.length - index) >= 3 && pool.some((questionItem) => questionItem.id === item.questionId);
    }).slice(0, MAX_REINFORCEMENT_CAP);

    let nextQuestion: ProgramQuestion | null = null;
    let reinforcement = false;

    if (pendingReinforcements.length > 0) {
        nextQuestion = pool.find((item) => item.id === pendingReinforcements[0].questionId) || null;
        reinforcement = true;
    }

    if (!nextQuestion && currentHistory.length < Math.min(pool.length, SESSION_SIZE)) {
        nextQuestion = selectNextQuestion(pool, updatedProgress, currentHistory, sessionId, mode === 'topic' ? targetId : undefined);
    }

    return {
        isCorrect,
        explanation: question.explanation,
        correctOptionId: question.correctOptionId,
        nextQuestion: nextQuestion ? prepareQuestion(nextQuestion, reinforcement) : null,
        updatedProgress,
        totalQuestions: Math.min(pool.length, SESSION_SIZE),
        programTitle: dataset.program.title,
    };
}
