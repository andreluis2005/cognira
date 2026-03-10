import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { aiGenerationItems, aiGenerationJobs, creatorProfiles, enrollments, programTrails, programReviews, programs, questionOptions, questions, studySessions, topicProgress, topics } from '@/lib/db/schema';

function buildCreatorLeaderboard(
    creatorRows: Array<{
        id: string;
        displayName: string;
        headline: string | null;
        isVerified: boolean;
        creatorScore: string;
    }>,
    publishedPrograms: Array<{ creatorProfileId: string; programId: string }>,
    enrollmentRows: Array<{ programId: string }>,
    reviewRows: Array<{ programId: string; rating: number }>,
) {
    const programsByCreator = new Map<string, string[]>();
    publishedPrograms.forEach((row) => {
        const current = programsByCreator.get(row.creatorProfileId) || [];
        current.push(row.programId);
        programsByCreator.set(row.creatorProfileId, current);
    });

    const enrollmentCountByProgram = new Map<string, number>();
    enrollmentRows.forEach((row) => {
        enrollmentCountByProgram.set(row.programId, (enrollmentCountByProgram.get(row.programId) || 0) + 1);
    });

    const ratingByProgram = new Map<string, number[]>();
    reviewRows.forEach((row) => {
        const current = ratingByProgram.get(row.programId) || [];
        current.push(row.rating);
        ratingByProgram.set(row.programId, current);
    });

    return creatorRows
        .map((creator) => {
            const creatorPrograms = programsByCreator.get(creator.id) || [];
            const learnerCount = creatorPrograms.reduce((sum, programId) => sum + (enrollmentCountByProgram.get(programId) || 0), 0);
            const ratings = creatorPrograms.flatMap((programId) => ratingByProgram.get(programId) || []);
            const avgRating = ratings.length > 0
                ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
                : null;

            const computedScore = (
                (avgRating || 0) * 20
                + Math.min(creatorPrograms.length * 8, 24)
                + Math.min(learnerCount * 2, 36)
                + (creator.isVerified ? 5 : 0)
            );

            return {
                id: creator.id,
                displayName: creator.displayName,
                headline: creator.headline,
                isVerified: creator.isVerified,
                creatorScore: Number(creator.creatorScore || computedScore.toFixed(2)),
                publishedPrograms: creatorPrograms.length,
                learnerCount,
                avgRating,
                reviewCount: ratings.length,
            };
        })
        .sort((a, b) => b.creatorScore - a.creatorScore);
}

export async function listPublishedPrograms() {
    const rows = await db
        .select({
            id: programs.id,
            title: programs.title,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            subjectArea: programs.subjectArea,
            examType: programs.examType,
            monetizationType: programs.monetizationType,
            creatorDisplayName: creatorProfiles.displayName,
        })
        .from(programs)
        .leftJoin(creatorProfiles, eq(programs.creatorProfileId, creatorProfiles.id))
        .where(eq(programs.status, 'published'))
        .orderBy(desc(programs.publishedAt), desc(programs.createdAt));

    const reviewRows = await db
        .select({
            programId: programReviews.programId,
            rating: programReviews.rating,
        })
        .from(programReviews);

    const ratingsByProgram = new Map<string, number[]>();
    reviewRows.forEach((row) => {
        const current = ratingsByProgram.get(row.programId) || [];
        current.push(row.rating);
        ratingsByProgram.set(row.programId, current);
    });

    return rows.map((row) => {
        const ratings = ratingsByProgram.get(row.id) || [];
        return {
            ...row,
            reviewCount: ratings.length,
            avgRating: ratings.length > 0
                ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
                : null,
        };
    });
}

