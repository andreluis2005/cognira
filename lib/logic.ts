import { Question, UserProgress, Domain } from './types';

export const calculateReadiness = (progress: UserProgress): number => {
    const domainWeights = Object.values(progress.topics);
    if (domainWeights.length === 0) return 0;

    const totalMastery = domainWeights.reduce((acc, topic) => acc + topic.mastery, 0);
    const avgMastery = totalMastery / domainWeights.length;

    // Factor in streak and consistency (bonus of up to 10%)
    const streakBonus = Math.min(progress.streak * 0.5, 10);

    return Math.min(Math.round(avgMastery + streakBonus), 100);
};

export const generateSession = (
    allQuestions: Question[],
    progress: UserProgress
): Question[] => {
    const sessionSize = 10;
    const history = progress.questionsHistory;

    const reviewedIds = new Set(Object.keys(history));

    // 0. PRIORITY (Incorrect questions)
    const priorityPool = allQuestions.filter(q => history[q.id]?.lastResult === 'incorrect');

    // 1. REVIEW (40% - 4 questions)
    const reviewPool = allQuestions.filter(q => {
        const h = history[q.id];
        if (!h || h.lastResult !== 'correct') return false;
        const daysSinceLast = (Date.now() - new Date(h.lastAttempt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLast >= h.interval;
    });

    // 2. WEAK AREAS (30% - 3 questions)
    const weakPool = allQuestions.filter(q => {
        const topicMastery = progress.topics[q.domain]?.mastery || 0;
        return topicMastery < 70;
    });

    // 3. NEW CONTENT (20% - 2 questions)
    const newPool = allQuestions.filter(q => !reviewedIds.has(q.id));

    // 4. RANDOM (10% - 1 question)
    const randomPool = allQuestions;

    const session: Question[] = [];

    const pick = (pool: Question[], count: number) => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && shuffled.length > 0; i++) {
            const q = shuffled.pop()!;
            if (!session.find(sq => sq.id === q.id)) {
                session.push(q);
            }
        }
    };

    // Pick priority first (no limit, up to sessionSize)
    pick(priorityPool, sessionSize);

    pick(reviewPool, 4);
    pick(weakPool, 3);
    pick(newPool, 2);
    pick(randomPool, 1);

    // Fill remaining slots
    while (session.length < sessionSize && allQuestions.length > session.length) {
        pick(allQuestions, 1);
    }

    return session.sort(() => Math.random() - 0.5);
};

export const updateProgressAfterQuestion = (
    progress: UserProgress,
    question: Question,
    isCorrect: boolean
): UserProgress => {
    const now = new Date().toISOString();
    const history = { ...progress.questionsHistory };
    const topics = { ...progress.topics };

    // Update Question History
    const qh = history[question.id] || {
        lastAttempt: now,
        interval: 1,
        lastResult: isCorrect ? 'correct' : 'incorrect',
        consecutiveSuccesses: 0
    };

    if (isCorrect) {
        qh.consecutiveSuccesses += 1;
        // Spacing logic: 1, 3, 7, 14, 30...
        qh.interval = qh.interval === 1 ? 3 : qh.interval === 3 ? 7 : qh.interval * 2;
        qh.lastResult = 'correct';
    } else {
        qh.consecutiveSuccesses = 0;
        qh.interval = 1; // Reset to daily
        qh.lastResult = 'incorrect';
    }
    qh.lastAttempt = now;
    history[question.id] = qh;

    // Update Topic Mastery
    const topic = topics[question.domain] || { mastery: 0, correctAnswers: 0, totalAttempts: 0 };
    topic.totalAttempts += 1;
    if (isCorrect) topic.correctAnswers += 1;

    // Mastery is a weighted average of success rate and consistency
    topic.mastery = Math.round((topic.correctAnswers / topic.totalAttempts) * 100);
    topics[question.domain] = topic;

    const newProgress = {
        ...progress,
        questionsHistory: history,
        topics,
    };

    newProgress.readinessScore = calculateReadiness(newProgress);
    return newProgress;
};
