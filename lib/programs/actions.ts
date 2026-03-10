'use server';

import { redirect } from 'next/navigation';
import { ensurePlatformUser } from '@/lib/db/account';
import { ensureProgramEnrollment } from '@/lib/db/program-progress';
import { createClient } from '@/lib/supabase/server';

export async function enrollAndStartProgram(formData: FormData) {
    const programId = String(formData.get('program_id') || '');
    const programSlug = String(formData.get('program_slug') || '');

    if (!programId) {
        redirect('/programs');
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        const target = programSlug ? `/programs/${programSlug}` : '/programs';
        redirect(`/signup?redirectTo=${encodeURIComponent(target)}`);
    }

    await ensurePlatformUser(data.user);
    await ensureProgramEnrollment(data.user.id, programId);

    redirect(`/session?programId=${programId}&mode=smart`);
}