export async function listRecommendedPrograms(limit = 6, options?: { excludeProgramIds?: string[] }) {
    const programsList = await listPublishedPrograms();
    const excluded = new Set(options?.excludeProgramIds || []);

    return programsList
        .filter((program) => !excluded.has(program.id))
        .map((program) => ({
            ...program,
            recommendationScore: (
                ((program.avgRating || 0) * 20)
                + Math.min(program.reviewCount * 4, 28)
                + (program.examType ? 4 : 0)
            ),
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
}

export async function getPublishedProgramBySlug(slug: string) {
    const results = await db
        .select({
            id: programs.id,
            title: programs.title,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            longDescription: programs.longDescription,
            subjectArea: programs.subjectArea,
            examType: programs.examType,
            monetizationType: programs.monetizationType,
            creatorDisplayName: creatorProfiles.displayName,
        })
        .from(programs)
        .leftJoin(creatorProfiles, eq(programs.creatorProfileId, creatorProfiles.id))
        .where(eq(programs.slug, slug))
        .limit(1);

    const program = results[0] ?? null;
    if (!program) {
        return null;
    }

    const reviewRows = await db
        .select({
            rating: programReviews.rating,
            title: programReviews.title,
            body: programReviews.body,
            createdAt: programReviews.createdAt,
        })
        .from(programReviews)
        .where(eq(programReviews.programId, program.id))
        .orderBy(desc(programReviews.createdAt));

    const [trailRows, topicRows, questionRows] = await Promise.all([
        db
            .select({
                id: programTrails.id,
                title: programTrails.title,
                description: programTrails.description,
                position: programTrails.position,
            })
            .from(programTrails)
            .where(eq(programTrails.programId, program.id))
            .orderBy(asc(programTrails.position), asc(programTrails.createdAt)),
        db
            .select({
                id: topics.id,
                trailId: topics.trailId,
                title: topics.title,
                description: topics.description,
                examWeight: topics.examWeight,
                position: topics.position,
            })
            .from(topics)
            .where(eq(topics.programId, program.id))
            .orderBy(asc(topics.position), asc(topics.createdAt)),
        db
            .select({
                id: questions.id,
                topicId: questions.topicId,
            })
            .from(questions)
            .where(eq(questions.programId, program.id)),
    ]);

    const questionCountByTopic = new Map<string, number>();
    questionRows.forEach((row) => {
        questionCountByTopic.set(row.topicId, (questionCountByTopic.get(row.topicId) || 0) + 1);
    });

    const trailTitleById = new Map(trailRows.map((trail) => [trail.id, trail.title]));
    const topicPreview = topicRows.slice(0, 6).map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        examWeight: topic.examWeight,
        trailTitle: topic.trailId ? trailTitleById.get(topic.trailId) || null : null,
        questionCount: questionCountByTopic.get(topic.id) || 0,
    }));

    const ratings = reviewRows.map((row) => row.rating);

    return {
        ...program,
        trailCount: trailRows.length,
        topicCount: topicRows.length,
        questionCount: questionRows.length,
        topicPreview,
        reviewCount: ratings.length,
        avgRating: ratings.length > 0
            ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
            : null,
        reviews: reviewRows.slice(0, 5),
    };
}

export async function getProgramEnrollmentState(userId: string, programId: string) {
    const enrollment = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, userId), eq(enrollments.programId, programId)),
    });

    if (!enrollment) {
        return {
            isEnrolled: false,
            enrollment: null,
        };
    }

    const latestSession = await db.query.studySessions.findFirst({
        where: and(eq(studySessions.userId, userId), eq(studySessions.programId, programId)),
        orderBy: (sessions, { desc: orderDesc }) => [orderDesc(sessions.startedAt)],
    });

    return {
        isEnrolled: true,
        enrollment,
        hasStarted: Boolean(latestSession),
    };
}

export async function listCreatorPrograms(userId: string) {
    return db
        .select({
            id: programs.id,
            title: programs.title,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            subjectArea: programs.subjectArea,
            monetizationType: programs.monetizationType,
            status: programs.status,
            reviewStatus: programs.reviewStatus,
            createdAt: programs.createdAt,
        })
        .from(programs)
        .innerJoin(creatorProfiles, eq(programs.creatorProfileId, creatorProfiles.id))
        .where(eq(creatorProfiles.userId, userId))
        .orderBy(desc(programs.createdAt));
}

