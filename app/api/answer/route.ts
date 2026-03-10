import { NextResponse } from 'next/server';
import { processStep } from '@/lib/engine';
<<<<<<< HEAD
import { ensurePlatformUser } from '@/lib/db/account';
import { loadPersistedProgramProgress, syncPersistedProgramProgress } from '@/lib/db/program-progress';
import { getProgramQuestionMap, processProgramStep } from '@/lib/program-session';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { questionId, selectedOptionId, history, progress, mode, targetId, sessionId, programId } = await request.json();
=======
import { getUserProgress, saveUserProgress } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { questionId, selectedOptionId, history, progress, mode, targetId, sessionId } = await request.json();
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2

        if (!progress) {
            throw new Error('Progress data is required');
        }

        if (!sessionId) {
            throw new Error('sessionId is required for deterministic execution');
        }

<<<<<<< HEAD
        if (programId) {
            const supabase = await createClient();
            const { data } = await supabase.auth.getUser();

            let effectiveProgress = progress;
            if (data.user) {
                await ensurePlatformUser(data.user);
                effectiveProgress = await loadPersistedProgramProgress(data.user.id, programId);
            }

            const result = await processProgramStep(effectiveProgress, programId, questionId, selectedOptionId, history, sessionId, mode, targetId);

            if (data.user) {
                const questionMap = await getProgramQuestionMap(programId);
                await syncPersistedProgramProgress(data.user.id, programId, result.updatedProgress, questionMap);
            }

            return NextResponse.json({
                isCorrect: result.isCorrect,
                explanation: result.explanation,
                correctOptionId: result.correctOptionId,
                nextQuestion: result.nextQuestion,
                updatedProgress: result.updatedProgress,
                totalQuestions: result.totalQuestions,
                programId,
                programTitle: result.programTitle,
                sessionSummary: {
                    totalSolved: history.length + 1,
                    lastResult: result.isCorrect ? 'correct' : 'incorrect'
                }
            });
        }

=======
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
        const result = processStep(progress, questionId, selectedOptionId, history, sessionId, mode, targetId);

        // Retornar feedback E progresso atualizado
        return NextResponse.json({
            isCorrect: result.isCorrect,
            explanation: result.explanation,
            correctOptionId: result.correctOptionId,
            nextQuestion: result.nextQuestion,
            updatedProgress: result.updatedProgress,
            totalQuestions: result.totalQuestions,
            sessionSummary: {
                totalSolved: history.length + 1,
                lastResult: result.isCorrect ? 'correct' : 'incorrect'
            }
        });
    } catch (error) {
        console.error('BFF Error:', error);
        return NextResponse.json({ error: 'Erro no processamento cognitivo' }, { status: 500 });
    }
}
