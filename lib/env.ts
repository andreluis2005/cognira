import { z } from 'zod';

const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = clientEnvSchema.extend({
    DATABASE_URL: z.string().min(1).optional(),
    AI_PROVIDER_NAME: z.string().min(1).optional(),
    AI_PROVIDER_BASE_URL: z.string().url().optional(),
    AI_PROVIDER_MODEL: z.string().min(1).optional(),
    AI_PROVIDER_API_KEY: z.string().min(1).optional(),
});

function formatError(error: z.ZodError) {
    return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
}

function parseClientEnv() {
    const parsed = clientEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    if (!parsed.success) {
        throw new Error(`Invalid client environment variables: ${formatError(parsed.error)}`);
    }

    return parsed.data;
}

function parseServerEnv() {
    const parsed = serverEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        DATABASE_URL: process.env.DATABASE_URL,
        AI_PROVIDER_NAME: process.env.AI_PROVIDER_NAME,
        AI_PROVIDER_BASE_URL: process.env.AI_PROVIDER_BASE_URL,
        AI_PROVIDER_MODEL: process.env.AI_PROVIDER_MODEL,
        AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
    });

    if (!parsed.success) {
        throw new Error(`Invalid server environment variables: ${formatError(parsed.error)}`);
    }

    return parsed.data;
}

export const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function getClientEnv() {
    return parseClientEnv();
}

export function getServerEnv() {
    return parseServerEnv();
}