export async function getCreatorProgramById(userId: string, programId: string) {
    const programRows = await db
        .select({
            id: programs.id,
            title: programs.title,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            longDescription: programs.longDescription,
            subjectArea: programs.subjectArea,
            examType: programs.examType,
            monetizationType: programs.monetizationType,
            visibility: programs.visibility,
            status: programs.status,
            reviewStatus: programs.reviewStatus,
        })
        .from(programs)
        .innerJoin(creatorProfiles, eq(programs.creatorProfileId, creatorProfiles.id))
        .where(eq(programs.id, programId))
        .limit(1);

    const program = programRows[0];
    if (!program) {
        return null;
    }

    const ownerRows = await db
        .select({ userId: creatorProfiles.userId })
        .from(programs)
        .innerJoin(creatorProfiles, eq(programs.creatorProfileId, creatorProfiles.id))
        .where(eq(programs.id, programId))
        .limit(1);

    if (!ownerRows[0] || ownerRows[0].userId !== userId) {
        return null;
    }

    const trailRows = await db
        .select({
            id: programTrails.id,
            title: programTrails.title,
            slug: programTrails.slug,
            description: programTrails.description,
            position: programTrails.position,
            status: programTrails.status,
        })
        .from(programTrails)
        .where(eq(programTrails.programId, programId))
        .orderBy(programTrails.position, programTrails.createdAt);

    const topicRows = await db
        .select({
            id: topics.id,
            trailId: topics.trailId,
            title: topics.title,
            slug: topics.slug,
            description: topics.description,
            examWeight: topics.examWeight,
            position: topics.position,
            status: topics.status,
        })
        .from(topics)
        .where(eq(topics.programId, programId))
        .orderBy(topics.position, topics.createdAt);

    const questionRows = await db
        .select({
            id: questions.id,
            topicId: questions.topicId,
            stem: questions.stem,
            explanation: questions.explanation,
            difficultyLevel: questions.difficultyLevel,
            status: questions.status,
            createdAt: questions.createdAt,
            optionId: questionOptions.id,
            optionLabel: questionOptions.label,
            optionBody: questionOptions.body,
            optionIsCorrect: questionOptions.isCorrect,
        })
        .from(questions)
        .leftJoin(questionOptions, eq(questionOptions.questionId, questions.id))
        .where(eq(questions.programId, programId))
        .orderBy(desc(questions.createdAt), questionOptions.position);

    const groupedQuestions = questionRows.reduce<
        Array<{
            id: string;
            topicId: string;
            stem: string;
            explanation: string;
            difficultyLevel: string;
            status: string;
            createdAt: Date;
            options: Array<{ id: string; label: string; body: string; isCorrect: boolean }>;
        }>
    >((acc, row) => {
        const existing = acc.find((item) => item.id === row.id);

        if (existing) {
            if (row.optionId) {
                existing.options.push({
                    id: row.optionId,
                    label: row.optionLabel || '',
                    body: row.optionBody || '',
                    isCorrect: Boolean(row.optionIsCorrect),
                });
            }
            return acc;
        }

        acc.push({
            id: row.id,
            topicId: row.topicId,
            stem: row.stem,
            explanation: row.explanation,
            difficultyLevel: row.difficultyLevel,
            status: row.status,
            createdAt: row.createdAt,
            options: row.optionId
                ? [{
                    id: row.optionId,
                    label: row.optionLabel || '',
                    body: row.optionBody || '',
                    isCorrect: Boolean(row.optionIsCorrect),
                }]
                : [],
        });

        return acc;
    }, []);

    const aiJobRows = await db
        .select({
            id: aiGenerationJobs.id,
            topicId: aiGenerationJobs.topicId,
            trailId: aiGenerationJobs.trailId,
            status: aiGenerationJobs.status,
            providerName: aiGenerationJobs.providerName,
            generatedCount: aiGenerationJobs.generatedCount,
            createdAt: aiGenerationJobs.createdAt,
            completedAt: aiGenerationJobs.completedAt,
            promptText: aiGenerationJobs.promptText,
        })
        .from(aiGenerationJobs)
        .where(and(eq(aiGenerationJobs.userId, userId), eq(aiGenerationJobs.programId, programId)))
        .orderBy(desc(aiGenerationJobs.createdAt));

    const aiItemRows = await db
        .select({
            id: aiGenerationItems.id,
            jobId: aiGenerationItems.jobId,
            draftPayloadJson: aiGenerationItems.draftPayloadJson,
            validationStatus: aiGenerationItems.validationStatus,
            reviewNotes: aiGenerationItems.reviewNotes,
            approvedAt: aiGenerationItems.approvedAt,
        })
        .from(aiGenerationItems)
        .innerJoin(aiGenerationJobs, eq(aiGenerationItems.jobId, aiGenerationJobs.id))
        .where(and(eq(aiGenerationJobs.userId, userId), eq(aiGenerationJobs.programId, programId)))
        .orderBy(desc(aiGenerationItems.id));

    return {
        ...program,
        trails: trailRows,
        topics: topicRows,
        questions: groupedQuestions,
        aiJobs: aiJobRows,
        aiItems: aiItemRows,
    };
}

