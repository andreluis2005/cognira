import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ programId: string }> },
) {
    try {
        const { programId } = await params;

        const rows = await db
            .select({
                id: topics.id,
                title: topics.title,
                description: topics.description,
                examWeight: topics.examWeight,
            })
            .from(topics)
            .where(eq(topics.programId, programId))
            .orderBy(asc(topics.position), asc(topics.createdAt));

        return NextResponse.json({ topics: rows });
    } catch (error) {
        console.error('Program topics API error:', error);
        return NextResponse.json({ error: 'Falha ao carregar topicos do programa' }, { status: 500 });
    }
}
