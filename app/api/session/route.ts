import { NextResponse } from 'next/server';
import { startSession } from '@/lib/engine';
import { getUserProgress } from '@/lib/storage';

export async function POST(request: Request) {
    try {
        const { progress, mode, targetId } = await request.json();
        const { sessionId, question } = startSession(progress, mode, targetId);

        return NextResponse.json({
            sessionId,
            firstQuestion: question,
            mode,
            targetId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
    } catch (error) {
        console.error('API Session Error:', error);
        return NextResponse.json({ error: 'Falha ao iniciar sessão' }, { status: 500 });
    }
}