export async function listLearnerPrograms(userId: string) {
    const enrolledRows = await db
        .select({
            enrollmentId: enrollments.id,
            accessType: enrollments.accessType,
            enrolledAt: enrollments.enrolledAt,
            programId: programs.id,
            title: programs.title,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            subjectArea: programs.subjectArea,
            monetizationType: programs.monetizationType,
        })
        .from(enrollments)
        .innerJoin(programs, eq(enrollments.programId, programs.id))
        .where(eq(enrollments.userId, userId))
        .orderBy(desc(enrollments.enrolledAt));

    const progressRows = await db
        .select()
        .from(topicProgress)
        .where(eq(topicProgress.userId, userId));

    const sessionRows = await db
        .select({
            programId: studySessions.programId,
            startedAt: studySessions.startedAt,
        })
        .from(studySessions)
        .where(eq(studySessions.userId, userId))
        .orderBy(desc(studySessions.startedAt));

    const reviewsRows = await db
        .select({
            programId: programReviews.programId,
            rating: programReviews.rating,
        })
        .from(programReviews);

    const groupedProgress = new Map<string, typeof progressRows>();
    progressRows.forEach((row) => {
        const current = groupedProgress.get(row.programId) || [];
        current.push(row);
        groupedProgress.set(row.programId, current);
    });

    const latestSessionByProgram = new Map<string, Date>();
    sessionRows.forEach((row) => {
        if (!row.programId || latestSessionByProgram.has(row.programId)) return;
        latestSessionByProgram.set(row.programId, row.startedAt);
    });

    const ratingByProgram = new Map<string, number[]>();
    reviewsRows.forEach((row) => {
        const current = ratingByProgram.get(row.programId) || [];
        current.push(row.rating);
        ratingByProgram.set(row.programId, current);
    });

    return enrolledRows.map((row) => {
        const rows = groupedProgress.get(row.programId) || [];
        const avgReadiness = rows.length > 0
            ? Math.round(rows.reduce((sum, item) => sum + Number(item.readinessScore), 0) / rows.length)
            : 0;
        const avgAccuracy = rows.length > 0
            ? Math.round(rows.reduce((sum, item) => sum + Number(item.accuracy), 0) / rows.length)
            : 0;
        const ratings = ratingByProgram.get(row.programId) || [];
        const avgRating = ratings.length > 0
            ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
            : null;

        return {
            enrollmentId: row.enrollmentId,
            accessType: row.accessType,
            enrolledAt: row.enrolledAt,
            programId: row.programId,
            title: row.title,
            slug: row.slug,
            shortDescription: row.shortDescription,
            subjectArea: row.subjectArea,
            monetizationType: row.monetizationType,
            readinessScore: avgReadiness,
            accuracy: avgAccuracy,
            topicCount: rows.length,
            latestSessionAt: latestSessionByProgram.get(row.programId) || null,
            avgRating,
        };
    });
}

