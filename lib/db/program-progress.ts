import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { enrollments, programs, questionProgress, studySessions, topicProgress } from '@/lib/db/schema';
import { TopicProgress, TopicStatus, UserProgress } from '@/lib/types';

type ProgramQuestionMapItem = {
    id: string;
    topicId: string;
};

function normalizeTopicStatus(value: string | null | undefined): TopicStatus {
    if (value === 'WEAK' || value === 'EVOLVING' || value === 'STRONG' || value === 'NOT_EVALUATED') {
        return value;
    }

    if (value === 'not_evaluated') return 'NOT_EVALUATED';
    if (value === 'weak') return 'WEAK';
    if (value === 'evolving') return 'EVOLVING';
    if (value === 'strong') return 'STRONG';

    return 'NOT_EVALUATED';
}

function createEmptyProgress(userId: string): UserProgress {
    return {
        userId,
        readinessScore: 0,
        streak: 0,
        lastSessionDate: '',
        topics: {},
        questionsHistory: {},
    };
}

export async function loadPersistedProgramProgress(userId: string, programId: string): Promise<UserProgress> {
    const [topicRows, questionRows] = await Promise.all([
        db
            .select()
            .from(topicProgress)
            .where(and(eq(topicProgress.userId, userId), eq(topicProgress.programId, programId))),
        db
            .select()
            .from(questionProgress)
            .where(and(eq(questionProgress.userId, userId), eq(questionProgress.programId, programId))),
    ]);

    const progress = createEmptyProgress(userId);

    for (const row of topicRows) {
        progress.topics[row.topicId] = {
            topicId: row.topicId,
            attempts: row.attempts,
            correct: row.correctCount,
            accuracy: Number(row.accuracy),
            status: normalizeTopicStatus(row.status),
            masteryLevel: row.masteryLevel,
        };
    }

    for (const row of questionRows) {
        progress.questionsHistory[row.questionId] = {
            lastAttempt: row.lastAttemptAt?.toISOString() || '',
            lastSeen: row.lastSeenAt?.toISOString() || '',
            nextReview: row.nextReviewAt?.toISOString() || '',
            masteryLevel: row.masteryLevel,
            consecutiveSuccesses: row.consecutiveSuccesses,
            errorCount: row.errorCount,
        };
    }

    const readinessValues = topicRows
        .map((row) => Number(row.readinessScore))
        .filter((value) => Number.isFinite(value));

    progress.readinessScore = readinessValues.length > 0
        ? Math.round(readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length)
        : 0;

    return progress;
}

export async function ensureProgramEnrollment(userId: string, programId: string) {
    const existing = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, userId), eq(enrollments.programId, programId)),
    });

    if (existing) return existing;

    const inserted = await db.insert(enrollments).values({
        userId,
        programId,
        accessType: 'self_enrolled',
        accessStatus: 'active',
    }).returning();

    return inserted[0];
}

export async function createProgramStudySession(userId: string, programId: string, engineSessionRef: string, mode: string, targetTopicId?: string) {
    const existingProgram = await db.query.programs.findFirst({
        where: eq(programs.id, programId),
    });

    if (!existingProgram) {
        throw new Error('Program not found');
    }

    await ensureProgramEnrollment(userId, programId);

    await db.insert(studySessions).values({
        userId,
        programId,
        mode,
        targetTopicId: targetTopicId || null,
        engineSessionRef,
        sessionStatus: 'started',
    });
}

function calculateTopicReadiness(topic: TopicProgress, questionCount: number, seenCount: number) {
    const coverage = questionCount > 0 ? Math.min(100, Math.round((seenCount / questionCount) * 100)) : 0;
    const readiness = Math.round((coverage * 0.3) + (topic.accuracy * 0.7));

    return {
        coverage,
        readiness,
    };
}

export async function syncPersistedProgramProgress(
    userId: string,
    programId: string,
    progress: UserProgress,
    questionMap: ProgramQuestionMapItem[],
) {
    const questionCountsByTopic = new Map<string, number>();
    const seenCountsByTopic = new Map<string, number>();

    for (const item of questionMap) {
        questionCountsByTopic.set(item.topicId, (questionCountsByTopic.get(item.topicId) || 0) + 1);
        if (progress.questionsHistory[item.id]) {
            seenCountsByTopic.set(item.topicId, (seenCountsByTopic.get(item.topicId) || 0) + 1);
        }
    }

    for (const [topicId, topic] of Object.entries(progress.topics)) {
        const { coverage, readiness } = calculateTopicReadiness(
            topic,
            questionCountsByTopic.get(topicId) || 0,
            seenCountsByTopic.get(topicId) || 0,
        );

        await db
            .insert(topicProgress)
            .values({
                userId,
                programId,
                topicId,
                attempts: topic.attempts,
                correctCount: topic.correct,
                accuracy: String(topic.accuracy),
                coverage: String(coverage),
                readinessScore: String(readiness),
                masteryLevel: topic.masteryLevel,
                status: topic.status,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [topicProgress.userId, topicProgress.programId, topicProgress.topicId],
                set: {
                    attempts: topic.attempts,
                    correctCount: topic.correct,
                    accuracy: String(topic.accuracy),
                    coverage: String(coverage),
                    readinessScore: String(readiness),
                    masteryLevel: topic.masteryLevel,
                    status: topic.status,
                    updatedAt: new Date(),
                },
            });
    }

    for (const [questionId, history] of Object.entries(progress.questionsHistory)) {
        const item = questionMap.find((question) => question.id === questionId);
        if (!item) continue;

        await db
            .insert(questionProgress)
            .values({
                userId,
                programId,
                questionId,
                attempts: history.errorCount + history.consecutiveSuccesses,
                correctCount: history.consecutiveSuccesses,
                errorCount: history.errorCount,
                consecutiveSuccesses: history.consecutiveSuccesses,
                masteryLevel: history.masteryLevel,
                lastAttemptAt: history.lastAttempt ? new Date(history.lastAttempt) : null,
                lastSeenAt: history.lastSeen ? new Date(history.lastSeen) : null,
                nextReviewAt: history.nextReview ? new Date(history.nextReview) : null,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [questionProgress.userId, questionProgress.programId, questionProgress.questionId],
                set: {
                    attempts: history.errorCount + history.consecutiveSuccesses,
                    correctCount: history.consecutiveSuccesses,
                    errorCount: history.errorCount,
                    consecutiveSuccesses: history.consecutiveSuccesses,
                    masteryLevel: history.masteryLevel,
                    lastAttemptAt: history.lastAttempt ? new Date(history.lastAttempt) : null,
                    lastSeenAt: history.lastSeen ? new Date(history.lastSeen) : null,
                    nextReviewAt: history.nextReview ? new Date(history.nextReview) : null,
                    updatedAt: new Date(),
                },
            });
    }
}
