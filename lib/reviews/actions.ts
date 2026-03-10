'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ensurePlatformUser } from '@/lib/db/account';
import { db } from '@/lib/db/client';
import { enrollments, programReviews } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';

export async function upsertProgramReview(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const rating = Number(formData.get('rating') || 0);
    const title = String(formData.get('title') || '').trim();
    const body = String(formData.get('body') || '').trim();

    if (!programId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
        redirect(`/learn/programs/${programId}?error=Avaliacao%20invalida`);
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        redirect('/login');
    }

    await ensurePlatformUser(data.user);

    const enrollment = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, data.user.id), eq(enrollments.programId, programId)),
    });

    if (!enrollment) {
        redirect(`/programs?error=Voce%20precisa%20iniciar%20o%20programa%20antes%20de%20avaliar`);
    }

    await db
        .insert(programReviews)
        .values({
            programId,
            userId: data.user.id,
            rating,
            title: title || null,
            body: body || null,
        })
        .onConflictDoUpdate({
            target: [programReviews.programId, programReviews.userId],
            set: {
                rating,
                title: title || null,
                body: body || null,
                updatedAt: new Date(),
            },
        });

    revalidatePath('/programs');
    revalidatePath(`/learn/programs/${programId}`);
    redirect(`/learn/programs/${programId}?reviewSaved=1`);
}