export async function getLearnerProgramById(userId: string, programId: string) {
    const programsList = await listLearnerPrograms(userId);
    const program = programsList.find((item) => item.programId === programId);

    if (!program) {
        return null;
    }

    const [topicRows, progressRows, trailRows, questionRows] = await Promise.all([
        db
            .select({
                id: topics.id,
                trailId: topics.trailId,
                title: topics.title,
                description: topics.description,
                examWeight: topics.examWeight,
                position: topics.position,
            })
            .from(topics)
            .where(eq(topics.programId, programId))
            .orderBy(asc(topics.position), asc(topics.createdAt)),
        db
            .select()
            .from(topicProgress)
            .where(eq(topicProgress.userId, userId)),
        db
            .select({
                id: programTrails.id,
                title: programTrails.title,
            })
            .from(programTrails)
            .where(eq(programTrails.programId, programId)),
        db
            .select({
                id: questions.id,
                topicId: questions.topicId,
            })
            .from(questions)
            .where(eq(questions.programId, programId)),
    ]);

    const trailMap = new Map(trailRows.map((trail) => [trail.id, trail.title]));
    const progressMap = new Map(
        progressRows
            .filter((row) => row.programId === programId)
            .map((row) => [row.topicId, row]),
    );
    const questionCountMap = new Map<string, number>();

    questionRows.forEach((row) => {
        questionCountMap.set(row.topicId, (questionCountMap.get(row.topicId) || 0) + 1);
    });

    const topicDetails = topicRows.map((topic) => {
        const progress = progressMap.get(topic.id);

        return {
            id: topic.id,
            title: topic.title,
            description: topic.description,
            examWeight: topic.examWeight,
            trailTitle: topic.trailId ? trailMap.get(topic.trailId) || null : null,
            questionCount: questionCountMap.get(topic.id) || 0,
            attempts: progress?.attempts || 0,
            accuracy: progress ? Math.round(Number(progress.accuracy)) : 0,
            coverage: progress ? Math.round(Number(progress.coverage)) : 0,
            readinessScore: progress ? Math.round(Number(progress.readinessScore)) : 0,
            masteryLevel: progress?.masteryLevel || 0,
            status: progress?.status || 'not_evaluated',
            updatedAt: progress?.updatedAt || null,
        };
    });

    const reviewRows = await db
        .select({
            id: programReviews.id,
            userId: programReviews.userId,
            rating: programReviews.rating,
            title: programReviews.title,
            body: programReviews.body,
            createdAt: programReviews.createdAt,
        })
        .from(programReviews)
        .where(eq(programReviews.programId, programId))
        .orderBy(desc(programReviews.createdAt));

    const ownReview = reviewRows.find((row) => row.userId === userId) || null;
    const ratings = reviewRows.map((row) => row.rating);

    return {
        ...program,
        topicDetails,
        ownReview,
        reviewCount: ratings.length,
        avgRating: ratings.length > 0
            ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1))
            : null,
        recentReviews: reviewRows.slice(0, 5),
    };
}

