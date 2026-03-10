import { NextResponse } from 'next/server';
import { startSession } from '@/lib/engine';
import { createProgramStudySession, loadPersistedProgramProgress } from '@/lib/db/program-progress';
import { ensurePlatformUser } from '@/lib/db/account';
import { startProgramSession } from '@/lib/program-session';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { progress, mode, targetId, programId } = await request.json();

        if (programId) {
            const supabase = await createClient();
            const { data } = await supabase.auth.getUser();

            let effectiveProgress = progress;
            if (data.user) {
                await ensurePlatformUser(data.user);
                effectiveProgress = await loadPersistedProgramProgress(data.user.id, programId);
            }

            const result = await startProgramSession(effectiveProgress, programId, mode, targetId);

            if (data.user) {
                await createProgramStudySession(data.user.id, programId, result.sessionId, mode, targetId);
            }

            return NextResponse.json({
                sessionId: result.sessionId,
                firstQuestion: result.question,
                totalQuestions: result.totalQuestions,
                mode,
                targetId,
                programId,
                programTitle: result.programTitle,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            });
        }

        const { sessionId, question, totalQuestions } = startSession(progress, mode, targetId);

        return NextResponse.json({
            sessionId,
            firstQuestion: question,
            totalQuestions,
            mode,
            targetId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
    } catch (error) {
        console.error('API Session Error:', error);
        return NextResponse.json({ error: 'Falha ao iniciar sessão' }, { status: 500 });
    }
}
