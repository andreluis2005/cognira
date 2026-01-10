import { NextResponse } from 'next/server';
import { processStep } from '@/lib/engine';
import { getUserProgress, saveUserProgress } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { questionId, selectedOptionId, history, progress, mode, targetId } = await request.json();

        if (!progress) {
            throw new Error('Progress data is required');
        }

        const result = processStep(progress, questionId, selectedOptionId, history, mode, targetId);

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