export async function listTopCreators(limit = 6) {
    const creatorRows = await db
        .select({
            id: creatorProfiles.id,
            displayName: creatorProfiles.displayName,
            headline: creatorProfiles.headline,
            isVerified: creatorProfiles.isVerified,
            creatorScore: creatorProfiles.creatorScore,
        })
        .from(creatorProfiles);

    const publishedPrograms = await db
        .select({
            creatorProfileId: programs.creatorProfileId,
            programId: programs.id,
        })
        .from(programs)
        .where(eq(programs.status, 'published'));

    const enrollmentRows = await db
        .select({
            programId: enrollments.programId,
        })
        .from(enrollments);

    const reviewRows = await db
        .select({
            programId: programReviews.programId,
            rating: programReviews.rating,
        })
        .from(programReviews);

    return buildCreatorLeaderboard(creatorRows, publishedPrograms, enrollmentRows, reviewRows)
        .slice(0, limit);
}

export async function getCreatorStudioMetrics(userId: string) {
    const [creatorRows, publishedPrograms, draftProgramRows, enrollmentRows, reviewRows] = await Promise.all([
        db
            .select({
                id: creatorProfiles.id,
                userId: creatorProfiles.userId,
                displayName: creatorProfiles.displayName,
                headline: creatorProfiles.headline,
                isVerified: creatorProfiles.isVerified,
                creatorScore: creatorProfiles.creatorScore,
            })
            .from(creatorProfiles),
        db
            .select({
                creatorProfileId: programs.creatorProfileId,
                programId: programs.id,
            })
            .from(programs)
            .where(eq(programs.status, 'published')),
        db
            .select({
                creatorProfileId: programs.creatorProfileId,
                status: programs.status,
            })
            .from(programs),
        db
            .select({
                programId: enrollments.programId,
            })
            .from(enrollments),
        db
            .select({
                programId: programReviews.programId,
                rating: programReviews.rating,
            })
            .from(programReviews),
    ]);

    const leaderboard = buildCreatorLeaderboard(
        creatorRows.map((row) => ({
            id: row.id,
            displayName: row.displayName,
            headline: row.headline,
            isVerified: row.isVerified,
            creatorScore: row.creatorScore,
        })),
        publishedPrograms,
        enrollmentRows,
        reviewRows,
    );

    const creator = creatorRows.find((row) => row.userId === userId);

    if (!creator) {
        return null;
    }

    const rank = leaderboard.findIndex((entry) => entry.id === creator.id);
    const creatorPrograms = draftProgramRows.filter((row) => row.creatorProfileId === creator.id);
    const draftCount = creatorPrograms.filter((row) => row.status === 'draft').length;
    const archivedCount = creatorPrograms.filter((row) => row.status === 'archived').length;
    const publishedCount = creatorPrograms.filter((row) => row.status === 'published').length;
    const creatorMetrics = leaderboard.find((entry) => entry.id === creator.id);

    return {
        creatorId: creator.id,
        displayName: creator.displayName,
        headline: creator.headline,
        isVerified: creator.isVerified,
        creatorScore: creatorMetrics?.creatorScore || 0,
        avgRating: creatorMetrics?.avgRating || null,
        reviewCount: creatorMetrics?.reviewCount || 0,
        learnerCount: creatorMetrics?.learnerCount || 0,
        publishedPrograms: publishedCount,
        draftPrograms: draftCount,
        archivedPrograms: archivedCount,
        leaderboardPosition: rank >= 0 ? rank + 1 : null,
        leaderboardSize: leaderboard.length,
    };
}

export async function listProgramsForReview() {
    return db
        .select({
            id: programs.id,
            title: programs.title,
            slug: programs.slug,
            shortDescription: programs.shortDescription,
            subjectArea: programs.subjectArea,
            examType: programs.examType,
            monetizationType: programs.monetizationType,
            status: programs.status,
            reviewStatus: programs.reviewStatus,
            updatedAt: programs.updatedAt,
            createdAt: programs.createdAt,
            creatorDisplayName: creatorProfiles.displayName,
        })
        .from(programs)
        .innerJoin(creatorProfiles, eq(programs.creatorProfileId, creatorProfiles.id))
        .where(eq(programs.reviewStatus, 'submitted'))
        .orderBy(desc(programs.updatedAt), desc(programs.createdAt));
}
