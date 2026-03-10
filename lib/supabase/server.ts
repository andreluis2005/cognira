import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getClientEnv } from '@/lib/env';

export async function createClient() {
    const cookieStore = await cookies();
    const clientEnv = getClientEnv();

    return createServerClient(
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
        clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                    } catch {
                        // Middleware keeps the auth session synchronized when cookie writes are not available here.
                    }
                },
            },
        },
    );
}
